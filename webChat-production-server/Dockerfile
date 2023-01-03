FROM node:16-alpine

RUN mkdir -p /home/production_server/app

# Add hello scripts
ADD start-script /home/production_server/start-script
RUN chmod +x /home/production_server/start-script

COPY ./app /home/production_server/app

WORKDIR /home/production_server/app

CMD ["/start-script"]