/**
 * 
 * @param {String} routetype route type, boulder or sport
 * @param {Number} tries  Amount of tries
 * @returns 
 */
const calculatePoints = (type, tries) => {

    if (isNaN(parseInt(tries))) {
        tries = 1
    }
    if (type == 'boulder') {
        // Give a bonus 7a -> almost 7b
        if (tries == 1) {
            return 93
        }
        // Make 2nd go between eg. 7a and 7a+
        if (tries == 2) {
            return 20
        }
        if (tries < 10) {
            return 3
        }
    } else if (type == 'sport') {
        // Give a bonus. 7a -> 7b+
        if (tries == 1) {
            return 143
        } else if (tries == 2) {
            // Second go earns a little
            return 11
        } else if (tries < 10) {
            return 3
        }
    }
    return -1 
}

export {
    calculatePoints,
}