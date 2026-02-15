import axios from 'axios';
import { endpoint } from '@js/api.js'

let logoutHandler = null

export function setLogoutHandler(handler) {
    logoutHandler = handler
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
        console.log("Doing api call",request.url)
        return request;
    });

    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && error.response.status === 401) {
                const token = localStorage.getItem('token')
                if (token && token !== 'null') {
                    if (logoutHandler) {
                        logoutHandler()
                    } else {
                        localStorage.removeItem('token')
                        window.location.reload()
                    }
                }
            }
            return Promise.reject(error);
        }
    );
}
