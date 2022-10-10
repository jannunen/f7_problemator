import dayjs from 'dayjs'

const getAscentsByGrade = (grades, ticks, lastDays, showOfType) => {
    let gradeMap = new Map()
    const deadline = dayjs().subtract(lastDays, 'day')

    const validTicks = ticks.filter(tick => dayjs(tick.tstamp).isAfter(deadline))

    // Setup grademap first.
    grades.forEach(g => {
        gradeMap.set(g.id,0) 
    })
    
    validTicks.forEach((tick)  => {
        if (tick.routetype == showOfType || showOfType == 'all') {
            // If problem has ticks, count as ascent
            const gradeId = tick.gradeid
            // Check that one of the ticks is after the deadline
            gradeMap.set(gradeId, gradeMap.get(gradeId) + 1)
        }
    })

    // Then remove out all the grades too easy and too hard (=no ticks)
    // Loop from start and end when first non zero is found
    /*
    for (let gKey of gradeMap.keys()) {
        if (gradeMap.get(gKey) == 0) {
            gradeMap.delete(gKey)
        }
        break
    }
    */

    // Then start from the end and do the same backwards.
    const reversedKeys = Array.from(gradeMap.keys()).reverse()
    for (let gKey of reversedKeys) {
        if (gradeMap.get(gKey) == 0) {
            gradeMap.delete(gKey)
        }
        break
    }
    return gradeMap
}

const getSessionCount = (problem) => {
    // Session count is the amount of different days the project has
    // been projected on.
    //const projecting = problem.myProjects
    alert('not like this')
    const projectDays = projecting.reduce((acc, item) => {
        // Reduce the timestamp to date.
        const date = item.tstamp.substring(0, 10)
        if (!acc.includes(date)) {
            acc.push(date)
        }
        return acc
    }, [])
    return projectDays.length

}

export {
    getAscentsByGrade,
    getSessionCount
}
