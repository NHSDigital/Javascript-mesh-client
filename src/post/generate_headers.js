import crypto from "crypto";
import { v4 as uuid } from "uuid";

// Generates the token, this will be generated fresh for each call, as required by MESH
async function generateToken(
  mailboxID,
  mailboxPassword,
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
  const hmac_msg = `${mailboxID}:${nonce}:${nonce_count}:${mailboxPassword}:${timestamp}`;

  const hmac = crypto
    .createHmac("sha256", mesh_shared_key)
    .update(hmac_msg)
    .digest("hex");

  return `${auth_schema_name}${mailboxID}:${nonce}:${nonce_count}:${timestamp}:${hmac}`;
}

async function generateHeaders(mailboxID, mailboxPassword, mailboxTarget) {
  const token = await generateToken(mailboxID, mailboxPassword);
  const header = {
    accept: "application/vnd.mesh.v2+json",
    authorization: token,
    "content-type": "application/octet-stream",
    "mex-clientversion": "ApiDocs==0.0.1",
    "mex-from": mailboxID,
    "mex-to": mailboxTarget,
    "mex-workflowid": "API-DOCS-TEST",
    "mex-filename": "None",
    "mex-osarchitecture": "x86_64",
    "mex-osname": "Linux",
    "mex-osversion": "#44~18.04.2-Ubuntu",
    "Content-Type": "application/json",
  };
  return header;
}

export default generateHeaders;
