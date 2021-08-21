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
        return a.author.localeCompare(b.author)
    },
    'routesetter_desc': (b, a) => {
        return a.author.localeCompare(b.author)
    },
    'hardest': (a, b) => {
        return parseInt(b.grade.score) - parseInt(a.grade.score)

    },
    'easiest': (a, b) => {
        return parseInt(a.grade.score) - parseInt(b.grade.score)
    },
    'most_ticks': (a, b) => {
        return parseInt(a.ascentCount) - parseInt(b.ascentCount)
    },
    'least_ticks': (a, b) => {
        return parseInt(a.ascentCount) - parseInt(b.ascentCount)
    },
    'best': (a, b) => {
        return parseInt(b.c_like)-parseInt(a.c_like)
    },
    'worst': (a, b) => {
        return parseInt(a.c_like)-parseInt(b.c_like)
    },
}


const sortFunction = (a, b, sortby) => {
    const sortFunction = sortFunctions[sortby]
    console.log("sort by",sortby)
    if (sortFunction == undefined) {
        console.log("Sort function not found, surun päivä",sortby)
    }
    return sortFunction(a, b)
}
export { sortFunction}
