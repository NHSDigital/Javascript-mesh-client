import axios from "axios";
import log from "loglevel";
import generateHeaders from "../headers/generate_headers.js";

/**
 * @namespace getMessageCount
 * @memberof getMessageCount
 */

/**
 * Retrieves the count of messages in the mailbox's inbox. It constructs the URL for the inbox,
 * generates the necessary headers, and sends a GET request. The response, containing the
 * message count, is returned directly.
 *
 * If the request encounters errors (e.g., network issues, server errors), it logs the error details.
 * A successful response should have a status of 200, but that needs to be checked at the client side.
 *
 * @memberof getMessageCount
 * @function getMessageCount
 * @param {Object} params - The parameters for fetching the message count.
 * @param {string} params.url - The base URL for the message exchange service.
 * @param {string} params.mailboxID - The mailbox ID, used in generating headers and constructing the URL.
 * @param {string} params.mailboxPassword - The mailbox password, used in generating headers.
 * @param {string} params.sharedKey - The shared key, used in generating headers.
 * @param {Object} params.agent - The HTTPS agent for the request, handling SSL/TLS configurations and timeouts.
 * @returns {Promise<Object>} - The Axios response object if the request is successful; otherwise, an error object.
 * @throws {Error} - Throws an error if there are issues with the request setup or parameters.
 */
async function getMessageCount({
  url,
  mailboxID,
  mailboxPassword,
  sharedKey,
  agent,
}) {
  try {
    let fullUrl = `${url}/messageexchange/${mailboxID}/inbox`;
    let headers = await generateHeaders({
      mailboxID: mailboxID,
      mailboxPassword: mailboxPassword,
      sharedKey: sharedKey,
    });

    let config = { headers: headers, httpsAgent: agent, setTimeout: 10000 };
    let response = await axios.get(fullUrl, config);
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

export default getMessageCount;
