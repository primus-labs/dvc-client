const { doZkTls, doProve, getBinanceAccounts,
  makeBinanceRequestParams, makeBinanaceOrigRequests,
  makeBinanceSpotRequestParams, makeBinanaceSpotOrigRequests } = require("./utils.js")
require('dotenv').config();

function getBinanaceRequestParams() {
  const accounts = getBinanceAccounts();
  // console.log('accounts', accounts);
  const origRequests = makeBinanaceOrigRequests(accounts);
  // console.log('origRequests', origRequests);
  const { requests, responseResolves } = makeBinanceRequestParams(origRequests);
  // console.log('requests', requests);
  // console.log('responseResolves', responseResolves);
  return { requests, responseResolves };
}

function getBinanaceSpotRequestParams() {
  const accounts = getBinanceAccounts();
  // console.log('accounts', accounts);
  const origRequests = makeBinanaceSpotOrigRequests(accounts);
  // console.log('origRequests', origRequests);
  const { requests, responseResolves } = makeBinanceSpotRequestParams(origRequests);
  // console.log('requests', requests);
  // console.log('responseResolves', responseResolves);
  return { requests, responseResolves };
}

async function main() {
  console.log(`Now: ${new Date()}`);
  // Configure at least one or more pairs of API_KEY and API_SECRET
  // in .env using `BINANCE_API_KEY{i}` and `BINANCE_API_SECRET{i}`.
  try {
    let data1 = null;
    let data2 = null;
    {
      const { requests, responseResolves } = getBinanaceRequestParams();
      data1 = await doZkTls(requests, responseResolves, {
        requestParamsCallback: getBinanaceRequestParams,
      });
    }
    {
      const { requests, responseResolves } = getBinanaceSpotRequestParams();
      data2 = await doZkTls(requests, responseResolves, {
        requestParamsCallback: getBinanaceSpotRequestParams,
      });
    }
    const result = await doProve(data1, data2);
    console.log('proof fixture(json):', JSON.parse(result?.details?.proof_fixture ?? "{}"));
  } catch (error) {
    console.log('main error:', error);
  }
}

const interval = Number(process.env.INTERVAL) || 1800;
console.log(`The interval: ${interval} s.`)
main();
setInterval(main, interval * 1000);
