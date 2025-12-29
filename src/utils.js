const { PrimusNetwork } = require('@primuslabs/network-core-sdk/dist');
const { ethers } = require('ethers');
const crypto = require("crypto");
require('dotenv').config();

const ZKTLS_PROVE_URL = `${process.env.ZKVM_SERVICE_URL}/zktls/prove`
const ZKTLS_RESULT_URL = `${process.env.ZKVM_SERVICE_URL}/zktls/result`

let logVerbose = Number(process.env.LOG_VERBOSE) || 0;
if (logVerbose < 0) logVerbose = 9;


async function postJson(url, data, headers = {}) {
  const start = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(data ?? {}),
    });

    const duration = Date.now() - start;

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `HTTP ${response.status} ${response.statusText} - ${url}\nResponse: ${text.slice(0, 300)}`
      );
    }

    const result = await response.json().catch(() => {
      throw new Error(`Invalid JSON response from ${url}`);
    });

    console.debug(`✅ fetch ${url} (${duration}ms)`);
    return result;

  } catch (err) {
    console.error(`❌ fetch ${url} failed:`, err.message);
    throw err;
  }
}


async function zktlsProve(data, headers = {}) {
  return await postJson(ZKTLS_PROVE_URL, data, headers);
}

async function zktlsResult(data, headers = {}) {
  return await postJson(ZKTLS_RESULT_URL, data, headers);
}

