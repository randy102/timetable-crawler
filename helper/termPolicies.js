function lengthPolicy(term = ''){
    return term.length === 6
}

function noSpecialCharacterPolicy(term = ''){
    const format = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;

    return !format.test(term)
}

module.exports = {
    lengthPolicy,
    noSpecialCharacterPolicy
}