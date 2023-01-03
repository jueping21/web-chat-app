const config = require("./config")
const express = require("express");
const app = express();
const Redis = require("redis");
const redisClient = Redis.createClient({ url: config.redisURL });

const dropKeyHeader = (data) => {
    for (let i = 0; i < data.length; i++) {
        let cleanedName = data[i].substring(data[i].indexOf('-') + 1)
        data[i] = cleanedName;
    }
}

async function redisConnect() {
    await redisClient.connect();
    await redisClient.flushAll();
    console.log("Cache server connection is established");
}

async function main() {
    await redisConnect().catch(error => {
        console.log(error);
    });

    app.use((request, response, next) => {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        next();
    });

    app.use(express.json());

    app.use((request, response, next) => {
        // console.log(request.ip);
        next();
    });

    app.post("/join", async (request, response) => {
        const session = "si-" + request.body.session;
        const username = "ui-" + request.body.username;
        const room = "ri-" + request.body.room;
        const isCreate = request.body.isCreate;
        // invalid username or room
        if (!username || !room) {
            return response.send({ code: 801, data: "Incorrect username or room info" });
        }

        // Invalid room name
        if (!/^[a-zA-Z0-9_.-]*$/.test(room)) {
            return response.send({ code: 801, data: "Invalid room name" })
        }

        // check the room availability
        const hasRoom = await redisClient.exists(room);
        if (isCreate == 1) {
            if (hasRoom) {
                return response.send({ code: 802, data: "Room name has been using" });
            }
        } else {
            if (!hasRoom) {
                return response.send({ code: 803, data: "Room is currently off" });
            }
        }
        try {
            const hasUser = !await redisClient.sAdd(room, username);
            if (hasUser) {
                return response.send({ code: 804, data: "You are already in the room" })
            }
            await redisClient.sAdd(username, session);
            await redisClient.hSet(session, "username", username);
            await redisClient.hSet(session, "room", room);
            const list = await redisClient.sMembers(room);
            dropKeyHeader(list);
            response.send({
                code: 200, data: {
                    session: request.body.session,
                    username: request.body.username,
                    room: request.body.room,
                    users: list
                }
            })
        } catch (error) {
            response.send({ code: 798, data: error.message });
        }
    })

    app.delete("/disconnect", async (request, response) => {
        try {
            const session = "si-" + request.body.session;
            const username = await redisClient.hGet(session, "username");
            const room = await redisClient.hGet(session, "room");
            if (username && room) {
                await redisClient.del(session)
                await redisClient.sRem(room, username);
                await redisClient.sRem(username, session);
                const members = await redisClient.sMembers(room);
                dropKeyHeader(members);
                response.send({
                    code: 200, data: {
                        username: username.substring(username.indexOf("-") + 1),
                        room: room.substring(room.indexOf("-") + 1),
                        users: members
                    }
                });
            } else {
                response.send({ code: 200, data: null });
            }
        } catch (error) {
            response.send({ code: 798, data: error.message });
        }
    });

    app.delete("/logout", async (request, response) => {
        try {
            let result = [];
            let username = "ui-" + request.body.username;
            let sessions = await redisClient.sMembers(username);
            for (let i = 0; i < sessions.length; i++) {
                let room = await redisClient.hGet(sessions[i], "room");
                if (username && room) {
                    await redisClient.del(sessions[i])
                    await redisClient.sRem(room, username);
                    const list = await redisClient.sMembers(room);
                    dropKeyHeader(list);
                    const pair = {
                        session: sessions[i],
                        room: room.substring(room.indexOf("-") + 1),
                        users: list
                    }
                    result.push(pair);
                }
                await redisClient.del(username);
            }
            response.send({ code: 200, data: result });
        } catch (error) {
            response.send({ code: 798, data: error.message });
        }
    });

    app.post("/addSession", async (request, response) => {
        try {
            const session = "si-" + request.body.session;
            const username = request.body.username;
            const room = request.body.room;
            await redisClient.hSet(session, "username", username);
            await redisClient.hSet(session, "room", room);
            response.send({ code: 200, data: { session: request.body.session, username, room } });
        } catch (error) {
            response.send({ code: 798, data: error.message });
        }
    });

    app.get("/getSession/:session", async (request, response) => {
        try {
            let session = "si-" + request.params.session;
            let username = await redisClient.hGet(session, "username");
            let room = await redisClient.hGet(session, "room");
            let resMessage = { code: 200, data: null };
            if (username && room) {
                username = username.substring(username.indexOf("-") + 1);
                room = room.substring(room.indexOf("-") + 1);
                resMessage = { code: 200, data: { session: request.body.session, username, room } };
            }
            response.send(resMessage);
        } catch (error) {
            response.send({ code: 798, data: error.message });
        }
    });

    app.post("/addSession", async (request, response) => {
        try {
            const session = "si-" + request.body.session;
            const username = request.body.username;
            const room = request.body.room;
            await redisClient.hSet(session, "username", username);
            await redisClient.hSet(session, "room", room);
            response.send({ code: 200, data: { session: request.body.session, username, room } });
        } catch (error) {
            response.send({ code: 798, data: error.message });
        }
    });

    app.delete("/deleteSession", async (request, response) => {
        try {
            const session = "si-" + request.body.session;
            const returnValue = await redisClient.del(session);
            if (returnValue) {
                response.send({ code: 200, data: { session: request.body.session } })
            } else {
                response.send({ code: 200, data: null });
            }
        } catch (error) {
            response.send({ code: 798, data: error.message });
        }
    });

    app.post("/addSessionToUser", async (request, response) => {
        try {
            const session = request.body.session;
            const username = "ui-" + request.body.username;
            await redisClient.sAdd(username, session);
            response.send({ code: 200, data: { session, username: request.body.username } });
        } catch (error) {
            response.send({ code: 798, data: error.message });
        }
    });

    app.get("/getAllSessionsFromUser", async (request, response) => {
        try {
            const username = "ui-" + request.body.username;
            const list = await redisClient.sMembers(username);
            if (list.length == 0) {
                response.send({ code: 200, data: null });
            } else {
                response.send({ code: 200, data: list });
            }
        } catch (error) {
            response.send({ code: 798, data: error.message });
        }
    });

    app.delete("/deleteSessionFromUser", async (request, response) => {
        try {
            const session = request.body.session;
            const username = "ui-" + request.body.username;
            const returnValue = await redisClient.sRem(username, session);
            if (returnValue) {
                response.send({ code: 200, data: { username: request.body.username, session } });
            } else {
                response.send({ code: 200, data: null });
            }
        } catch (error) {
            response.send({ code: 798, data: error.message });
        }
    });

    app.post("/addUserToRoom", async (request, response) => {
        try {
            const room = "ri-" + request.body.room;
            const username = request.body.username;
            await redisClient.sAdd(room, username);
            response.send({ code: 200, data: { username, room: request.body.room } });
        } catch (error) {
            response.send({ code: 798, data: error.message });
        }
    });

    app.get("/hasRoom", async (request, response) => {
        try {
            const room = "ri-" + request.body.room;
            const returnValue = await redisClient.exists(room);
            if (returnValue) {
                response.send({ code: 200, data: { room: request.body.room } });
            } else {
                response.send({ code: 200, data: null });
            }
        } catch (error) {
            response.send({ code: 798, data: error.message });
        }
    });

    app.get("/getRoom", async (request, response) => {
        try {
            const returnValue = await redisClient.keys("ri-*");
            dropKeyHeader(returnValue);
            response.send({ code: 200, data: {room: returnValue} });
        } catch (error) {
            response.send({ code: 798, data: error.message });
        }
    });

    app.get("/getUsersFromRoom", async (request, response) => {
        try {
            const room = "ri-" + request.body.room;
            const list = await redisClient.sMembers(room);
            if (list.length == 0) {
                response.send({ code: 200, data: null });
            } else {
                response.send({ code: 200, data: list });
            }
        } catch (error) {
            response.send({ code: 798, data: error.message });
        }
    });

    app.delete("/deleteUserFromRoom", async (request, response) => {
        try {
            const room = "ri-" + request.body.room;
            const username = request.body.username;
            const returnValue = await redisClient.sRem(room, username);
            if (returnValue) {
                response.send({ code: 200, data: { room: request.body.room, username } });
            } else {
                response.send({ code: 200, data: null });
            }
        } catch (error) {
            response.send({ code: 798, data: error.message });
        }
    });

    app.listen(config.serverPort, () => {
        console.log(`Recommendation server is up at ${config.serverPort}`);
    })
}

main();