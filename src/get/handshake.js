import axios from "axios";
import generateHeaders from "./generate_headers.js";
import log from "loglevel";

async function handShake({
  url,
  mailboxID,
  mailboxPassword,
  sharedKey,
  agent,
}) {
  let full_url = `${url}/messageexchange/${mailboxID}`;
  let headers = await generateHeaders({
    mailboxID: mailboxID,
    mailboxPassword: mailboxPassword,
    sharedKey: sharedKey,
  });

  let config = { headers: headers };
  // attach agent to headers
  config.httpsAgent = agent;
  try {
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
    console.error(error);
  }
}

export default handShake;
