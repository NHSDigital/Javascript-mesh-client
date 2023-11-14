import axios from "axios";
import generateHeaders from "./generate_headers.js";
import log from "loglevel";

async function handShake({
  url,
  mailboxID,
  mailboxPassword,
  sharedKey,
  tlsEnabled,
  agent,
}) {
  const full_url = `${url}/messageexchange/${mailboxID}`;
  const headers = await generateHeaders(mailboxID, mailboxPassword, sharedKey);

  let config = { headers: headers };
  if (tlsEnabled) {
    config.httpsAgent = agent;
  }
  const response = await axios.get(full_url, config);
  try {
    if (response.status === 200) {
      log.info(`Handshake successful, status ${response.status}\n`);
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
