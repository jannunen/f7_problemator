import { authGuard } from '../auth/authguard.js'
import { jwtInterceptor } from './jwt.interceptor.js'
import  routes  from '@js/routes'
import { debounce, getTagShort, getRandom ,left, right, tipShown} from './utils.js'
import { calculatePoints } from './problemator.js'
import { handleValidationErrors } from './errors.js'
import { toLocalTime ,showAgo } from './component.helpers.js'

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
    showAgo,
    toLocalTime,
    calculatePoints,
    handleValidationErrors,

}
