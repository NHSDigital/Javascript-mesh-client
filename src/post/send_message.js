import axios from "axios";
import log from "loglevel";
import generateHeaders from "./generate_headers.js";

async function sendMessage({
  url,
  mailboxID,
  mailboxPassword,
  sharedKey,
  message,
  mailboxTarget,
  agent,
}) {
  const fullUrl = `${url}/messageexchange/${mailboxID}/outbox`;
  const headers = await generateHeaders({
    mailboxID: mailboxID,
    mailboxPassword: mailboxPassword,
    mailboxTarget: mailboxTarget,
    sharedKey: sharedKey,
  });

  let config = { headers: headers };
  // attach agent to headers
  config.httpsAgent = agent;
  const response = await axios.post(fullUrl, { data: message }, config);
  try {
    if (response.status === 202) {
      log.debug("Create message successful: " + response.status);
      return response;
    } else {
      console.error(
        "ERROR: Request 'getMessages' completed but responded with incorrect status: " +
          response.status
      );
      process.exit(1);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

export default sendMessage;
