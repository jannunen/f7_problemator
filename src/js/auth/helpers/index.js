import { authGuard } from './auth.guard.js'
import { errorInterceptor } from './error.interceptor'
import { initFacebookSdk } from './facebook'
import { jwtInterceptor } from './jwt.interceptor.js'
import { router } from '@js/router'

export {
    authGuard,
    errorInterceptor,
    initFacebookSdk,
    jwtInterceptor,
    router,
}
