import fs from "fs";
import axios from "axios";
import zlib from "zlib";
import log from "loglevel";
import generateHeaders from "../headers/generate_headers.js";

const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Compresses and sends a single chunk of data after gzip compression.
 *
 * @async
 * @function compressAndSendChunk
 * @param {Object} params
 * @param {Buffer} params.chunk - The chunk of file data to compress and send.
 * @param {Object} params.headers - The headers for the HTTP request.
 * @param {string} params.url - The URL to which the chunk will be posted.
 * @param {Object} params.agent - The HTTPS agent configuration.
 * @param {number} params.index - The index of the current chunk.
 * @param {number} params.totalChunks - The total number of chunks.
 * @returns {Promise<Object>} A promise that resolves with the HTTP response.
 */
async function compressAndSendChunk({ chunk, headers, url, agent }) {
  return new Promise((resolve, reject) => {
    zlib.gzip(chunk, async (err, buffer) => {
      if (err) {
        reject(err);
        return;
      }
      if (!headers) {
        console.error("Headers object is undefined.");
        return;
      }
      let config = { headers: headers, httpsAgent: agent, setTimeout: 10000 };

      try {
        let response = await axios.post(url, buffer, config);
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Sends a large file in chunks, compressing each chunk before sending.
 * Reads the file as a stream and handles each chunk sequentially.
 *
 * @async
 * @function sendChunkedMessage
 * @param {Object} params Parameters for sending chunked messages
 * @param {string} params.filePath - The path to the file to send.
 * @param {string} params.url - The base URL for the message exchange service.
 * @param {string} params.mailboxID - The sender's mailbox ID.
 * @param {string} params.mailboxPassword - The sender's mailbox password.
 * @param {string} params.sharedKey - The shared key for generating headers.
 * @param {string} params.mailboxTarget - The recipient's mailbox ID.
 * @param {Object} params.agent - The HTTPS agent for the request, handling SSL/TLS configurations and timeouts.
 * @returns {Promise<void>} A promise that resolves when all chunks have been sent successfully.
 */
async function sendChunkedMessage({
  filePath,
  url,
  mailboxID,
  mailboxPassword,
  sharedKey,
  mailboxTarget,
  agent,
}) {
  const fileStream = fs.createReadStream(filePath, {
    highWaterMark: CHUNK_SIZE,
  });
  let index = 0;
  let totalChunks = Math.ceil(fs.statSync(filePath).size / CHUNK_SIZE);
  log.info(`Total number of chunks: ${totalChunks}`);
  let messageID;

  for await (const chunk of fileStream) {
    let headers = await generateHeaders({
      mailboxID: mailboxID,
      mailboxPassword: mailboxPassword,
      sharedKey: sharedKey,
    });
    headers["content-type"] = "application/octet-stream";
    headers["mex-from"] = mailboxID;
    headers["mex-to"] = mailboxTarget;
    headers["mex-workflowid"] = "API-DOCS-TEST";
    headers["mex-filename"] = "message.txt.gz";
    headers["mex-chunk-range"] = `${index + 1}:${totalChunks}`;
    headers["content-encoding"] = "gzip";

    let fullUrl =
      index === 0
        ? `${url}/messageexchange/${mailboxID}/outbox`
        : `${url}/messageexchange/${mailboxID}/outbox/${messageID}/${
            index + 1
          }`;

    try {
      let response = await compressAndSendChunk({
        chunk,
        headers,
        url: fullUrl,
        agent,
        index,
        totalChunks,
      });
      // log.info(response);
      if (response.status === 202 && index === 0) {
        messageID = response.data["message_id"];
      }
      log.debug(`Chunk ${index + 1}/${totalChunks} sent successfully`);
    } catch (error) {
      log.error(`Failed to send chunk ${index + 1}: ${error}`);
      throw error;
    }

    index++;
  }

  log.debug("All chunks sent successfully");
}

export default sendChunkedMessage;
