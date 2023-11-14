import axios from "axios";
import log from "loglevel";
import generateHeaders from "./generate_headers.js";

async function sendMessage(
  url,
  mailbox_id,
  mailbox_password,
  message,
  mailbox_target,
  tls_enabled,
  agent
) {
  const full_url = `${url}/messageexchange/${mailbox_id}/outbox`;
  const headers = await generateHeaders(
    mailbox_id,
    mailbox_password,
    mailbox_target
  );

  let config = { headers: headers };
  if (tls_enabled) {
    config.httpsAgent = agent;
  }
  const response = await axios.post(full_url, { data: message }, config);
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
