const { doProve, makeBinanceRequestParams } = require("./utils.js")

async function main() {
  /**
   * Generate signed Binance API request URLs for multiple accounts.
   *
   * Each account must send **two** requests in strict order:
   * 1. `GET /papi/v1/um/positionRisk`
   * 2. `GET /papi/v1/balance`
   *
   * ⚠️ **Important:** For every account, always send the `positionRisk` request first,
   * immediately followed by the `balance` request.
   *
   * ## Endpoint Notes
   *
   * - **GET /papi/v1/um/positionRisk**
   *   - Do **not** include the `symbol` parameter.
   *   - Use a larger `recvWindow`, e.g. `60000` (milliseconds).
   *
   * - **GET /papi/v1/balance**
   *   - Do **not** include the `asset` parameter.
   *   - Use a larger `recvWindow`, e.g. `60000` (milliseconds).
   *
   * ## Example Usage
   *
   * ```js
   * const origRequests = [
   *   {
   *     url: "https://papi.binance.com/papi/v1/um/positionRisk?recvWindow=60000&timestamp=1760921486287&signature=f792e...",
   *     headers: {
   *       'X-MBX-APIKEY': 'nzI7iU3YRLlO1olZG8xsTQnnRQPcxKfrY...'
   *     }
   *   },
   *   {
   *     url: "https://papi.binance.com/papi/v1/balance?recvWindow=60000&timestamp=1760921486287&signature=f362...",
   *     headers: {
   *       'X-MBX-APIKEY': 'nzI7iU3YRLlO1olZG8xsTQnnRQPcxKfrY...'
   *     }
   *   }
   * ];
   *
   * const { requests, responseResolves } = makeBinanceRequestParams(origRequests);
   * ```
   */
  const origRequests = [/*...*/];
  const { requests, responseResolves } = makeBinanceRequestParams(origRequests);

  const result = await doProve(requests, responseResolves);
  console.log('result', result);
  console.log('proof fixture:', JSON.parse(result?.details?.proof_fixture ?? {}));
}

main();
