# dvc-client

## Overview


## Build

```sh
npm install
```


## Usage

- Copy `.env.example` to `.env` and set your `PRIVATE_KEY` corresponding to the Base Sepolia or Base Mainnet.
- Configure at least one or more pairs of **API_KEY** and **API_SECRET** using `BINANCE_API_KEY{i}` and `BINANCE_API_SECRET{i}`.
- Switch the `CHAIN_ID` and `RPC_URL` as needed. The default is for Base Sepolia.

| CHAIN_ID | RPC_URL                  | Chain        |
| -------- | ------------------------ | ------------ |
| 84532    | https://sepolia.base.org | Base Sepolia |
| 8453     | https://mainnet.base.org | Base Mainnet |


Then,

```sh
node src/binance.js
```


## Docker build (binance)

```sh
# sudo docker build -t <image> .
sudo docker build -t primuslabs/dvc-client:v0.1.3 .
```

Usage:

```sh
# docker run --rm --env-file .env <image>
docker run --rm --env-file .env primuslabs/dvc-client:v0.1.3
```
or 

```sh
docker compose up
```
