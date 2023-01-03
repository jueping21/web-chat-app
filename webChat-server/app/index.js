const config = require("./config")
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const controller = require('./src/controller');

const message = require('./src/message');
const serverEvent = require('./src/events.js').serverEvent();
const delay = config.delay;

// setup the chat server
const app = express()
const server = http.createServer(app)

// cors
app.use((request, response, next) => {
    // ${config.prodServ}
    response.setHeader("Access-Control-Allow-Origin", `*`);
    response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, authorization");
    next();
});

app.use(express.json());

/**
 * If login is successful, returns {code: 200, data: {user: userObject}}, 
 * Otherwise, returns {code: 801, data: error.message}.
 */
app.post("/login", async (request, response) => {
    const result = await controller.login(request.body);
    response.send(result);
})

/**
 * If token is valid, returns {code: 200, data: {isAuth: true, room: [...]}}, 
 * Otherwise, returns {code: 200, data: {isAuth: false}}. If an error occurred, 
 * then returns {code: 799, data: error.message}
 */
app.get("/rooms", async (request, response) => {
    try {
        const token = request.header("Authorization").replace("Bearer ", "");
        const authResult = await controller.auth(token);
        if (authResult.code == 200 && authResult.data.isAuth) {
            const result = await controller.getRooms();
            result.data.isAuth = true;
            response.send(result);
        } else {
            response.send({ code: 200, data: { isAuth: false } });
        }
    } catch (error) {
        response.send({ code: 799, data: error.message });
    }
    // const token = request.header("Authorization").replace("Bearer ", "");
    // setTimeout(async () => {
    //     response.send(await controller.getRooms(token));
    // }, delay);
})

/**
 * If signup is successful, returns {code: 200, data: {user: userObject}}, 
 * Otherwise, returns {code: 802, data: {}}.
 */
app.post("/signup", async (request, response) => {
    const result = await controller.signup(request.body);
    response.send(result);
})

const io = socketio(server, {
    cors: {
        origin: "*"
    }
})

const chatIO = io.of("/chat")

// socket middle ware for auth
chatIO.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    const authResult = await controller.auth(token);
    if (authResult.code == 200 && authResult.data.isAuth) {
        next();
    } else {
        next({ code: 799, data: "Authentication failed" })
    }
})

// wait for the client connections
chatIO.on(serverEvent.connection, (socket) => {
    // connected ack
    setTimeout(async () => {
        socket.emit('connected', { code: 200, data: "socket connection established" });
    }, delay);

    // join chat 
    socket.on(serverEvent.join, async (response, ack) => {
        const user = {
            session: socket.id,
            username: response.username,
            room: response.room,
            isCreate: response.isCreate
        }

        const joinResult = await controller.joinChat(user)
        if (joinResult.code != 200) {
            return ack(joinResult)
        }
        
        const username = joinResult.data.username;
        const room = joinResult.data.room;
        const usersInRoom = joinResult.data.users;
        // add new user to the correct room

        socket.join(room);

        // broadcast user-joined system message, but not for the current new user.
        data = message.systemMessage(`${username} has joined`);
        socket.broadcast.to(room).emit(serverEvent.send, data);

        // update the users in current room and broadcast the new users list to everyone in this room
        data = {
            room: room,
            users: usersInRoom
        };
        socket.broadcast.to(room).emit(serverEvent.room, data);

        // TODO: features after joining the chat  
        ack({ code: 200, data });
    })

    // wait for the messages from client 
    socket.on(serverEvent.receive, async (response, ack) => {
        const result = await controller.getSession(socket.id)
        if (result.code == 200 && result.data) {
            const username = result.data.username;
            const room = result.data.room;
            const data = message.userMessage(username, response);
            chatIO.to(room).emit(serverEvent.send, data);
            ack({ code: 200, data: "send successfully" });
        } else {
            return ack({ code: 800, data: "session disconnect rejoin the chat" });
        }
    })

    //Disconnect the socket
    socket.on('disconnect', async () => {
        const result = await controller.disconnect(socket.id);
        if (result.code == 200 && result.data) {
            const username = result.data.username;
            const room = result.data.room;
            const usersInRoom = result.data.users;
            const data = message.systemMessage(`${username} has left`)
            chatIO.to(room).emit('message', data)
            chatIO.to(room).emit('roomData', {
                room,
                users: usersInRoom
            })
        }
    })

    // logout for a user
    socket.on('logout', async (response, ack) => {
        const user = await controller.getProfile(response.token);
        const result = await controller.logoutChat(user.data.user.nickname);
        console.log(result);
        if (user.code == 200 && user.data.isAuth && result.code == 200) {
            for (let i = 0; i < result.data.length; i++) {
                const session = result.data[i].session;
                const room = result.data[i].room;
                const users = result.data[i].users;
                const data = message.systemMessage(`${user.data.user.nickname} has left`)
                socket.broadcast.to(room).emit('message', data)
                socket.broadcast.to(room).emit('roomData', {
                    room,
                    users: users
                })
                chatIO.in(session).disconnectSockets();
            }
            await controller.logout(response.token);
        }
    })
})

server.listen(config.serverPort, () => {
    console.log(`Chat Server is up at ${config.serverPort}`)
})