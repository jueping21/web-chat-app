module.exports = {
    redisURL: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_DOMAIN}:${process.env.REDIS_PORT}`,
    serverPort: process.env.PORT
} 
