const config = require('../../config');
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const cacheManager = require("../cache/user-cache");

const auth = async (req, res, next) => {

    // response message template
    const responseMessage = {
        code: 200,
        data: { isAuth: false }
    };
    
    req.auth = responseMessage

    try {
        // token decoded
        const token = req.header("Authorization").replace("Bearer ", "");
        const secret = config.secret;
        const decoded = jwt.verify(token, secret);

        // read from cache
        const cache = await cacheManager.fetchCache({ id: decoded.id, email: decoded.email, token });
        if (cache) {
            // console.log("Cache fetching: Read a user from cache");
            req.cache = cache;
            req.token = token;
            req.auth.data.isAuth = true;
            return next();
        } else {
            // console.log("DB fetching: Read a user from DB");
            // read from DB
            const query = {
                _id: decoded.id,
                email: decoded.email,
                token: token
            }
            const user = await User.findOne(query);
            if(user){
                // add result to cache
                await cacheManager.addCache({
                    id: user._id.toString(),
                    email: user.email, 
                    token: user.token, 
                    nickname: user.nickname
                })
                req.token = token;
                req.user = user;
                req.auth.data.isAuth = true;
                return next();
            }else{
                return next();
            }
        }
    } catch (error) {
        return next();
    }
}

module.exports = auth;