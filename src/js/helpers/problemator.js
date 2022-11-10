const calculatePoints = (type, points, tries) => {

    if (isNaN(parseInt(tries))) {
        tries = 1
    }
    if (type == 'boulder') {
        // Give a bonus 7a -> almost 7b
        if (tries == 1) {
            return 93
        }
        // Make 2nd go between eg. 7a and 7a+
        if (tries < 2) {
            return 20
        }
        // Deduct a little. 10 tries makes 7a -> 6c
        if (tries < 10) {
            return tries * -11
        }
    } else if (type == 'sport') {
        // Give a bonus. 7a -> 7b+
        if (tries == 1) {
            return 143
        } else if (tries == 2) {
            // Second go earns a little
            return 11
        } else if (tries < 10) {
            // Deduct a little. 10 tries makes 7a -> 6c
            return tries * -10
        }
    }
    return 0
}

export {
    calculatePoints,
}