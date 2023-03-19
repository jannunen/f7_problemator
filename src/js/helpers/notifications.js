import { f7 } from 'framework7-vue'

/* Gather UI prompts/alerts/notifications/toasts here so that they
 * can be easily changed if/when the underlying framework is changed
*/
const prompt = (title=null,text=null,okcb=null,cancelcb=null) => {
    f7.dialog.confirm(text,title,okcb,cancelcb)
}
const confirm = (title=null,text=null,okcb=null,cancelcb=null) => {
    f7.dialog.confirm(text,title,okcb,cancelcb)
}
const alert = (title=null,text=null,okcb=null,cancelcb=null) => {
    f7.dialog.alert(text,title,okcb,cancelcb)
}
const toaster = (subtitle, title='Problemator') => {
        f7.notification.create({
          title,
          subtitle,
          titleRightText: 'now',
          closeTimeout: 5000,
          closeOnClick: true,
        }).open()
    }
 
const errorNotify = (title=null, subtitle=null) => {
        f7.notification.create({
          title,
          subtitle,
          closeTimeout: 4000,
          closeOnClick : true,
        }).open()
}
export {
    errorNotify,
    prompt,
    alert,
    toaster,
    confirm,
}