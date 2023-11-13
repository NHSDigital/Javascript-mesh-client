import axios from "axios";
import log from "loglevel";
import crypto from "crypto";
import { v4 as uuid } from "uuid";

// Generates the token, this will be generated fresh for each call, as required by MESH
async function generateToken(
  mailbox_id,
  password,
  nonce = uuid(),
  nonce_count = 0
) {
  //   Make sure the mesh shared key is set as an environmental var
  const mesh_shared_key = process.env.MESH_SHARED_KEY;

  // Make sure to leave a space at the end of the schema.
  const auth_schema_name = "NHSMESH ";
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 12);
  const hmac_msg = `${mailbox_id}:${nonce}:${nonce_count}:${password}:${timestamp}`;

  const hmac = crypto
    .createHmac("sha256", mesh_shared_key)
    .update(hmac_msg)
    .digest("hex");

  return `${auth_schema_name}${mailbox_id}:${nonce}:${nonce_count}:${timestamp}:${hmac}`;
}

async function generateHeaders(mailbox_id, mailbox_password, mailbox_target) {
  const token = await generateToken(mailbox_id, mailbox_password);
  const header = {
    accept: "application/vnd.mesh.v2+json",
    authorization: token,
    "content-type": "application/octet-stream",
    "mex-clientversion": "ApiDocs==0.0.1",
    "mex-from": mailbox_id,
    "mex-to": mailbox_target,
    "mex-workflowid": "API-DOCS-TEST",
    "mex-filename": "None",
    "mex-osarchitecture": "x86_64",
    "mex-osname": "Linux",
    "mex-osversion": "#44~18.04.2-Ubuntu",
    "Content-Type": "application/json",
  };
  return header;
}

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
  } catch {
    console.error(error);
    exit(1);
  }
}

export default sendMessage;
