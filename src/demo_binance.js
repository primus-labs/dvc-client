const { doProve, makeBinanceRequestParams, getBinanceAccounts, makeBinanaceOrigRequests } = require("./utils.js")
require('dotenv').config();

async function main() {
  console.log(`Now: ${new Date()}`);
  // Configure at least one or more pairs of API_KEY and API_SECRET
  // in .env using `BINANCE_API_KEY{i}` and `BINANCE_API_SECRET{i}`.

  const accounts = getBinanceAccounts();
  // console.log('accounts', accounts);
  const origRequests = makeBinanaceOrigRequests(accounts);
  // console.log('origRequests', origRequests);
  const { requests, responseResolves } = makeBinanceRequestParams(origRequests);
  // console.log('requests', requests);
  // console.log('responseResolves', responseResolves);

  const result = await doProve(requests, responseResolves);
  console.log('proof fixture(json):', JSON.parse(result?.details?.proof_fixture ?? {}));
}

const interval = Number(process.env.INTERVAL) || 1800;
console.log(`The interval: ${interval} s.`)
main();
setInterval(main, interval * 1000);
