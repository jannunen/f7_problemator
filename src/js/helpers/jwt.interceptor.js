import axios from 'axios';
import { endpoint } from '@js/api.js'

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
}