import { computed } from 'vue'
import { useStore } from 'vuex'

export const getAscentsByGrade = computed(() => {
    const store = useStore()
    let gradeMap = new Map()
    const problems = computed(() => store.state.gym.problems)
    problems.value.forEach(problem => {
        // If problem has ticks, count as ascent
        const gradeId = problem.grade.id
        if (problem.myTicks.length > 0) {
            if (!gradeMap.has(gradeId)) {
                gradeMap.set(gradeId, 1)
            } else {
                gradeMap.set(gradeId, gradeMap.get(gradeId) + 1)
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
})
