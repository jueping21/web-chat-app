FROM node:16-alpine

RUN mkdir -p /home/chat_server/app

# Add hello scripts
ADD start-script /home/chat_server/start-script
RUN chmod +x /home/chat_server/start-script

COPY ./app /home/chat_server/app

WORKDIR /home/chat_server/app

CMD ["/start-script"]