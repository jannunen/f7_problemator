import dayjs from 'dayjs'

const sortFunctions = {
    'sector_asc': (a, b) => {
        if (a.wall == null || b.wall == null) {
            return 0
        }
        return a.wall.wallchar.localeCompare(b.wall.wallchar)

    },
    'sector_desc': (b, a) => {
        if (a.wall == null || b.wall == null) {
            return 0
        }
        return a.wall.wallchar.localeCompare(b.wall.wallchar)

    },
    'newest': (a, b) => {
        return dayjs(b.added)-dayjs(a.added)
    },
    'oldest': (a, b) => {
        return dayjs(a.added)-dayjs(b.added)
    },
    'routesetter_asc': (a, b) => {
        return (a.author?.etunimi ?? '').localeCompare(b.author?.etunimi ?? '')
    },
    'routesetter_desc': (b, a) => {
        return (a.author?.etunimi ?? '').localeCompare(b.author?.etunimi ?? '')
    },
    // grade is nullable: a problem can be ungraded, and a spray wall problem
    // is ungraded until it reaches consensus. An unguarded .score threw and
    // took the whole sort with it, so the list rendered empty.
    'hardest': (a, b) => {
        return (parseInt(b.grade?.score) || 0) - (parseInt(a.grade?.score) || 0)
    },
    'easiest': (a, b) => {
        return (parseInt(a.grade?.score) || 0) - (parseInt(b.grade?.score) || 0)
    },
    'most_ticks': (a, b) => {
        return parseInt(b.ascents_count) - parseInt(a.ascents_count)
    },
    'least_ticks': (a, b) => {
        return parseInt(a.ascents_count) - parseInt(b.ascents_count)
    },
    'best': (a, b) => {
        return parseInt(b.c_like)-parseInt(a.c_like)
    },
    'worst': (a, b) => {
        return parseInt(a.c_like)-parseInt(b.c_like)
    },
}


const sortFunction = (a, b, sortby) => {
    const fn = sortFunctions[sortby]
    if (fn == undefined) {
        // Was logged and then called anyway, which threw and emptied the list.
        // Leaving the order untouched is the honest fallback.
        console.warn('Unknown sort key, leaving order unchanged:', sortby)
        return 0
    }
    return fn(a, b)
}

const problemStyleFilter = (problem, problemStyle) => {
    switch (problemStyle) {
        case 'all':
            return true

        case 'expiring':
            return problem.soontoberemoved == 1

        case 'new': {
            // What's new? Put up within one week? Gym should decide
            // this. Or should user decide?
            const weekAgo = dayjs().subtract(1,'week')
            return dayjs(problem.added).isAfter(weekAgo)
        }

        case 'circuits':
            return problem.circuits != null && problem.circuits.length > 0

        case 'boulders':
            return problem.routetype =='boulder'

        case 'routes':
            return problem.routetype !='boulder'
            
        case 'projects':
            return problem.myProjects != null && problem.myProjects.length > 0

        case 'ticked':
            return problem.myTicks != null && problem.myTicks.length > 0

        default:
            // Falling off the end returned undefined, which Array.filter treats
            // as false — so a typo silently emptied the list instead of
            // failing loudly. Keep the problem and say so.
            console.warn('Unknown problem style, not filtering:', problemStyle)
            return true
    }
}
export { sortFunction, problemStyleFilter}
