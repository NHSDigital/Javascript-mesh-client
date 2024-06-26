import axios from "axios";
import fs from "fs";
import log from "loglevel";
import generateHeaders from "../headers/generate_headers.js";

/**
 * Reads a message from the mailbox, handling both single and chunked message types.
 * Regenerates headers for each request due to nonce requirements.
 * @async
 * @param {Object} params - The parameters for reading a message.
 * @param {string} params.url - URL for the mesh service.
 * @param {string} params.mailboxID - Mesh mailbox ID.
 * @param {string} params.mailboxPassword - Mesh mailbox password.
 * @param {string} params.sharedKey - Secondary password for mesh mailbox.
 * @param {string} params.messageID - The identifier for the mesh message.
 * @param {Object} params.agent - Axios agent for HTTPS configuration.
 * @param {string} params.outputFilePath - The path to where the file should be saved.
 * @returns {Promise<Object>} An object containing the status and path of the local file with the data.
 */
async function readMessage({
  url,
  mailboxID,
  mailboxPassword,
  sharedKey,
  messageID,
  agent,
  outputFilePath,
}) {
  const outputStream = fs.createWriteStream(outputFilePath);

  let initial_response;
  try {
    for (let currentChunk = 1; ; currentChunk++) {
      const headers = await generateHeaders({
        mailboxID: mailboxID,
        mailboxPassword: mailboxPassword,
        sharedKey: sharedKey,
      });

      /**
       * @type {import('axios').AxiosRequestConfig}
       */
      const config = {
        headers: headers,
        httpsAgent: agent,
        responseType: "stream",
      };

      const fullUrl = `${url}/messageexchange/${mailboxID}/inbox/${messageID}/${currentChunk}`;
      const response = await axios.get(fullUrl, config);
      if (currentChunk === 1) {
        initial_response = response;
      }

      log.debug(`Fetched chunk ${currentChunk}: status ${response.status}`);

      if (response.status === 200 || response.status === 206) {
        await new Promise((resolve, reject) => {
          response.data.pipe(outputStream, { end: false });
          response.data.on("end", resolve);
          response.data.on("error", reject);
        });

        // Break the loop if it was the last chunk
        if (
          !response.headers["mex-chunk-range"] ||
          currentChunk ===
            parseInt(response.headers["mex-chunk-range"].split(":")[1], 10)
        ) {
          log.debug("Last chunk received, finishing download.");
          break;
        }
      } else {
        log.error("ERROR: Unexpected response status:", response.status);
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    }

    outputStream.end();
    log.debug("All chunks downloaded successfully.");
    return {
      initial_response,
    };
  } catch (error) {
    log.error("Error while reading message:", error);
    outputStream.end();
    throw error;
  }
}

export default readMessage;
