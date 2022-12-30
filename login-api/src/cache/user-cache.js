const config = require("../../config");
const Redis = require("redis");
const redisClient = Redis.createClient({ url: config.redisURL });

let semaphore = false;

// Connect Redis
async function redisConnect() {
    await redisClient.connect();
    await redisClient.flushAll();
    console.log("Connection: Cache connection is established");
}

// add user cache 
// email => {nickname:value, token:value, id:value}
const addCache = async ({ id, email, token, nickname }) => {
    try {
        if (!semaphore) {
            await redisConnect();
            semaphore = true;
        }
        await redisClient.hSet(email, "id", id);
        await redisClient.hSet(email, "token", token);
        await redisClient.hSet(email, "nickname", nickname);
        await redisClient.expire(email, config.cacheTime);
    } catch (error) {
        console.log(error);
    }
}

// add read a cache 
// {id:value, email:value, nickname:value, token:value}
const fetchCache = async ({ id, email, token }) => {
    try {
        if (!semaphore) {
            await redisConnect()
            semaphore = true;
        }
        // id: cache[2], token: cache[1], nickname: cache[0],
        const cache = await redisClient.HVALS(email);
        if (cache.length != 0) {
            const cacheID = cache[2];
            if (id == cacheID && token == cache[1]) {
                return {
                    id: cache[2],
                    email,
                    nickname: cache[0],
                    token: cache[1]
                };
            }
        }

        return null;
    } catch (error) {
        console.log(error);
    }
}

// delelt a cache 
const removeCache = async (email) => {
    try {
        if (!semaphore) {
            await redisConnect()
            semaphore = true;
        }
        await redisClient.del(email);
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    addCache,
    fetchCache,
    removeCache
};
