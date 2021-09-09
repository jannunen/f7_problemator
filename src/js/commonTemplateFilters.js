import dayjs from 'dayjs'

export default {
    fromNow(value) {
        return dayjs(value).fromNow()
    },
    format(value, format) {
        return dayjs(value).format(format)
    },
    capitalize(str) {
        if (str == null) {
            return ""
        }
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}