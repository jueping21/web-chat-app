FROM node:16-alpine

ENV PORT=21583 \
    # MONGO_USERNAME= \
    REDIS_DOMAIN=redis_cache \
    REDIS_PORT=6379 \
    REDIS_PASSWORD=password

RUN mkdir -p /home/management_api/app

# Add hello scripts
ADD start-script /home/management_api/start-script
RUN chmod +x /home/management_api/start-script

COPY ./app /home/management_api/app

# Add docker-compose-wait tool -------------------
ENV WAIT_VERSION 2.7.2
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/$WAIT_VERSION/wait /home/management_api/wait
RUN chmod +x /home/management_api/wait

WORKDIR /home/management_api/app

CMD ["/start-script"]