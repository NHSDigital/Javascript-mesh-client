import axios from "axios";
import { Agent } from "https";
import { readFileSync } from "fs";
import log from "loglevel";
import generateHeaders from "./generate_headers.js";

async function readMessage(
  url,
  mailbox_id,
  mailbox_password,
  shared_key,
  message_id,
  ssl_enabled,
  agent
) {
  const full_url = `${url}/messageexchange/${mailbox_id}/inbox/${message_id}`;
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
      return response;
    } else {
      console.error(
        "ERROR: Request 'getMessages' completed but responded with incorrect status: " +
          response.status
      );
      process.exit(1);
    }
  } catch {
    console.error(error);
    exit(1);
  }
}

export default readMessage;
