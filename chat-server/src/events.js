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
    serverEvent
}