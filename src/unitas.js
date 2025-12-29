const { doZkTls, doProve, checkAccounts,
  makeAsterSpotRequestParams, makeAsterFeatureRequestParams,
  makeBinanceSpotRequestParams, makeBinanceFeatureRequestParams, makeBinanceUnifiedRequestParams,
} = require("./utils.js")
require('dotenv').config();

const interval = Number(process.env.INTERVAL) || 1800;
console.log(`The interval: ${interval} s.`)

async function main() {
  console.log(`Now: ${new Date()}`);
  try {
    const { hasBinance, hasAster } = checkAccounts();
    let allData = Array(5).fill(undefined);
    if (hasBinance) {
      {
        const { requests, responseResolves } = makeBinanceUnifiedRequestParams();
        const data = await doZkTls(requests, responseResolves, { requestParamsCallback: makeBinanceUnifiedRequestParams });
        allData[0] = data;
      }
      {
        const { requests, responseResolves } = makeBinanceSpotRequestParams();
        const data = await doZkTls(requests, responseResolves, { requestParamsCallback: makeBinanceSpotRequestParams });
        allData[1] = data;
      }
      {
        const { requests, responseResolves } = makeBinanceFeatureRequestParams();
        const data = await doZkTls(requests, responseResolves, { requestParamsCallback: makeBinanceFeatureRequestParams });
        allData[2] = data;
      }
    }
    if (hasAster) {
      {
        const { requests, responseResolves } = makeAsterSpotRequestParams();
        const data = await doZkTls(requests, responseResolves, { requestParamsCallback: makeAsterSpotRequestParams });
        allData[3] = data;
      }
      {
        const { requests, responseResolves } = makeAsterFeatureRequestParams();
        const data = await doZkTls(requests, responseResolves, { requestParamsCallback: makeAsterFeatureRequestParams });
        allData[4] = data;
      }
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
