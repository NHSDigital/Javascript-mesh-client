import axios from "axios";
import log from "loglevel";
import generateHeaders from "../headers/generate_headers.js";

/**
 * @namespace readMessage
 */

/**
 * Reads a message from the mailbox, handling both single and chunked message types. For chunked messages,
 * it iteratively requests each chunk until the entire message is retrieved. The function logs the response status,
 * headers, and data. In case of errors, it logs the error details.
 *
 * @memberof readMessage
 * @function readMessage
 * @param {Object} params - The parameters for reading a message.
 * @param {string} params.url - The base URL for the message exchange service.
 * @param {string} params.mailboxID - The mailbox ID, used in generating headers and constructing the URL.
 * @param {string} params.mailboxPassword - The mailbox password, used in generating headers.
 * @param {string} params.sharedKey - The shared key, used in generating headers.
 * @param {string} params.messageID - The specific message ID to read from the inbox.
 * @param {Object} params.agent - The HTTPS agent for the request, handling SSL/TLS configurations and timeouts.
 * @returns {Promise<Object>} - An object containing the status, data, and headers from the response. For chunked
 * messages, data contains the concatenated message data. In case of request failure, returns an error object.
 * @throws {Error} - Throws an error if there are issues with the request setup or parameters, or if the response
 * status indicates an error.
 */
async function readMessage({
  url,
  mailboxID,
  mailboxPassword,
  sharedKey,
  messageID,
  agent,
}) {
  try {
    let chunkedMessage = "";
    let fullUrl = `${url}/messageexchange/${mailboxID}/inbox/${messageID}`;
    let headers = await generateHeaders({
      mailboxID: mailboxID,
      mailboxPassword: mailboxPassword,
      sharedKey: sharedKey,
    });

    let config = { headers: headers, httpsAgent: agent, setTimeout: 10000 };

    let response = await axios.get(fullUrl, config);

    log.debug(`Status: ${response.status}`);
    log.debug(response.headers);
    log.debug(`data: ${response.data}`);

    if (response.status === 200) {
      // if the message is stand alone
      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
      };
    } else if (response.status === 206) {
      log.debug("Message is chunked");
      // log.debug(`message content: ${response.data}`);
      // If the message is chunked then loop through all the chunks and return the assembled message
      do {
        chunkedMessage += response.data;
        let chunkRange = response.headers["mex-chunk-range"];
        let [currentChunk, totalChunks] = chunkRange.split(":").map(Number);
        log.debug(`chunk ${currentChunk} of ${totalChunks} downloaded`);
        if (currentChunk < totalChunks) {
          let headers = await generateHeaders({
            mailboxID: mailboxID,
            mailboxPassword: mailboxPassword,
            sharedKey: sharedKey,
          });

          let config = { headers: headers, httpsAgent: agent };
          // If there are more chunks to fetch, update the URL for the next request
          fullUrl = `${url}/messageexchange/${mailboxID}/inbox/${messageID}/${
            currentChunk + 1
          }`;
          response = await axios.get(fullUrl, config);
        } else {
          break;
        }
      } while (true);

      log.debug(`Chunked Messages: ${JSON.stringify(chunkedMessage)}`);

      return {
        status: response.status,
        data: chunkedMessage,
        headers: response.headers,
      };
    } else {
      log.error(
        "ERROR: Request 'getMessages' completed but responded with incorrect status: " +
          response.status
      );
      return response;
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

export default readMessage;
