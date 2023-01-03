module.exports = {
    db: `mongodb://${process.env.MONGO_DOMAIN}:${process.env.MONGO_PORT}/loginAPI`,
    redisURL: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_DOMAIN}:${process.env.REDIS_PORT}`,
    secret: "5B6327735D9C2DBFBB1C6AC36A37B",
    cacheTime: 3600,
    serverPort: process.env.PORT
} 