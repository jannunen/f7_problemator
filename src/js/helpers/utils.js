const debounce = (func, timeout = 300) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}
const left = (str,index) => {
    if (str == null) {
      return null
    }
    if (index > str.length) {
        return str
    }
    return str.substring(0,index)
}
const right = (str,index) => {
    if (str == null) {
      return null
    }
    if (index < 0) {
       return str.substring(-index)
    } 
    const len = str.length
    return str.substring(len-index)
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
export {
    debounce,
    getTagShort,
    getRandom,
    left,
    right,
}