const config = require("../../config")
const Redis = require("redis");

async function connect() {
    const userRedisClient = Redis.createClient({ url: config.userCacheURL });
    const roomRedisClient = Redis.createClient({ url: config.roomCacheURL });
    const sessionRedisClient = Redis.createClient({ url: config.sessionCacheURL });

    await userRedisClient.connect();
    await userRedisClient.flushAll();
    console.log("user-cache server connection is established");

    await roomRedisClient.connect();
    await roomRedisClient.flushAll();
    console.log("room-cache server connection is established");

    await sessionRedisClient.connect();
    await sessionRedisClient.flushAll();
    console.log("session-cache server connection is established");

    return {
        userRedisClient,
        roomRedisClient,
        sessionRedisClient
    }
}

const methods = async () => {
    const cache = await connect();

    // session
    const addSession = async ({ session, username, room }) => {
        await cache.sessionRedisClient.hSet(session, "username", username);
        await cache.sessionRedisClient.hSet(session, "room", room);
    }

    const getSession = async (session) => {
        const username = await cache.sessionRedisClient.hGet(session, "username");
        const room = await cache.sessionRedisClient.hGet(session, "room");
        if (username && room) {
            return { session, username, room }
        }
        return null;
    }

    const hasSession = async (session) => {
        return await cache.sessionRedisClient.exists(session);
    }

    const deleteSession = async (session) => {
        const username = await cache.sessionRedisClient.del(session);
    }

    // user 
    const appendSessionToUser = async (username, session) => {
        return await cache.userRedisClient.sAdd(username, session);
    }

    const removeSessionFromUser = async (username, session) => {
        return await cache.userRedisClient.sRem(username, session);
    }

    const getAllSessionsFromUser = async (username) => {
        return await cache.userRedisClient.sMembers(username);
    }

    // room
    const exitRoom = async (room) => {
        return await cache.roomRedisClient.exists(room);
    }

    const addUserToRoom = async (room, username) => {
        return await cache.roomRedisClient.sAdd(room, username);
    }

    const removeUserFromRoom = async (room, username) => {
        return await cache.roomRedisClient.sRem(room, username);
    }

    const getUsersFromRoom = async (room) => {
        return await cache.roomRedisClient.sMembers(room);
    }

    return {
        sessionCache: {
            addSession,
            getSession,
            hasSession,
            deleteSession
        },
        userCache: {
            appendSessionToUser,
            removeSessionFromUser,
            getAllSessionsFromUser
        },
        roomCache: {
            exitRoom,
            addUserToRoom,
            removeUserFromRoom,
            getUsersFromRoom
        }
    }
}

module.exports = methods