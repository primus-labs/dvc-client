# dvc-client

## Overview

This project verifies the asset balances of Binance **spot accounts** and **unified accounts**, and supports proving multiple accounts simultaneously.

The main workflow is as follows:

1. Use the **Primus Network** to generate zkTLS attestations.
2. Send the attestations to a **zkVM** running inside a **TEE**, perform verification and business logic (e.g., asset aggregation), and generate proofs via the **Succinct Network**.

For a complete introduction, see [DVC-Intro](https://github.com/primus-labs/DVC-Intro).


## Build

```sh
npm install
```


## Usage

1. Copy `.env.example` to `.env` and set your `PRIVATE_KEY` for either Base Sepolia or Base Mainnet.
2. Configure at least one pair of Binance **API_KEY** and **API_SECRET**:

    ```env
    BINANCE_API_KEY1=...
    BINANCE_API_SECRET1=...
    ```

    You can add more pairs as needed (`BINANCE_API_KEY2`, `BINANCE_API_SECRET2`, etc.) for multi-accounts.

3. Adjust `CHAIN_ID` and `RPC_URL` as needed. Defaults are for Base Sepolia:

    | CHAIN_ID | RPC_URL                  | Chain        |
    | -------- | ------------------------ | ------------ |
    | 84532    | https://sepolia.base.org | Base Sepolia |
    | 8453     | https://mainnet.base.org | Base Mainnet |


4. Run the client:

    ```sh
    node src/binance.js
    ```

## Configuration

This project uses a `.env` file for runtime configuration. Below is a description of each variable:

#### Chain Configuration

* **CHAIN_ID** — ID of the target chain (default `84532` for Base Sepolia)
* **RPC_URL** — RPC endpoint for the chain

#### Private Key & Service

* **PRIVATE_KEY** — Wallet private key for signing requests
* **ZKVM_SERVICE_URL** — Endpoint for the zkVM service

#### Logging & Interval

* **LOG_VERBOSE** — Enable verbose logging (`0` = off, `1` = on)
* **INTERVAL** — Interval between runs in seconds (default `1800`)

#### Binance API

* **BINANCE_RECV_WINDOW** — Default receive window for API requests
* **BINANCE_API_KEY{i}/BINANCE_API_SECRET{i}** — Additional accounts for multi-account proofs (at least one pair is required)


## Docker Build

```sh
# Build the Docker image (sudo docker build -t <image> .)
sudo docker build -t primuslabs/dvc-client:v0.1.3 .
```

Run the container:

```sh
# Using your .env file (docker run --rm --env-file .env <image>)
docker run --rm --env-file .env primuslabs/dvc-client:v0.1.3
```

Or, using Docker Compose:

```sh
docker compose up
```
