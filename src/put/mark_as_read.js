import axios from "axios";
import { Agent } from "https";
import log from "loglevel";
import generateHeaders from "../headers/generate_headers.js";

/**
 * Marks a specified message as read in the mailbox. It constructs a PUT request to the service endpoint
 * to update the message status to 'acknowledged'. Generates necessary headers for authentication and authorization.
 *
 * @param {Object} params - The parameters for the mark as read operation.
 * @param {string} params.url - The base URL for the message exchange service.
 * @param {string} params.mailboxID - The mailbox ID used in the URL and for generating headers.
 * @param {string} params.mailboxPassword - The mailbox password used for generating headers.
 * @param {string} params.sharedKey - The shared key used for generating headers.
 * @param {string} params.message - The ID of the message to mark as read.
 * @param {Agent} params.agent - The HTTPS agent for the request, used for its SSL/TLS configurations.
 * @returns {Promise<Object>} A promise that resolves with the server response if the request is successful.
 * If the response status is not 200, the process will exit with an error. If an error occurs during the request,
 * it logs the error and returns the error object.
 * @throws {Error} If setting up the request or executing it results in an error, an Error object is thrown.
 */
async function markAsRead({
  url,
  mailboxID,
  mailboxPassword,
  sharedKey,
  message,
  agent,
}) {
  let full_url = `${url}/messageexchange/${mailboxID}/inbox/${message}/status/acknowledged`;
  let headers = await generateHeaders({
    mailboxID: mailboxID,
    mailboxPassword: mailboxPassword,
    sharedKey: sharedKey,
  });
  headers["content-type"] = "application/octet-stream";

  let config = { headers: headers };
  // attach agent to headers
  config.httpsAgent = agent;
  let response = await axios.put(full_url, { messageId: message }, config);
  try {
    if (response.status === 200) {
      log.debug("message cleared\n");
      return response;
    } else {
      console.error(
        "ERROR: Request 'getMessages' completed but responded with incorrect status: " +
          response.status +
          "\n"
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

export default markAsRead;
