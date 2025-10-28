FROM node:22.16.0
LABEL maintainer="Primus Labs"

WORKDIR /dvc-client
COPY ./package.json /dvc-client/package.json
# RUN npm install
COPY ./node_modules /dvc-client/node_modules
COPY ./node_modules/@primuslabs/network-core-sdk/native/lib* /dvc-client/node_modules/@primuslabs/network-core-sdk/build/Release/
COPY ./src/utils.js /dvc-client/src/
COPY ./src/demo_binance.js /dvc-client/src/

CMD ["node", "src/demo_binance.js"]
