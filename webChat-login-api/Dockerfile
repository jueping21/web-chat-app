FROM node:16-alpine

ENV PORT=21583 \
    MONGO_DOMAIN=mongodb \
    MONGO_PORT=27017 \
    MONGO_USERNAME=admin \
    MONGO_PASSWORD=password \

    # MONGO_USERNAME= \
    REDIS_DOMAIN=redis_cache \
    REDIS_PORT=6379 \
    REDIS_PASSWORD=password

RUN mkdir -p /home/loginAPI/app

# Add hello scripts
ADD start-script /home/loginAPI/start-script
RUN chmod +x /home/loginAPI/start-script

COPY ./app /home/loginAPI/app

# Add docker-compose-wait tool -------------------
ENV WAIT_VERSION 2.7.2
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/$WAIT_VERSION/wait /home/loginAPI/wait
RUN chmod +x /home/loginAPI/wait

WORKDIR /home/loginAPI/app

CMD ["/start-script"]