import axios from "axios";
import { Agent } from "https";
import { readFileSync } from "fs";
import log from "loglevel";
import generateHeaders from "./generate_headers.js";

async function markAsRead({
  url,
  mailbox_id,
  mailbox_password,
  shared_key,
  message,
  agent,
}) {
  let full_url = `${url}/messageexchange/${mailbox_id}/inbox/${message}/status/acknowledged`;
  let headers = await generateHeaders(mailbox_id, mailbox_password, shared_key);

  let config = { headers: headers };
  // attach agent to headers
  config.httpsAgent = agent;
  let response = await axios.put(full_url, { messageId: message }, config);
  try {
    if (response.status === 200) {
      log.info("message cleared\n");
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
    console.error(error);
    process.exit(1);
  }
}

export default markAsRead;
