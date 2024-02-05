import axios from "axios";
import fs from "fs";
import log from "loglevel";
import generateHeaders from "../headers/generate_headers.js";

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
        status: 206,
        data: chunkedMessage,
        headers: response.headers,
      };
    } else {
      log.error(
        "ERROR: Request 'getMessages' completed but responded with incorrect status: " +
          response.status
      );
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
