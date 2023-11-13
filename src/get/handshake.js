import axios from "axios";
import generateHeaders from "./generate_headers.js";
import log from "loglevel";

async function handShake(
  url,
  mailbox_id,
  mailbox_password,
  shared_key,
  ssl_enabled,
  agent
) {
  const full_url = `${url}/messageexchange/${mailbox_id}`;
  const headers = await generateHeaders(
    mailbox_id,
    mailbox_password,
    shared_key
  );

  let config = { headers: headers };
  if (ssl_enabled) {
    config.httpsAgent = agent;
  }
  const response = await axios.get(full_url, config);
  try {
    if (response.status === 200) {
      log.info("Handshake successful, status " + response.status);
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
