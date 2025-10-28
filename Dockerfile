FROM node:22.16.0
LABEL maintainer="Primus Labs"
WORKDIR /dvc-client

COPY ./package.json /dvc-client/package.json
RUN npm install
COPY ./src/utils.js /dvc-client/src/
COPY ./src/demo_binance.js /dvc-client/src/

CMD ["node", "src/demo_binance.js"]
