import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-vue';
import store from '@js/store.js'
import { f7, useStore } from 'framework7-vue'
import { endpoint } from '@js/api.js'

export async function jwtInterceptor() {
    axios.interceptors.request.use(async (request) => {
        // add auth header with jwt if account is logged in and request is to the api url
        const isApiUrl = request.url.startsWith(endpoint);
        const access_token_obj  = useStore('access_token')
        const access_token= access_token_obj.value
        const isLoggedIn = access_token != null

        if (isLoggedIn && isApiUrl) {
            request.headers.common.Authorization = `Bearer ${access_token}`;
            axios.defaults.headers.post['content-type'] = 'application/json'
        }
        console.log("Doing api call",request.url)
        return request;
    });
}