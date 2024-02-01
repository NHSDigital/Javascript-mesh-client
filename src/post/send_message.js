import axios from "axios";
import log from "loglevel";
import generateHeaders from "../headers/generate_headers.js";
import zlib from "zlib";

function safeStringify(obj) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }
    return value;
  });
}

async function sendMessage({
  url,
  mailboxID,
  mailboxPassword,
  sharedKey,
  message,
  mailboxTarget,
  agent,
  compressed = false,
  workFlowId = "API-DOCS-TEST",
  fileName = "message.txt",
}) {
  const fullUrl = `${url}/messageexchange/${mailboxID}/outbox`;
  const headers = await generateHeaders({
    mailboxID: mailboxID,
    mailboxPassword: mailboxPassword,
    mailboxTarget: mailboxTarget,
    sharedKey: sharedKey,
  });
  headers["content-type"] = "application/octet-stream";
  headers["mex-from"] = mailboxID;
  headers["mex-to"] = mailboxTarget;
  headers["mex-workflowid"] = workFlowId;
  headers["mex-filename"] = fileName;

  if (compressed) {
    headers["content-encoding"] = "gzip";
  }

  let config = { headers: headers, httpsAgent: agent, setTimeout: 10000 };

  // let data = zlib.gzipSync(JSON.stringify({ data: message }))

  let data = compressed ? zlib.gzipSync(JSON.stringify(message)) : message;

  const response = await axios.post(fullUrl, data, config);
  try {
    if (response.status === 202) {
      log.debug(`request headers: ${safeStringify(config.headers)}`);
      log.debug(`Create message status: ${response.status}`);
      log.debug(`Create message data: ${JSON.stringify(response.data)}`);
      return response;
    } else {
      console.error(
        "ERROR: Request 'getMessages' completed but responded with incorrect status: " +
          response.status
      );
      process.exit(1);
    }
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      log.error(
        `Request failed with status code ${error.response.status}: ${error.response.statusText}`
      );
      return error;
    } else if (error.request) {
      // The request was made but no response was received
      log.error("No response was received for the request");
      return error;
    } else {
      // Something happened in setting up the request that triggered an Error
      log.error("Error:", error.message);
      return error;
    }
  }
}

export default sendMessage;
