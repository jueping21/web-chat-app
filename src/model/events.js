const clientEvent = () => {
    return {
        connection: "connection",
        join: "join",
        send: "sendMessage",
        disconnect: "disconnect",
        receive: "message",
        room: "roomData"
    }
}

const serverEvent = () => {
    return {
        connection: "connection",
        join: "join",
        receive: "sendMessage",
        disconnect: "disconnect",
        send: "message",
        room: "roomData"
    }
}


module.exports = {
    clientEvent,
    serverEvent
}