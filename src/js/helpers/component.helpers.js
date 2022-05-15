import { computed } from 'vue'
import store from '@js/store.js'
import { useStore } from 'framework7-vue'
import dayjs from 'dayjs'

const getAscentsByGrade = (lastDays, showOfType) => {
    let gradeMap = new Map()
    debugger
    const problems = useStore('problems')
    const deadline = dayjs().subtract(lastDays, 'day')

    problems.value.forEach(problem => {
        if (problem.routetype == showOfType || showOfType == 'all') {

            // If problem has ticks, count as ascent
            const gradeId = problem.grade.id
            if (problem.myTicks.length > 0) {
                // Check that one of the ticks is after the deadline
                const validTick = problem.myTicks.find(tick => dayjs(tick.tstamp).isAfter(deadline))

                if (validTick != null) {
                    if (!gradeMap.has(gradeId)) {
                        gradeMap.set(gradeId, 1)
                    } else {
                        gradeMap.set(gradeId, gradeMap.get(gradeId) + 1)
                    }
                }
            }
        }
    })
    // Then remove out all the grades too easy and too hard (=no ticks)
    // Loop from start and end when first non zero is found
    for (let gKey of gradeMap.keys()) {
        if (gradeMap.get(gKey) == 0) {
            gradeMap.delete(gKey)
        }
        break;
    }

    // Then start from the end and do the same backwards.
    const reversedKeys = Array.from(gradeMap.keys()).reverse()
    for (let gKey of reversedKeys) {
        if (gradeMap.get(gKey) == 0) {
            gradeMap.delete(gKey)
        }
        break;
    }
    return gradeMap
}

const getSessionCount = (problem) => {
  // Session count is the amount of different days the project has
  // been projected on.
  const projecting = problem.myProjects
  const projectDays = projecting.reduce((acc,item) => {
    // Reduce the timestamp to date.
    const date = item.tstamp.substring(0,10);
    if (!acc.includes(date)) {
      acc.push(date)
    }
    return acc
  },[])
  return projectDays.length

}

export { 
    getAscentsByGrade,
    getSessionCount
}
