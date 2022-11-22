class Socket {
    constructor({succeed, failed}, timeout) {
        this.socket = io()
        this.#loadEvent({ succeed, failed }, timeout)
    }

    #loadEvent = ({ succeed, failed}, timeout = 10000) => {
        let p1 = new Promise((resovle, reject) => {
            this.socket.emit('Events', "fetchEvents", (event) => {
                resovle(event);
            })
        })

        let p2 = new Promise((resovle, reject) => {
            setTimeout(() => {
                reject("Error Request Timed Out");
            }, timeout);
        })

        Promise.race([p1, p2]).then(
            value => {
                succeed();
            },
            reason => {
                failed();
            }
        )
    }

    waitMessage = (callback) => {
        this.socket.on('message', (message) => {
            callback(message);
        });
    }

    waitRoomInfo = (callback) => {
        this.socket.on('roomData', (roomInfo) => {
            callback(roomInfo);
        });
    }


    //TODO: we may need more args for ackCallback 
    joinChat = ({ username, room }, ackCallback) => {
        this.socket.emit('join', { username, room }, (error) => {
            ackCallback(error)
        })

    }

    send = (message, ackCallback) => {
        this.socket.emit('sendMessage', message, (error) => {
            ackCallback(error);
        });
    }
}