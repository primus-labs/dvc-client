const { doZkTls, doProve, checkAccounts,
  makeAsterSpotRequestParams, makeAsterFutureRequestParams,
  makeBinanceSpotRequestParams, makeBinanceUsdSFutureRequestParams, makeBinanceUnifiedRequestParams,
} = require("./utils.js")
require('dotenv').config();

const interval = Number(process.env.INTERVAL) || 1800;
console.log(`The interval: ${interval} s.`)

async function main() {
  console.log(`Now: ${new Date()}`);
  try {
    const acc = checkAccounts();
    console.log(JSON.stringify(acc));

    let allData = Array(5).fill(undefined);
    if (acc.hasBinanceUnified) {
      const { requests, responseResolves } = makeBinanceUnifiedRequestParams();
      const data = await doZkTls(requests, responseResolves, { requestParamsCallback: makeBinanceUnifiedRequestParams });
      allData[0] = data;
    }
    if (acc.hasBinanceSpot) {
      const { requests, responseResolves } = makeBinanceSpotRequestParams();
      const data = await doZkTls(requests, responseResolves, { requestParamsCallback: makeBinanceSpotRequestParams });
      allData[1] = data;
    }
    if (acc.hasBinanceUsdSFutures) {
      const { requests, responseResolves } = makeBinanceUsdSFutureRequestParams();
      const data = await doZkTls(requests, responseResolves, { requestParamsCallback: makeBinanceUsdSFutureRequestParams });
      allData[2] = data;
    }
    if (acc.hasAsterSpot) {
      const { requests, responseResolves } = makeAsterSpotRequestParams();
      const data = await doZkTls(requests, responseResolves, { requestParamsCallback: makeAsterSpotRequestParams });
      allData[3] = data;
    }
    if (acc.hasAsterUsdSFutures) {
      const { requests, responseResolves } = makeAsterFutureRequestParams();
      const data = await doZkTls(requests, responseResolves, { requestParamsCallback: makeAsterFutureRequestParams });
      allData[4] = data;
    }
    // console.log('allData', JSON.stringify(allData));

    const result = await doProve(allData);
    console.log('proof fixture(json):', JSON.parse(result?.details?.proof_fixture ?? "{}"));
  } catch (error) {
    console.log('main error:', error);
  }

  console.log(`⏳ Next in ${interval} s...`);
}

main();
setInterval(main, interval * 1000);
