import axios from "axios";
import { Agent } from "https";
import { readFileSync } from "fs";
import log from "loglevel";
import generateHeaders from "./generate_headers.js";

async function getMessageCount({
  url,
  mailboxID,
  mailboxPassword,
  sharedKey,
  tlsEnabled,
  agent,
}) {
  const fullUrl = `${url}/messageexchange/${mailboxID}/inbox`;
  const headers = await generateHeaders(mailboxID, mailboxPassword, sharedKey);

  let config = { headers: headers };
  if (tlsEnabled) {
    config.httpsAgent = agent;
  }
  const response = await axios.get(fullUrl, config);
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
