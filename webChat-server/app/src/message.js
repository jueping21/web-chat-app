
const userMessage = (username, text) => {
    return {
        username,
        text,
        createdAt: new Date().getTime()
    }
}

const systemMessage = (text) => {
    return {
        system: "system",
        text,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    userMessage,
    systemMessage
}