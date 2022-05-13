import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-vue';
import { accountService } from '@js/auth/accountservice';
import store from '@js/store.js'
import { f7, useStore } from 'framework7-vue'

export async function jwtInterceptor() {
    axios.interceptors.request.use(async (request) => {
        // add auth header with jwt if account is logged in and request is to the api url
        //const account = accountService.accountValue;
        //const isLoggedIn = account?.access_token;
        const isLoggedIn = true;
        const isApiUrl = request.url.startsWith(import.meta.env.VITE_API_HOST);
        const access_token_obj  = useStore('access_token')
        const access_token= access_token_obj.value
        console.log("puppa",access_token)

        if (isLoggedIn && isApiUrl) {
            request.headers.common.Authorization = `Bearer ${access_token}`;
            axios.defaults.headers.post['content-type'] = 'application/json'
        }

        return request;
    });
}