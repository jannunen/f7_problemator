import { createAuth0, authGuard as auth0Authguard} from '@auth0/auth0-vue';
import { f7 } from 'framework7-vue'
import { useAuth0 } from '@auth0/auth0-vue';
export function authGuard({ from, to, router, resolve, reject }) {
    const { loginWithRedirect, logout, user, isAuthenticated } = useAuth0();
    // If the user is authenticated, continue with the route
    if (isAuthenticated) {
        return resolve()
    }
    // Otherwise, log in
    //authService.loginWithRedirect({ appState: { targetUrl: to.fullPath } })
    return reject();

      

}