import { authGuard } from '../auth/authguard.js'
//import { errorInterceptor } from './error.interceptor'
//import { initFacebookSdk } from './facebook'
import { jwtInterceptor } from './jwt.interceptor.js'
import  routes  from '@js/routes'
import { debounce, getTagShort, getRandom } from './utils.js'

export {
    authGuard,
    //errorInterceptor,
    //initFacebookSdk,
    jwtInterceptor,
    routes,
    debounce,
    getTagShort,
    getRandom,
}
