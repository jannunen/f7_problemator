import axios from 'axios';
import { endpoint } from '@js/api.js'
import { authToken, setAuthToken } from '@js/authToken.js'

let logoutHandler = null
let tokenRefreshHandler = null
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error)
        } else {
            resolve(token)
        }
    })
    failedQueue = []
}

export function setLogoutHandler(handler) {
    logoutHandler = handler
}

export function setTokenRefreshHandler(handler) {
    tokenRefreshHandler = handler
}

// The refresh endpoint's own URL, so its 401s can be told apart from every
// other request's. Keying on the HTTP status alone would treat a failed
// refresh exactly like any other 401 and route it back through the retry/
// queue logic below — see classifyAuthError's 'refresh-request' case for why
// that loops.
const REFRESH_URL = endpoint + '/auth/otp/refresh'

/**
 * Pure classification of what a 401 means for the session, kept free of
 * axios so it can be tested without mocking interceptors.
 *
 * Deliberately does not look at the response body — this app's own
 * endpoints already disagree on its shape (`{"message":"Unauthenticated."}`
 * from Laravel's default, `{"error":"Unauthenticated"}` from the coaching
 * endpoints, and others may differ again). The HTTP status is the contract.
 *
 * Returns one of:
 *  - 'ignore'          not a 401; nothing to do here
 *  - 'refresh-request'  the 401 came from the refresh endpoint itself. Left
 *                        for the refresh flow's own try/catch to handle
 *                        rather than being routed back through the queue: at
 *                        the moment this fires isRefreshing is still true, so
 *                        queuing it would push it behind a refresh that is,
 *                        at that very instant, the one failing — a promise
 *                        waiting on processQueue(), which nothing calls until
 *                        this same request settles. That deadlock is what
 *                        left the Messages page (and anything else mid-
 *                        request when a refresh failed) stuck on "Loading…"
 *                        forever.
 *  - 'unrecoverable'    no token to refresh with, or a request that was
 *                        already retried once with a fresh token and still
 *                        failed — refreshing again would only repeat it
 *  - 'queue'            a refresh is already in flight; wait for it
 *  - 'refresh'          attempt a token refresh
 */
export function classifyAuthError({ status, isRefreshRequest, alreadyRetried, hasToken, isRefreshing: refreshing }) {
    if (status !== 401) return 'ignore'
    if (isRefreshRequest) return 'refresh-request'
    if (alreadyRetried) return 'unrecoverable'
    if (!hasToken) return 'unrecoverable'
    if (refreshing) return 'queue'
    return 'refresh'
}

/**
 * The only exit for a 401 that cannot be recovered: clear the session and
 * hand off to whatever the app registered to actually log out and get the
 * climber back to the login screen. Falls back to a hard reload only if
 * nothing ever registered a handler (e.g. the interceptor firing before
 * app.js has wired one up).
 */
function forceLogout() {
    if (logoutHandler) {
        logoutHandler()
    } else {
        setAuthToken(null)
        window.location.reload()
    }
}

export async function jwtInterceptor() {
    axios.interceptors.request.use(async (request) => {
        // add auth header with jwt if account is logged in and request is to the api url
        const isApiUrl = request.url.startsWith(endpoint);
        // The same ref every auth-gated query waits on, so a request can
        // never be sent with a token the rest of the app does not know about.
        const access_token = authToken.value

        const isLoggedIn = access_token != null

        if (isLoggedIn && isApiUrl) {
            request.headers.common.Authorization = `Bearer ${access_token}`;
            axios.defaults.headers.post['content-type'] = 'application/json'
        }
        return request;
    });

    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config

            const decision = classifyAuthError({
                status: error.response?.status,
                isRefreshRequest: originalRequest?.url === REFRESH_URL,
                alreadyRetried: !!originalRequest?._retry,
                hasToken: !!authToken.value,
                isRefreshing,
            })

            // Not a 401 this interceptor recovers from, or the refresh
            // endpoint's own 401 — left for the refresh flow's try/catch
            // below to handle. Either way, nothing more to do here.
            if (decision === 'ignore' || decision === 'refresh-request') {
                return Promise.reject(error)
            }

            // No token to refresh with, or already retried once and still
            // 401 — refreshing again would just repeat the failure. Any 401
            // that cannot be recovered must end in a logged-out state and the
            // login screen, not a request left rejected with nothing to show
            // for it on screen.
            if (decision === 'unrecoverable') {
                forceLogout()
                return Promise.reject(error)
            }

            // A refresh is already in flight for another request; wait for it
            // rather than starting a second one.
            if (decision === 'queue') {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`
                    return axios(originalRequest)
                }).catch(err => {
                    return Promise.reject(err)
                })
            }

            // decision === 'refresh'
            originalRequest._retry = true
            isRefreshing = true

            try {
                const response = await axios.post(REFRESH_URL)
                const newToken = response.data.access_token

                setAuthToken(newToken)
                if (tokenRefreshHandler) {
                    tokenRefreshHandler(newToken)
                }
                axios.defaults.headers.common.Authorization = `Bearer ${newToken}`

                processQueue(null, newToken)

                originalRequest.headers.Authorization = `Bearer ${newToken}`
                return axios(originalRequest)
            } catch (refreshError) {
                // Queued requests were waiting on this refresh; they must
                // reject promptly rather than hang, or their pages are stuck
                // on "Loading…" exactly as this refresh request now is.
                processQueue(refreshError, null)
                forceLogout()
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }
    );
}
