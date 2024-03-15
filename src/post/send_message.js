import axios from "axios";
import log from "loglevel";
import generateHeaders from "../headers/generate_headers.js";
import zlib from "zlib";

/**
 * Safely stringifies an object into JSON format, avoiding circular reference issues.
 * @module post
 * @param {Object} obj - The object to stringify.
 * @returns {string} A JSON string representation of the object.
 */
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

/**
 * Sends a message to a specified mailbox, with options for compression and custom headers.
 * The message is sent to the outbox of the specified mailbox ID at the given URL.
 *
 * @module post
 * @param {Object} params - The parameters for sending a message.
 * @param {string} params.url - The base URL for the message exchange service.
 * @param {string} params.mailboxID - The sender's mailbox ID.
 * @param {string} params.mailboxPassword - The sender's mailbox password.
 * @param {string} params.sharedKey - The shared key for generating headers.
 * @param {string|Buffer} params.message - The message content to send. If compression is enabled, the message should be a string that will be converted to Buffer.
 * @param {string} params.mailboxTarget - The recipient's mailbox ID.
 * @param {Object} params.agent - The HTTPS agent for the request, handling SSL/TLS configurations and timeouts.
 * @param {boolean} [params.compressed=false] - Flag indicating whether the message should be compressed with gzip before sending.
 * @param {string} [params.workFlowId="API-DOCS-TEST"] - The workflow ID to include in the message headers.
 * @param {string} [params.fileName="message.txt"] - The file name to include in the message headers.
 * @returns {Promise<Object>} A promise that resolves with the response from the server if the request is successful, or an error object if the request fails.
 * @throws {Error} Throws an error if the request setup fails or if there are issues with the parameters.
 */
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
