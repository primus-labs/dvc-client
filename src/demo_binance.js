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
  console.log('result', result);
  console.log('proof fixture:', JSON.parse(result?.details?.proof_fixture ?? {}));
}

main();
