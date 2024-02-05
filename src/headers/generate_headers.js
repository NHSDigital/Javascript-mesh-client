import crypto from "crypto";
import { v4 as uuid } from "uuid";
import pkg from "../../package.json" assert { type: "json" };

// Generates the token, this will be generated fresh for each call, as required by MESH
async function generateToken({
  mailboxID,
  mailboxPassword,
  sharedKey,
  nonce = uuid(),
  nonceCount = 0,
}) {
  // Make sure to leave a space at the end of the schema.
  let auth_schema_name = "NHSMESH ";
  let timestamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 12);
  let hmac_msg = `${mailboxID}:${nonce}:${nonceCount}:${mailboxPassword}:${timestamp}`;

  let hmac = crypto
    .createHmac("sha256", sharedKey)
    .update(hmac_msg)
    .digest("hex");

  return `${auth_schema_name}${mailboxID}:${nonce}:${nonceCount}:${timestamp}:${hmac}`;
}

async function generateHeaders({ mailboxID, mailboxPassword, sharedKey }) {
  let token = await generateToken({
    mailboxID: mailboxID,
    mailboxPassword: mailboxPassword,
    sharedKey: sharedKey,
  });
  let header = {
    accept: "application/vnd.mesh.v2+json",
    authorization: token,
    "mex-clientversion": `javascript-mesh-client==${pkg.version}`,
    "mex-osarchitecture": "x86_64",
    "mex-osname": "Linux",
    "mex-osversion": "#44~18.04.2-Ubuntu",
  };
  return header;
}

export default generateHeaders;
