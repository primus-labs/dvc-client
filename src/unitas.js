const { doZkTls, doProve,
  makeAsterSpotRequestParams, makeAsterFeatureRequestParams,
  makeBinanceSpotRequestParams, makeBinanceFeatureRequestParams, makeBinanceUnifiedRequestParams,
} = require("./utils.js")
require('dotenv').config();

const interval = Number(process.env.INTERVAL) || 1800;
console.log(`The interval: ${interval} s.`)

async function main() {
  console.log(`Now: ${new Date()}`);
  try {
    let allData = [];
    {
      const { requests, responseResolves } = makeBinanceUnifiedRequestParams();
      const data = await doZkTls(requests, responseResolves, { requestParamsCallback: makeBinanceUnifiedRequestParams });
      allData.push(data);
    }
    {
      const { requests, responseResolves } = makeBinanceSpotRequestParams();
      const data = await doZkTls(requests, responseResolves, { requestParamsCallback: makeBinanceSpotRequestParams });
      allData.push(data);
    }
    {
      const { requests, responseResolves } = makeBinanceFeatureRequestParams();
      const data = await doZkTls(requests, responseResolves, { requestParamsCallback: makeBinanceFeatureRequestParams });
      allData.push(data);
    }

    {
      const { requests, responseResolves } = makeAsterSpotRequestParams();
      const data = await doZkTls(requests, responseResolves, { requestParamsCallback: makeAsterSpotRequestParams });
      allData.push(data);
    }
    {
      const { requests, responseResolves } = makeAsterFeatureRequestParams();
      const data = await doZkTls(requests, responseResolves, { requestParamsCallback: makeAsterFeatureRequestParams });
      allData.push(data);
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
