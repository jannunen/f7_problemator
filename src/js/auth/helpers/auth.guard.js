import { accountService } from '@js/auth/services';
import { f7 } from 'framework7-vue';
//import { router } from '@js/auth/helpers';

export function authGuard({ to, from, resolve, reject }) {
    const account = accountService.accountValue;
    if (account) {
        // logged in so return true
        resolve()
    } else {
        // not logged in so redirect to login page with the return url
        f7.views.main.router.navigate({ path: '/login', query: { returnUrl: to.fullPath } });
        reject()
    }

}
