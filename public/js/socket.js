class ChatSocket {
    constructor(socket, eventList) {
        this.socket = socket;
        this.event = eventList;
    }

    waitMessage = (callback) => {
        this.socket.on(this.event.receive, (message) => {
            callback(message);
        });
    }

    waitRoomInfo = (callback) => {
        this.socket.on(this.event.room, (roomInfo) => {
            this.event.room
            console.log(roomInfo);
            callback(roomInfo);
        });
    }

    //TODO: we may need more args for ackCallback 
    joinChat = ({ username, room }, fromAck) => {
        this.socket.emit(this.event.join, { username, room }, (error) => {
            fromAck(error);
        })

    }

    send = (message, fromAck) => {
        this.socket.emit(this.event.send, message, (error) => {
            fromAck(error);
        });
    }
}

class Loader {
    constructor(socket){
        this.socket = socket;
    }

    loadSocket = (timeout = 10000) => {
        let p1 = new Promise((resovle, reject) => {
            this.socket.emit('Events', "fetchEventList", (event) => {
                resovle(event);
            })
        })

        let p2 = new Promise((resovle, reject) => {
            setTimeout(() => {
                reject("Error Request Timed Out");
            }, timeout);
        })

        return Promise.race([p1, p2]).then(
            value => {
                return Promise.resolve(new ChatSocket(this.socket, value));
            },
            reason => {
                return Promise.reject(reason)
            }
        )
    }
}