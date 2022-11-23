const createError = (code, text) => {
    return {
        error: code,
        text
    }
}

module.exports = {
    createError
}