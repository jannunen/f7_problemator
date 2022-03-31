import dayjs from 'dayjs'

const fromNow = (value) => {
    return dayjs(value).fromNow()
}
const format = (value, format) => {
    return dayjs(value).format(format)
}
const capitalize = (str) => {
    if (str == null) {
        return ""
    }
    return str.charAt(0).toUpperCase() + str.slice(1)
}
export {
    fromNow,
    format,
    capitalize,
}