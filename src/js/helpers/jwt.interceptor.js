import axios from 'axios';
import { endpoint } from '@js/api.js'

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

export async function jwtInterceptor() {
    axios.interceptors.request.use(async (request) => {
        // add auth header with jwt if account is logged in and request is to the api url
        const isApiUrl = request.url.startsWith(endpoint);
        const access_token = localStorage.getItem('token')

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

            if (error.response && error.response.status === 401 && !originalRequest._retry) {
                const token = localStorage.getItem('token')
                if (!token || token === 'null') {
                    return Promise.reject(error)
                }

                // If already refreshing, queue this request
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject })
                    }).then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`
                        return axios(originalRequest)
                    }).catch(err => {
                        return Promise.reject(err)
                    })
                }

                originalRequest._retry = true
                isRefreshing = true

                try {
                    const response = await axios.post(endpoint + '/auth/otp/refresh')
                    const newToken = response.data.access_token

                    localStorage.setItem('token', newToken)
                    if (tokenRefreshHandler) {
                        tokenRefreshHandler(newToken)
                    }
                    axios.defaults.headers.common.Authorization = `Bearer ${newToken}`

                    processQueue(null, newToken)

                    originalRequest.headers.Authorization = `Bearer ${newToken}`
                    return axios(originalRequest)
                } catch (refreshError) {
                    processQueue(refreshError, null)

                    if (logoutHandler) {
                        logoutHandler()
                    } else {
                        localStorage.removeItem('token')
                        window.location.reload()
                    }
                    return Promise.reject(refreshError)
                } finally {
                    isRefreshing = false
                }
            }
            return Promise.reject(error);
        }
    );
}
