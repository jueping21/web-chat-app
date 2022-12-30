const config = require("./config")
const express = require("express");
const fetch = require('node-fetch');
const app = express();
const Redis = require("redis");
const redisClient = Redis.createClient({ url: config.redisURL });

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
        response.setHeader("Access-Control-Allow-Origin", `${config.ChatsURL}`);
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, authorization");
        next();
    });

    app.use(express.json());

    const auth = async (token) => {
        try {
            const fetchResult = await fetch(`${config.loginURL}/auth`, {
                headers: {
                    authorization: token,
                },
            });
            const authResult = await fetchResult.json();
            return authResult;
        } catch (error) {
            return {
                code: 799,
                data: error.message
            };
        }
    };

    app.get("/rooms", async (request, response) => {
        const token = request.header("Authorization").replace("Bearer ", "");
        const result = await auth(token);
        try {
            if (result.code == 200 && result.data.isAuth) {
                const room = await redisClient.keys("Room*");
                result.data.room = room;
            }
            response.send(result);
        } catch (error) {
            response.send({ code: 800, data: error.message });
        }
    })

    app.listen(config.serverPort, () => {
        console.log(`Recommendation server is up at ${config.serverPort}`);
    })

}

main();