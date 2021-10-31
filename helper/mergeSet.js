function mergeSet(setA, setB = {}){
    const result = {...setA}
    for (let k of Object.keys(setB)) {
        result[k] = ''
    }
    return result
}

module.exports = mergeSet