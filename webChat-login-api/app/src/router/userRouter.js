const express = require("express");
const User = require("../model/user");
const auth = require("../middleware/auth");

const errorMessage = require('../error/error-message');
const errorType = require("../error/error-type")
const cacheManager = require("../cache/user-cache");

const router = new express.Router();

const resMessage = {
    code: 200,
    data: "success"
}

// return a public profile from a user object
const getPublicProfile = (user) => {
    const email = user.email;
    const nickname = user.nickname;
    const token = user.token;
    return { email, nickname, token };
}

router.post("/login", async (request, response) => {
    try {
        let email = request.body.email;
        let password = request.body.password;
        let user = await User.findByCredentials(email, password);
        await user.generateAuthToken();
        await cacheManager.addCache({
            id: user._id.toString(),
            email: user.email,
            token: user.token,
            nickname: user.nickname
        })
        resMessage.data = getPublicProfile(user);
        response.send(resMessage);
    } catch (error) {
        if (error.message == errorType.loginFailed) {
            response.status(200).send(errorMessage.login);
        } else {
            response.status(400).send(error.message);
        }
    }
})

router.post("/signup", async (request, response) => {
    try {
        let user = new User(request.body);
        await user.generateAuthToken();
        user = await user.save();
        await cacheManager.addCache({
            id: user._id.toString(),
            email: user.email,
            token: user.token,
            nickname: user.nickname
        })
        resMessage.data = getPublicProfile(user);
        response.send(resMessage);
    } catch (error) {
        const feedback = errorMessage.format;
        feedback.data = error.errors
        response.status(200).send(feedback);
    }
})

router.get("/auth", auth, async (request, response) => {
    try {
        response.send(request.auth);
    } catch (error) {
        response.status(400).send(error.messsage);
    }
})

router.get("/me", auth, async (request, response) => {
    try {
        if (request.auth.data.isAuth) {
            if (request.cache) {
                request.auth.data.user = getPublicProfile(request.cache);
            } else {
                request.auth.data.user = getPublicProfile(request.user);
            }
        }
        response.send(request.auth);
    } catch (error) {
        response.status(400).send(error.messsage);
    }
})

router.post("/logout", auth, async (request, response) => {
    try {
        if (request.auth.data.isAuth) {
            if (request.cache) {
                await cacheManager.removeCache(request.cache.email)
                const result = await User.findByIdAndUpdate(request.cache.id, { token: "" });
                request.auth.data.user = getPublicProfile(result)
            } else {
                request.user.token = "";
                request.user.save();
                request.auth.data.user = getPublicProfile(request.user);
            }
        }
        response.send(request.auth);
    } catch (error) {
        console.log(error);
        response.status(400).send(error.messsage);
    }
})

module.exports = router;