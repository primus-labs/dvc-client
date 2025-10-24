const { doProve, makeBinanceRequestParams } = require("./utils.js")

async function main() {
  let origRequests = [];
  // const authorization = ""; // Here set the Authorization
  if (authorization === "") {
    console.log("Should set Authorization first in file: src/demo_unipay.js#L5");
    process.exit(1);
  }

  // const accounts = ["MK4", "HB", "S1-MK4", "S2-MK4", "MK4-BTC"];
  const accounts = ["S2-MK4"];
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    origRequests.push({
      url: "https://exchange.unipay.dev/public/positionRisk",
      headers: {
        "account": `${account}`,
        "Authorization": `${authorization}`,
      }
    });
    origRequests.push({
      url: "https://exchange.unipay.dev/public/balance",
      headers: {
        "account": `${account}`,
        "Authorization": `${authorization}`,
      }
    });
  }


  const RISK_URL = "https://exchange.unipay.dev/public/positionRisk";
  const BALANCE_URL = "https://exchange.unipay.dev/public/balance";
  const { requests, responseResolves } = makeBinanceRequestParams(origRequests, RISK_URL, BALANCE_URL);
  console.log('requests', requests);
  console.log('responseResolves', responseResolves);

  const result = await doProve(requests, responseResolves, {
    sslCipher: 'ECDHE-ECDSA-AES128-GCM-SHA256',
    // runZkvm: false,
    // noProxy: false
  });
  console.log('result', result);
  console.log('proof fixture:', JSON.parse(result?.details?.proof_fixture ?? {}));
}

main();
