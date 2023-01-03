const config = require('./config');
const express = require("express")
const app = express();
const userRouter = require("./src/router/userRouter");

const mongoose = require('mongoose');
const { exists } = require('./src/model/user');

async function dbconnect(db) {
    console.log("Server-LoginAPI: Waiting for DB Connection");
    await mongoose.connect(db, {
        "authSource": "admin",
        "user": process.env.MONGO_USERNAME,
        "pass": process.env.MONGO_PASSWORD
    });
    console.log("Server-LoginAPI: DB connection is established");
}

async function main() {
    try {
        await dbconnect(config.db)
    } catch (error) {
        console.error("Server-LoginAPI: Failed to connect to mongo");
        exists(1);
    }

    // CORS
    app.use((request, response, next) => {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, authorization");
        next();
    });

    // express.json()
    app.use(express.json());

    // user router
    app.use(userRouter);

    // listen the port
    app.listen(config.serverPort, () => {
        console.log(`Server-LoginAPI is up at ${config.serverPort}`);
    })
}

main();