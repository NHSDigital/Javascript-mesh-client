import axios from "axios";
import log from "loglevel";
import generateHeaders from "./generate_headers.js";

async function getMessageCount({
  url,
  mailboxID,
  mailboxPassword,
  sharedKey,
  agent,
}) {
  let fullUrl = `${url}/messageexchange/${mailboxID}/inbox`;
  let headers = await generateHeaders({
    mailboxID: mailboxID,
    mailboxPassword: mailboxPassword,
    sharedKey: sharedKey,
  });

  let config = { headers: headers };
  // attach agent to headers
  config.httpsAgent = agent;
  let response = await axios.get(fullUrl, config);
  try {
    if (response.status === 200) {
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

export default getMessageCount;
