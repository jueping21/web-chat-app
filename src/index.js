// load modules
const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')

// load helper functions from other js files
const message = require('./model/message')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const event = require('./model/events.js')
const clientEvent = event.clientEvent();
const serverEvent = event.serverEvent();

// setup the chat server
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const port = process.env.PORT || 8000

// set up the static directory for the chat server
const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))

// wait for the client connections
io.on(serverEvent.connection, (socket) => {

    socket.on("Events", (_, ack) => {
        setTimeout(() => {
            ack(clientEvent);
        }, 1000);
    });

    socket.on(serverEvent.join, (response, ack) => {
        const username = response.username;
        const session = socket.id;
        console.log("join", username, session);
        const room = response.room;

        const newUser = {
            id: session, username, room
        }

        // add new user to the cache
        const { error, user } = addUser(newUser);
        if (error) {
            return ack(error)
        }

        // add new user to the correct room
        socket.join(user.room)

        // send welcome system message to the new user
        let data = message.systemMessage("Welcome");
        socket.emit(serverEvent.send, data)

        // broadcast user-joined system message, but not for the current new user.
        data = message.systemMessage(`${user.username} has joined`);
        socket.broadcast.to(user.room).emit(serverEvent.send, data);

        // update the users in current room and broadcast the new users list to everyone in this room
        data = {
            room: user.room,
            users: getUsersInRoom(user.room)
        };
        
        io.to(user.room).emit(serverEvent.room, data);

        // TODO: features after joining the chat  
        ack()
    })

    socket.on(serverEvent.receive, (response, ack) => {
        const user = getUser(socket.id);
        console.log(user);
        if(!user){
            return ack("session disconnect rejoin the chat");
        }
        const data = message.userMessage(user.username, response);
        io.to(user.room).emit(serverEvent.send, data);
        ack();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            const data = message.systemMessage(`${user.username} has left`)
            io.to(user.room).emit('message', data)
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})