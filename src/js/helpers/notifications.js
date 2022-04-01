import { f7 } from 'framework7-vue'

/* Gather UI prompts/alerts/notifications/toasts here so that they
 * can be easily changed if/when the underlying framework is changed
*/
const prompt = (title=null,text=null,okcb=null,cancelcb=null) => {
    f7.dialog.confirm(text,title,okcb,cancelcb)
}
const errorNotify = (title=null, subtitle=null) => {
        f7.notification.create({
          title,
          subtitle,
          closeTimeout: 5000,
        }).open()
}
export {
    errorNotify,
    prompt,
}