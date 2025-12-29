# dvc-client

## Overview

This project verifies asset balances across multiple account types and exchanges, with support for **simultaneous proofs over multiple accounts**.

It currently supports the following exchanges and account categories:

**Binance**

* **Unified Account**
  `https://papi.binance.com/papi/v1/balance`
* **Spot Account**
  `https://api.binance.com/api/v3/account`
* **Futures Account**
  `https://fapi.binance.com/fapi/v3/balance`

**Aster**

* **Spot Account**
  `https://sapi.asterdex.com/api/v1/account`

* **Futures Account**
  `https://fapi.asterdex.com/fapi/v2/balance`

---

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
2. Configure one or more API key pairs for each supported exchange. You may configure at least one exchange, or multiple exchanges.
   
   * **Binance**
      ```env
      BINANCE_API_KEY1=...
      BINANCE_API_SECRET1=...
      ```
   * **Binance Classic (Optional)**
      ```env
      BINANCE_CLASSIC_API_KEY1=...
      BINANCE_CLASSIC_API_SECRET1=...
      ```
   * **Aster**
      ```env
      ASTER_API_KEY1=...
      ASTER_API_SECRET1=...
      ```
   * **Multi-Account Support**
    To enable multi-accounts, add additional API key pairs for the same exchange by incrementing the numeric suffix:
      ```env
      BINANCE_API_KEY2=...
      BINANCE_API_SECRET2=...

      ASTER_API_KEY2=...
      ASTER_API_SECRET2=...
      ```
      - There is **no requirement to configure every exchange**; you can choose which exchanges and accounts to enable.
      - Numeric suffixes (`1`, `2`, `3`, ...) are used to distinguish multiple accounts.

3. Adjust `CHAIN_ID` and `RPC_URL` as needed. Defaults are for Base Sepolia:

    | CHAIN_ID | RPC_URL                  | Chain        |
    | -------- | ------------------------ | ------------ |
    | 84532    | https://sepolia.base.org | Base Sepolia |
    | 8453     | https://mainnet.base.org | Base Mainnet |


4. Run the client:

    ```sh
    docker compose up -d
    ```
    If the environment variables are updated (for example, adding, modifying, or removing API key pairs), you need to restart the Docker container for the changes to take effect:
    ```sh
    docker compose down
    docker compose up -d
    ```
    - This ensures that the container loads the latest environment variable values.



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

* **BINANCE_API_KEY{i}/BINANCE_API_SECRET{i}** — Additional accounts for multi-account proofs (at least one pair is required)

#### Aster API

* **ASTER_API_KEY{i}/ASTER_API_SECRET{i}** — Additional accounts for multi-account proofs (at least one pair is required)

