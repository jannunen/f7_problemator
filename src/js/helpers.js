import { f7 } from 'framework7-vue'
const debounce = (func, timeout = 300) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}
const getTagShort = (tag) => {
    if (tag == null) {
        return "";
    }

    return tag.substring(tag.length - 4);
};
const getRandom = (min,max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
}
const toaster = (msg,opt={}) => {
    f7.toast.show({
    icon:opt.icon || null,
    text: msg,
    position: "top",
    closeButtonColor: "red",
    closeTimeout: 4000,
    closeButton: true,
    })
}
const maxSnap = 8
export { debounce, getTagShort , getRandom, maxSnap, toaster}
