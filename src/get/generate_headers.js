import crypto from "crypto";
import { v4 as uuid } from "uuid";

// Generates the token, this will be generated fresh for each call, as required by MESH
async function generateToken(
  mailboxID,
  password,
  sharedKey,
  nonce = uuid(),
  nonceCount = 0
) {
  // Make sure to leave a space at the end of the schema.
  const auth_schema_name = "NHSMESH ";
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 12);
  const hmac_msg = `${mailboxID}:${nonce}:${nonceCount}:${password}:${timestamp}`;

  const hmac = crypto
    .createHmac("sha256", sharedKey)
    .update(hmac_msg)
    .digest("hex");

  return `${auth_schema_name}${mailboxID}:${nonce}:${nonceCount}:${timestamp}:${hmac}`;
}

async function generateHeaders(mailboxID, mailboxPassword, sharedKey) {
  const token = await generateToken(mailboxID, mailboxPassword, sharedKey);
  const header = {
    accept: "application/vnd.mesh.v2+json",
    authorization: token,
    "mex-clientversion": "ApiDocs==0.0.1",
    "mex-osarchitecture": "x86_64",
    "mex-osname": "Linux",
    "mex-osversion": "#44~18.04.2-Ubuntu",
    "Content-Type": "application/json",
  };
  return header;
}

export default generateHeaders;