async function doZkTls(requests, responseResolves, options = {}) {
  const defaultOptions = {
    sslCipher: 'ECDHE-RSA-AES128-GCM-SHA256',
    algorithmType: 'mpctls',
    specialTask: undefined,
    noProxy: true,
    runZkvm: true,
    requestParamsCallback: undefined,
  };
  const opts = { ...defaultOptions, ...options };

  if (!Array.isArray(requests) || requests.length !== responseResolves.length || requests.length === 0) {
    throw new Error("Invalid 'requests' or 'responseResolves' size");
  }

  const requiredEnv = ["PRIVATE_KEY", "CHAIN_ID", "RPC_URL"];
  for (const key of requiredEnv) {
    if (!process.env[key]) {
      throw new Error(`Missing environment variable: ${key}`);
    }
  }

  const { PRIVATE_KEY, CHAIN_ID, RPC_URL } = process.env;

  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const primusNetwork = new PrimusNetwork();


  try {
    console.log("🚀 Initializing PrimusNetwork...");
    const initResult = await primusNetwork.init(wallet, +CHAIN_ID, 'native');
    console.log("✅ PrimusNetwork initialized:", initResult);
  } catch (err) {
    throw new Error(`PrimusNetwork init failed: ${err.message || err}`);
  }

  const attestParams = {
    address: '0x810b7bacEfD5ba495bB688bbFD2501C904036AB7',
  };

  let attestResult, taskResult;
  try {
    async function submitTaskWithRetry(attestParams, maxRetries = 5, baseDelay = 1000) {
      let attempt = 0;
      while (true) {
        try {
          const submitResult = await primusNetwork.submitTask(attestParams);
          return submitResult;
        } catch (err) {
          attempt++;
          console.warn(`⚠️ submitTask attempt ${attempt} failed:`, err?.message || err);

          if (attempt > maxRetries) {
            console.error(`❌ submitTask failed after ${maxRetries} retries`);
            throw err;
          }

          const delay = baseDelay * 2 ** (attempt - 1);
          console.log(`⏳ Retrying in ${delay} ms...`);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    console.log("📝 Submitting task...");
    const submitStart = Date.now();
    const submitResult = await submitTaskWithRetry(attestParams, 5, 1000);
    console.log(`✅ submitTask done (${Date.now() - submitStart}ms):`, submitResult);

    async function attestWithRetry(maxRetries = 3, baseDelay = 1000) {
      let attempt = 0;
      while (true) {
        let reqs = requests;
        let resps = responseResolves;
        if (opts.requestParamsCallback) {
          const { requests, responseResolves } = opts.requestParamsCallback();
          reqs = requests;
          resps = responseResolves;
        }
        const attestParamsFull = {
          ...attestParams,
          ...submitResult,
          requests: reqs,
          responseResolves: resps,
          sslCipher: opts.sslCipher,
          attMode: { algorithmType: opts.algorithmType },
          specialTask: opts.specialTask,
          noProxy: opts.noProxy,
          getAllJsonResponse: "true",
        };

        try {
          const attestResult = await primusNetwork.attest(attestParamsFull, 5 * 60 * 1000);
          if (!attestResult?.[0]?.attestation) {
            throw new Error("Attestation result invalid or empty");
          }
          return attestResult;
        } catch (err) {
          attempt++;
          console.warn(`⚠️ attest attempt ${attempt} failed:`, err?.message || err);

          if (attempt > maxRetries) {
            console.error(`❌ attest failed after ${maxRetries} retries`);
            throw err;
          }

          const delay = baseDelay * 2 ** (attempt - 1);
          console.log(`⏳ Retrying in ${delay} ms...`);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    console.log("⚙️ Running attestation...");
    const attestStart = Date.now();
    attestResult = await attestWithRetry(4, 1000);
    console.log(`✅ attest done (${Date.now() - attestStart}ms):`, attestResult);



    async function verifyAndPollTaskResultWithRetry(attestResult, maxRetries = 5, baseDelay = 1000) {
      let attempt = 0;
      while (true) {
        try {
          const taskResult = await primusNetwork.verifyAndPollTaskResult({
            taskId: attestResult[0].taskId,
            reportTxHash: attestResult[0].reportTxHash,
          });
          return taskResult;
        } catch (err) {
          attempt++;
          console.warn(`⚠️ verifyAndPollTaskResult attempt ${attempt} failed:`, err?.message || err);

          if (attempt > maxRetries) {
            console.error(`❌ verifyAndPollTaskResult failed after ${maxRetries} retries`);
            throw err;
          }

          const delay = baseDelay * 2 ** (attempt - 1);
          console.log(`⏳ Retrying in ${delay} ms...`);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }


    console.log("🔍 Verifying and polling task result...");
    const verifyStart = Date.now();
    taskResult = await verifyAndPollTaskResultWithRetry(attestResult, 5, 1000);
    console.log(`✅ Verification done (${Date.now() - verifyStart}ms):`, taskResult);
  } catch (err) {
    throw new Error(`Task execution failed: ${JSON.stringify(err)}`);
  }

  const taskId = attestResult[0].taskId;
  const allPlainResponse = primusNetwork.getAllJsonResponse(taskId);
  // console.log('📝 allPlainResponse:', allPlainResponse);
  if (!allPlainResponse) {
    throw new Error("Unable to get plain JSON response");
  }

  const zkVmRequestData = {
    attestationData: {
      verification_type: "HASH_COMPARSION",
      public_data: attestResult,
      private_data: { plain_json_response: allPlainResponse },
    },
    requestid: taskId,
  };

  if (logVerbose > 0) {
    console.log("📦 zkVmRequestData:", JSON.stringify(zkVmRequestData));
  }

  return zkVmRequestData;

  // if (!opts.runZkvm) {
  //   console.log("⚠️ ZKVM execution skipped by option.");
  //   return;
  // }
}

async function doProve(allData) {
  // make zkVmRequestData
  const x = BigInt(allData[0].requestid) ^ BigInt(allData[1].requestid) ^ BigInt(allData[2].requestid)
    ^ BigInt(allData[3].requestid) ^ BigInt(allData[4].requestid);
  const requestid = "0x" + x.toString(16).padStart(64, "0");
  const zkVmRequestData = {
    attestationData: {
      "unified": allData[0].attestationData,
      "spot": allData[1].attestationData,
      "feature": allData[2].attestationData,
      "asterSpot": allData[3].attestationData,
      "asterFeature": allData[4].attestationData,
    },
    requestid: requestid,
    version: "20251229" // DO NOT EDIT THIS VERSION
  };

  try {
    console.log("🚀 Request ZKVM proof...");
    async function sendWithRetry(zkVmRequestData, maxRetries = 10, delayMs = 5000) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const sendZkVmRes = await zktlsProve(zkVmRequestData);
        if (sendZkVmRes.code === '0') {
          return sendZkVmRes;
        }

        if (sendZkVmRes.code === '10002') {
          console.warn(`Request ZKVM service is busy, retrying ${attempt}/${maxRetries}...`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
            continue;
          }
        }

        throw new Error(`Request ZKVM failed: ${JSON.stringify(sendZkVmRes)}`);
      }
    }
    await sendWithRetry(zkVmRequestData);


    async function pollZkvmResult(requestid) {
      const zkvmTaskStart = Date.now();
      return new Promise((resolve, reject) => {
        const poll = setInterval(async () => {
          try {
            const getZkVmRes = await zktlsResult({ requestid: requestid });
            if (getZkVmRes.code === '0' && ['done', 'error'].includes(getZkVmRes.details.status)) {
              clearInterval(poll);
              clearTimeout(timeout);
              console.log(`✅ ZKVM task done (${Date.now() - zkvmTaskStart}ms):`, getZkVmRes);
              resolve(getZkVmRes);
            }
          } catch (pollErr) {
            console.warn('⚠️ ZKVM result polling failed:', pollErr.message);
          }
        }, 10000);

        const timeout = setTimeout(() => {
          clearInterval(poll);
          reject(new Error('⏰ Timeout waiting for ZKVM result (10 min)'));
        }, 600000);
      });
    }

    return await pollZkvmResult(zkVmRequestData.requestid);

  } catch (err) {
    throw new Error(`ZKVM prove error: ${err.message || err}`);
  } finally {
  }
}

/*************************!SECTION */
function getAccounts(source) {
  const accounts = [];

  const key = process.env[`${source}_API_KEY`];
  const secret = process.env[`${source}_API_SECRET`];
  if (key && secret) {
    accounts.push({ key, secret });
  }
  for (let i = 1; i <= 100; i++) {
    const key = process.env[`${source}_API_KEY${i}`];
    const secret = process.env[`${source}_API_SECRET${i}`];
    if (key && secret) {
      accounts.push({ key, secret });
    }
  }

  if (accounts.length === 0) {
    throw new Error(`Please configure at least one set of ${source}_API_KEY{i} / ${source}_API_SECRET{i} in .env.`);
  }

  const seen = new Set();
  for (const acc of accounts) {
    if (seen.has(`${acc.key}${acc.secret}`)) {
      throw new Error(`Duplicate ${source}_API_KEY{i} detected`);
    }
    seen.add(`${acc.key}${acc.secret}`);
  }
  return accounts;
}

function getBinanceAccounts() { return getAccounts('BINANCE'); }
function getAsterAccounts() { return getAccounts('ASTER'); }

function signQuery(params, secret) {
  const query = new URLSearchParams(params).toString();
  const signature = crypto.createHmac("sha256", secret).update(query).digest("hex");
  return `${query}&signature=${signature}`;
}

function makerOrigRequests(url, accounts, params = {}) {
  const recvWindow = Number(process.env.RECV_WINDOW) || 60;
  let signParams = { ...params, recvWindow: recvWindow * 1000 };

  let origRequests = []
  for (const acc of accounts) {
    const timestamp = Date.now();
    const query = signQuery({ ...signParams, timestamp }, acc.secret);

    const origRequest = {
      url: `${url}?${query}`,
      headers: { "X-MBX-APIKEY": acc.key }
    };

    origRequests.push(origRequest);
  }

  return origRequests;
}

function makerBinanceOrigRequests(url, params = {}) {
  const accounts = getBinanceAccounts();
  return makerOrigRequests(url, accounts, params);
}

function makerAsterOrigRequests(url, params = {}) {
  const accounts = getAsterAccounts();
  return makerOrigRequests(url, accounts, params);
}

function makeZkTLSRequestParams(origRequests) {
  if (!Array.isArray(origRequests) || origRequests.length < 1) {
    throw new Error("❌ Invalid input: 'origRequests' must be greater than 1.");
  }

  const requests = [];
  const responseResolves = [];

  for (let i = 0; i < origRequests.length; i++) {
    const origRequest = origRequests[i];
    requests.push({
      url: origRequest.url,
      method: "GET",
      header: { ...origRequest.headers },
      body: "",
    });

    responseResolves.push([
      {
        keyName: `${i}`,
        parseType: "json",
        parsePath: "$",
        op: "SHA256_EX",
      },
    ]);
  }

  return { requests, responseResolves };
}

function makeAsterSpotRequestParams() {
  const url = "https://sapi.asterdex.com/api/v1/account";
  const origRequests = makerAsterOrigRequests(url);
  return { origRequests, ...makeZkTLSRequestParams(origRequests) };
}
function makeAsterFeatureRequestParams() {
  const url = "https://fapi.asterdex.com/fapi/v2/balance";
  const origRequests = makerAsterOrigRequests(url);
  return { origRequests, ...makeZkTLSRequestParams(origRequests) };
}

function makeBinanceSpotRequestParams() {
  const url = "https://api.binance.com/api/v3/account";
  const origRequests = makerBinanceOrigRequests(url, { omitZeroBalances: true });
  return { origRequests, ...makeZkTLSRequestParams(origRequests) };
}
function makeBinanceFeatureRequestParams() {
  const url = "https://fapi.binance.com/fapi/v3/balance";
  const origRequests = makerBinanceOrigRequests(url);
  return { origRequests, ...makeZkTLSRequestParams(origRequests) };
}


function makeBinanceUnifiedRiskRequestParams() {
  const url = "https://papi.binance.com/papi/v1/um/positionRisk";
  const origRequests = makerBinanceOrigRequests(url);
  return { origRequests, ...makeZkTLSRequestParams(origRequests) };
}

function makeBinanceUnifiedBalanceRequestParams() {
  const url = "https://papi.binance.com/papi/v1/balance";
  const origRequests = makerBinanceOrigRequests(url);
  return { origRequests, ...makeZkTLSRequestParams(origRequests) };
}

function makeBinanceUnifiedRequestParams() {
  let risk = makeBinanceUnifiedRiskRequestParams();
  let balance = makeBinanceUnifiedBalanceRequestParams();

  if (!Array.isArray(risk.origRequests) || !Array.isArray(balance.origRequests)
    || risk.origRequests.length !== balance.origRequests.length
    || risk.origRequests.length < 1) {
    throw new Error("❌ Invalid input: 'risk.origRequests' or 'balance.origRequests'.");
  }

  // combine risk|balance|risk|balance|...
  let origRequests = [];
  let requests = [];
  let responseResolves = [];
  for (let i = 0; i < risk.origRequests.length; i++) {
    origRequests.push(risk.origRequests[i]);
    origRequests.push(balance.origRequests[i]);
    requests.push(risk.requests[i]);
    requests.push(balance.requests[i]);

    risk.responseResolves[i][0].keyName = `${i * 2}`;
    responseResolves.push(risk.responseResolves[i]);
    balance.responseResolves[i][0].keyName = `${i * 2 + 1}`;
    responseResolves.push(balance.responseResolves[i]);
  }

  return { origRequests, requests, responseResolves };
}

function makeAllRequestParams() {
  const asterSpot = makeAsterSpotRequestParams();
  const asterFeature = makeAsterFeatureRequestParams();
  const binanceSpot = makeBinanceSpotRequestParams();
  const binanceFeature = makeBinanceFeatureRequestParams();
  const binanceUnified = makeBinanceUnifiedRequestParams();
  return { asterSpot, asterFeature, binanceSpot, binanceFeature, binanceUnified };
}

module.exports = {
  zktlsProve, zktlsResult, doZkTls, doProve,
  makeAsterSpotRequestParams, makeAsterFeatureRequestParams,
  makeBinanceSpotRequestParams, makeBinanceFeatureRequestParams, makeBinanceUnifiedRequestParams,
  makeAllRequestParams,
};
