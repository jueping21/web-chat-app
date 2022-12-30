const config = require("../config")
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const fetch = require('node-fetch');

const message = require('./message');
const serverEvent = require('./events.js').serverEvent();
const delay = config.delay;

const cache = require('./cache/cache');

async function main() {
    const cacheManager = await cache();

    /**
     * auth() is a helper function
     * 
     * If token is valid, returns {code: 200, data: {isAuth: true}}, Otherwise,
     * returns {code: 200, data: {isAuth: false}}. If an error occurred, 
     * then returns {code: 799, data: error.message}
     * 
     * @param {String} token 
     * @returns a response message
     */
    const auth = async (token) => {
        try {
            const fetchResult = await fetch(`${config.loginURL}/auth`, {
                headers: {
                    authorization: `Bearer ${token}`,
                },
            })
            const authResult = await fetchResult.json();
            return authResult;
        } catch (error) {
            return {
                code: 799,
                data: error.message
            };
        }
    };

    /**
     * getProfile() is a helper function
     * 
     * If token is valid, returns {code: 200, data: {isAuth: true, user: userObject}}, 
     * Otherwise, returns {code: 200, data: {isAuth: false}}. If an error occurred, 
     * then returns {code: 799, data: error.message}
     * 
     * @param {String} token 
     * @returns a response message
     */
    const getProfile = async (token) => {
        try {
            const fetchProfile = await fetch(`${config.loginURL}/me`, {
                headers: {
                    authorization: `Bearer ${token}`,
                },
            });
            const profile = await fetchProfile.json();
            return profile;
        } catch (error) {
            return {
                code: 799,
                data: error.message
            };
        }
    };

    /**
     * getRooms() is a helper function
     * 
     * If token is valid, returns {code: 200, data: {isAuth: true, room: [...]}}, 
     * Otherwise, returns {code: 200, data: {isAuth: false}}. If an error occurred, 
     * then returns {code: 799, data: error.message}
     * 
     * @param {*} token 
     * @returns a response message
     */
    const getRooms = async (token) => {
        try {
            const fetchRoom = await fetch(`${config.roomsURL}/rooms`, {
                headers: {
                    authorization: `Bearer ${token}`,
                },
            });
            return await fetchRoom.json();
        } catch (error) {
            return {
                code: 799,
                data: error.message
            };
        }
    };

    /**
     * logout() is a helper function
     * 
     * If token is valid, returns {code: 200, data: {isAuth: true, user: userObject}}, 
     * Otherwise, returns {code: 200, data: {isAuth: false}}. If an error occurred, 
     * then returns {code: 799, data: error.message}
     * 
     * @param {*} token 
     * @returns a response message
     */
    const logout = async (token) => {
        try {
            const logoutFetch = await fetch(`${config.loginURL}/logout`, {
                method: "POST",
                headers: {
                    authorization: `Bearer ${token}`
                },
            });
            return await logoutFetch.json();
        } catch (error) {
            return {
                code: 799,
                data: error.message
            };
        }
    };

    // setup the chat server
    const app = express()
    const server = http.createServer(app)

    // cors
    app.use((request, response, next) => {
        response.setHeader("Access-Control-Allow-Origin", `${config.prodServ}`);
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
        try {
            let user = request.body;
            let fetchLogin = await fetch(`${config.loginURL}/login`, {
                method: "post",
                headers: {
                    "Content-type": "application/json",
                },
                body: JSON.stringify(user),
            })
            const result = await fetchLogin.json();
            response.send(result);
        } catch (error) {
            response.send({
                code: 799,
                data: error.message
            });
        }
    })

    /**
     * If token is valid, returns {code: 200, data: {isAuth: true, room: [...]}}, 
     * Otherwise, returns {code: 200, data: {isAuth: false}}. If an error occurred, 
     * then returns {code: 799, data: error.message}
     */
    app.get("/rooms", async (request, response) => {
        const token = request.header("Authorization").replace("Bearer ", "");
        setTimeout(async () => {
            response.send(await getRooms(token));
        }, delay);
    })

    /**
     * If signup is successful, returns {code: 200, data: {user: userObject}}, 
     * Otherwise, returns {code: 802, data: {}}.
     */
    app.post("/signup", async (request, response) => {
        try {
            let user = request.body;
            let fetchRegister = await fetch(`${config.loginURL}/signup`, {
                method: "post",
                headers: {
                    "Content-type": "application/json",
                },
                body: JSON.stringify(user),
            })
            const result = await fetchRegister.json();
            response.send(result);
        } catch (error) {
            response.send({
                code: 799,
                data: error.message
            });
        }
    })

    const io = socketio(server, {
        cors: {
            origin: config.prodServ
        }
    })
    const chatIO = io.of("/chat")

    // socket middle ware for auth
    chatIO.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        const authResult = await auth(token);
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
            const session = socket.id;
            const username = response.username;
            const room = response.room;
            const isCreate = response.isCreate;

            // invalid username or room
            if (!username || !room) {
                return ack({ code: 801, data: "Incorrect username or room info" })
            }

            // Invalid room name
            if (!/^[a-zA-Z0-9_.-]*$/.test(room)) {
                return ack({ code: 801, data: "Invalid room name" })
            }

            // check the room availability
            const existKey = await cacheManager.roomCache.exitRoom(room);
            if (isCreate == 1) {
                if (existKey) {
                    return ack({ code: 802, data: "Room name has been using" });
                }
            } else {
                if (!existKey) {
                    return ack({ code: 803, data: "Room is currently off" });
                }
            }

            const hasUser = !await cacheManager.roomCache.addUserToRoom(room, username);
            if (hasUser) {
                return ack({ code: 804, data: "You are already in the room" })
            }

            await cacheManager.userCache.appendSessionToUser(username, session);
            await cacheManager.sessionCache.addSession({ session, username, room });

            // add new user to the correct room
            socket.join(room);

            // broadcast user-joined system message, but not for the current new user.
            data = message.systemMessage(`${username} has joined`);
            socket.broadcast.to(room).emit(serverEvent.send, data);

            // update the users in current room and broadcast the new users list to everyone in this room
            data = {
                room: room,
                users: await cacheManager.roomCache.getUsersFromRoom(room)
            };

            socket.broadcast.to(room).emit(serverEvent.room, data);

            // TODO: features after joining the chat  
            ack({ code: 200, data });
        })

        // wait for the messages from client 
        socket.on(serverEvent.receive, async (response, ack) => {
            // const hasSession = await sessionCache.hasSession(socket.id);
            // if (!hasSession) {
            //     return ack({ code: 800, data: "session disconnect rejoin the chat" });
            // }
            const session = await cacheManager.sessionCache.getSession(socket.id);
            if (!session) {
                return ack({ code: 800, data: "session disconnect rejoin the chat" });
            }
            const { _, username, room } = session;
            const data = message.userMessage(username, response);
            chatIO.to(room).emit(serverEvent.send, data);
            ack({ code: 200, data: "send successfully" });
        })

        //Disconnect the socket
        socket.on('disconnect', async () => {
            const session = await cacheManager.sessionCache.getSession(socket.id);
            // const { session, username, room } = await sessionCache.getSession(socket.id);
            if (session) {
                const { username, room } = session;
                await cacheManager.sessionCache.deleteSession(socket.id);
                await cacheManager.roomCache.removeUserFromRoom(room, username);
                await cacheManager.userCache.removeSessionFromUser(username, socket.id)
                const data = message.systemMessage(`${username} has left`)
                chatIO.to(room).emit('message', data)
                chatIO.to(room).emit('roomData', {
                    room,
                    users: cacheManager.roomCache.getUsersFromRoom(room)
                })
            }
        })


        // logout for a user
        socket.on('logout', async (response, ack) => {
            const user = await getProfile(response.token);
            if (user.code == 200 && user.data.isAuth) {
                const nickname = user.data.user.nickname;
                const sessions = await cacheManager.userCache.getAllSessionsFromUser(nickname);
                for (let i = 0; i < sessions.length; i++) {
                    const session = await cacheManager.sessionCache.getSession(sessions[i]);
                    // const { session, username, room } = await sessionCache.getSession(sessions[i]);
                    if (session) {
                        const { username, room } = session;
                        await cacheManager.sessionCache.deleteSession(sessions[i]);
                        await cacheManager.roomCache.removeUserFromRoom(room, username);
                        await cacheManager.userCache.removeSessionFromUser(username, sessions[i])
                        const data = message.systemMessage(`${username} has left`)
                        socket.broadcast.to(room).emit('message', data)
                        socket.broadcast.to(room).emit('roomData', {
                            room,
                            users: await cacheManager.roomCache.getUsersFromRoom(room)
                        })
                        chatIO.in(sessions[i]).disconnectSockets();
                    }
                }
                await logout(response.token);
            }
        })
    })

    server.listen(config.serverPort, () => {
        console.log(`Chat Server is up at ${config.serverPort}`)
    })
}

main();