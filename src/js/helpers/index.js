import { authGuard } from '../auth/authguard.js'
import { jwtInterceptor } from './jwt.interceptor.js'
import  routes  from '@js/routes'
import { debounce, getTagShort, getRandom ,left, right, tipShown} from './utils.js'

export {
    authGuard,
    //errorInterceptor,
    //initFacebookSdk,
    jwtInterceptor,
    routes,
    left,
    right,
    debounce,
    getTagShort,
    getRandom,
    tipShown,

}
