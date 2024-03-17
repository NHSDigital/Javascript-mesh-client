import axios from "axios";
import generateHeaders from "../headers/generate_headers.js";
import log from "loglevel";

/**
 * @namespace handShake
 */

/**
 * Performs a handshake operation with a specified URL using the mailbox credentials and shared key.
 * It constructs the full URL, generates necessary headers, and sends a GET request to the server.
 * Logs the outcome and returns the response if successful; otherwise, logs the error.
 *
 * A successful response should have a status of 200, but that needs to be checked at the client side.
 *
 * @memberof handShake
 * @function handShake
 * @param {Object} params - The parameters for the handshake operation.
 * @param {string} params.url - The base URL for the handshake operation.
 * @param {string} params.mailboxID - The mailbox ID used for generating headers.
 * @param {string} params.mailboxPassword - The mailbox password used for generating headers.
 * @param {string} params.sharedKey - The shared key used for generating headers.
 * @param {Object} params.agent - The HTTPS agent used for the request (for handling SSL/TLS configurations).
 * @returns {Promise<Object>} A promise that resolves to an Axios response object.
 * The promise may reject with an Axios error object if the request fails.
 * @throws {Error} - Throws an error if the request setup fails before sending or if there are issues with parameters.
 *
 */
async function handShake({
  url,
  mailboxID,
  mailboxPassword,
  sharedKey,
  agent,
}) {
  try {
    let full_url = `${url}/messageexchange/${mailboxID}`;
    let headers = await generateHeaders({
      mailboxID: mailboxID,
      mailboxPassword: mailboxPassword,
      sharedKey: sharedKey,
    });

    let config = { headers: headers, httpsAgent: agent };
    let response = await axios.get(full_url, config);
    return response;
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

export default handShake;
