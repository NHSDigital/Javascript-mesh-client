import crypto from "crypto";
import { v4 as uuid } from "uuid";
// @ts-ignore
import pkg from "../../package.json" assert { type: "json" };

/**
 * @namespace generateHeaders
 */

/**
 * Generates an authentication token for MESH. The token is freshly generated for each call.
 *
 * @memberof generateHeaders
 * @function generateToken
 * @param {Object} params Parameters for generating the token.
 * @param {string} params.mailboxID The mailbox ID.
 * @param {string} params.mailboxPassword The password for the mailbox.
 * @param {string} params.sharedKey The shared key for HMAC generation.
 * @param {string} [params.nonce] The nonce value. If not provided, a new UUID v4 is generated.
 * @param {number} [params.nonceCount=0] The nonce count. Defaults to 0.
 * @returns {Promise<string>} The generated token.
 */
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

/**
 * Generates the headers required for a MESH request.
 *
 * @memberof generateHeaders
 * @function generateHeaders
 * @param {Object} params Parameters for header generation.
 * @param {string} params.mailboxID The mailbox ID.
 * @param {string} params.mailboxPassword The password for the mailbox.
 * @param {string} params.sharedKey The shared key for HMAC generation.
 * @returns {Promise<Object>} An object containing the request headers.
 */
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
