import axios from "axios";
import zlib from "zlib";
import log from "loglevel";
import { Readable } from "stream";
import generateHeaders from "../headers/generate_headers.js";

const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB
// const CHUNK_SIZE = 1 * 1024 * 1024; // 1 MB

async function compressData(data) {
  try {
    return new Promise((resolve, reject) => {
      zlib.gzip(data, (err, buffer) => {
        if (err) reject(err);
        else resolve(buffer);
      });
    });
  } catch (error) {
    log.error(`Error: ${error}`);
    process.exit(1);
  }
}

async function splitIntoChunks(buffer) {
  try {
    let chunks = [];
    for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
      chunks.push(buffer.slice(i, i + CHUNK_SIZE));
    }
    return chunks;
  } catch (error) {
    log.error(`Error: ${error}`);
    process.exit(1);
  }
}

async function sendChunkedMessage({
  url,
  mailboxID,
  mailboxPassword,
  sharedKey,
  mailboxTarget,
  agent,
  fileContent,
}) {
  try {
    let result = {
      status: null,
      data: null,
    };
    let messageID;
    let fullUrl;

    // Step 1: chunk the file
    const splitChunks = await splitIntoChunks(fileContent);

    // Step 2: Compress the chunks
    let chunks = [];
    for (let chunk of splitChunks) {
      let compressedChunk = await compressData(chunk);
      chunks.push(compressedChunk);
    }

    log.debug(`number of chunks: ${chunks.length}`);

    // Step 3: Send files over API
    for (let [index, data] of chunks.entries()) {
      // Setup headers, need a new one for each message due to nonce
      let headers = await generateHeaders({
        mailboxID: mailboxID,
        mailboxPassword: mailboxPassword,
        mailboxTarget: mailboxTarget,
        sharedKey: sharedKey,
      });
      headers["content-type"] = "application/octet-stream";
      headers["mex-from"] = mailboxID;
      headers["mex-to"] = mailboxTarget;
      headers["mex-workflowid"] = "API-DOCS-TEST";
      headers["mex-filename"] = "message.txt.gz";
      headers["mex-chunk-range"] = `${index + 1}:${chunks.length}`;
      headers["content-encoding"] = "gzip";
      let config = { headers: headers, httpsAgent: agent, setTimeout: 10000 };

      // First message will not have a message ID, subsequent ones will
      if (messageID) {
        fullUrl = `${url}/messageexchange/${mailboxID}/outbox/${messageID}/${
          index + 1
        }`;
      } else {
        fullUrl = `${url}/messageexchange/${mailboxID}/outbox`;
      }
      log.debug(`Chunk index: ${index}`);
      log.debug(`URL: ${fullUrl}\nheaders: ${JSON.stringify(config.headers)}`);
      let response = await axios.post(fullUrl, data, config);

      if (response.status === 202) {
        log.debug(response.data);
        if (response.data) {
          result.data = response.data;
          result.status = response.status;
        }
        log.debug(`${index + 1} Chunks sent successfully`);
        if (messageID) {
        } else {
          messageID = response.data["message_id"];
          response = response.data;
        }
      } else {
        console.error(
          "ERROR: Request 'sendMessageChunks' completed but responded with incorrect status: " +
            response.status
        );
        process.exit(1);
      }
    }
    return result;
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

export default sendChunkedMessage;
