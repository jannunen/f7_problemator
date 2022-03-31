import { f7 } from 'framework7-vue'

const errorNotify = (title=null, subtitle=null) => {
        f7.notification.create({
          title,
          subtitle,
          closeTimeout: 5000,
        }).open()
}
export {
    errorNotify
}