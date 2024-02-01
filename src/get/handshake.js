import axios from "axios";
import generateHeaders from "../headers/generate_headers.js";
import log from "loglevel";

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
    if (response.status === 200) {
      log.debug(`Handshake successful, status ${response.status}\n`);
      return response;
    } else {
      console.error(
        "ERROR: Request 'handShake' completed but responded with incorrect status: " +
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

export default handShake;
