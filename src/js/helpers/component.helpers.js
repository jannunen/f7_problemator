import { computed } from 'vue'
import { useStore } from 'vuex'
import dayjs from 'dayjs'
import { groupBy } from 'lodash'
const store = useStore()

const getAscentsByGrade = (ticks, lastDays, showOfType) => {
    let gradeMap = new Map()
    const deadline = dayjs().subtract(lastDays, 'day')

    // Group by grade
    const groupedByGrade = ticks.reduce((acc, curr) => {
        const gradeid = "grade" + curr.problem.gradeid
        if (!acc[gradeid]) acc[gradeid] = [] //If this type wasn't previously stored
        acc[gradeid].push(curr)
        return acc
    }, {})
    Object.keys(groupedByGrade).forEach((tickKey)  => {
        const ticks = groupedByGrade[tickKey]
        ticks.forEach((tick) => {

            if (tick.problem.routetype == showOfType || showOfType == 'all') {

                // If problem has ticks, count as ascent
                const gradeId = tick.problem.gradeid
                // Check that one of the ticks is after the deadline
                const validTick = ticks.find(tick => dayjs(tick.tstamp).isAfter(deadline))

                if (validTick != null) {
                    if (!gradeMap.has(gradeId)) {
                        gradeMap.set(gradeId, 1)
                    } else {
                        gradeMap.set(gradeId, gradeMap.get(gradeId) + 1)
                    }
                }
            }
        })
    })

    // Then remove out all the grades too easy and too hard (=no ticks)
    // Loop from start and end when first non zero is found
    for (let gKey of gradeMap.keys()) {
        if (gradeMap.get(gKey) == 0) {
            gradeMap.delete(gKey)
        }
        break
    }

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
    const projecting = problem.myProjects
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
