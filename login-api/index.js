const config = require('./config');
const express = require("express")
const app = express();
const userRouter = require("./src/router/userRouter");

const mongoose = require('mongoose');

async function dbconnect(db) {
    await mongoose.connect(db, {
        "authSource": "admin",
        "user": "admin",
        "pass": "password"
    });
    console.log("Connection: DB connection is established");
}

async function main() {
    try {
        await dbconnect(config.db)
    } catch (error) {
        console.log("error", error.message);
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
        console.log(`LoginAPI is up at ${config.serverPort}`);
    })
}

main();