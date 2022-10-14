const calculatePoints = (points, tries) => {
    // Give a little bonus for a flash
    if (tries == 1) {
        return points + 10
    }
    if (tries < 10) {
        // Subtract a little for each extra try.
        // 5 tries makes  7a -> 6c+
        // 10 tries makes 7a -> 6c
        return points - (tries * 10)
    }
    // Stop deducing after 10 tries
    return points
}

export {
    calculatePoints,
}