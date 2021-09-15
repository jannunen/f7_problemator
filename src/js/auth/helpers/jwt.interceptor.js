import axios from 'axios';
import { accountService } from '@js/auth/services';

export function jwtInterceptor() {
    axios.interceptors.request.use(request => {
        // add auth header with jwt if account is logged in and request is to the api url
        const account = accountService.accountValue;
        const isLoggedIn = account?.access_token;
        const isApiUrl = request.url.startsWith(import.meta.env.VITE_API_HOST);

        if (isLoggedIn && isApiUrl) {
            request.headers.common.Authorization = `Bearer ${account.access_token}`;
        }

        return request;
    });
}