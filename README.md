# dvc-client



## Build

```sh
npm install
```


## Usage

- Copy `.env.example` to `.env` and set your `PRIVATE_KEY` corresponding to the Base Sepolia or Base Mainnet.
- Configure at least one or more pairs of API_KEY and API_SECRET using `BINANCE_API_KEY{i}` and `BINANCE_API_SECRET{i}`.
- Switch the `CHAIN_ID` and `RPC_URL` as needed. The default is for Base Sepolia.

| CHAIN_ID | RPC_URL                  | Chain        |
| -------- | ------------------------ | ------------ |
| 84532    | https://sepolia.base.org | Base Sepolia |
| 8453     | https://mainnet.base.org | Base Mainnet |


### Binance Demo


See [demo_binance.js](./src/demo_binance.js) and it's doc-comment for example usage and notes. 

```js
const { doProve, makeBinanceRequestParams, getBinanceAccounts, makeBinanaceOrigRequests } = require("./utils.js")

async function main() {
  // Configure at least one or more pairs of API_KEY and API_SECRET
  // in .env using `BINANCE_API_KEY{i}` and `BINANCE_API_SECRET{i}`.
  
  const accounts = getBinanceAccounts();
  // console.log('accounts', accounts);
  const origRequests = makeBinanaceOrigRequests(accounts);
  // console.log('origRequests', origRequests);
  const { requests, responseResolves } = makeBinanceRequestParams(origRequests);

  const result = await doProve(requests, responseResolves);
  console.log('proof fixture(json):', JSON.parse(result?.details?.proof_fixture ?? {}));
}
```

Then,

```sh
node src/demo_binance.js
```


## Docker build (binance)

```sh
# sudo docker build -t <image> .
sudo docker build -t primuslabs/dvc-client:v0.1.1 .
```

Usage:

```sh
# docker run --rm --env-file .env <image>
docker run --rm --env-file .env primuslabs/dvc-client:v0.1.1
```
