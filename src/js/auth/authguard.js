import { accountService } from '@js/auth/accountservice';

import { f7 } from 'framework7-vue'
export function authGuard({ from, to, router, resolve, reject }) {
    const account = accountService.accountValue;
    if (account) {
        // logged in so return true
        resolve();
    } else {
        // not logged in so redirect to login page with the return url
        reject();
    }

}