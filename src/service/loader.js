import log from "loglevel";
import { Agent } from "https";
import { readFileSync } from "fs";

export default class Loader {
  constructor(dotenv) {
    const logLevel = process.env.LOG_LEVEL || "DEBUG";
    log.setLevel(log.levels[logLevel]);

    const result = dotenv.config();
    if (result.error) {
      throw result.error;
    }
    log.debug("Environment variables loaded.");

    // For sandbox environment use hardcoded Strings
    this.url = process.env.MESH_URL || "https://localhost:8700";
    this.sharedKey = process.env.MESH_SHARED_KEY || "TestKey";
    this.sandbox = process.env.MESH_SANDBOX || "true";
    if (this.sandbox === "true") {
      log.debug("Running in sandbox mode");
      // just setup to ignore self-signed certs
      senderAgent = new Agent({
        rejectUnauthorized: false,
      });

      receiverAgent = new Agent({
        rejectUnauthorized: false,
      });
    } else {
      this.senderAgent = new Agent({
        cert: readFileSync(process.env.MESH_SENDER_CERT_LOCATION),
        key: readFileSync(process.env.MESH_SENDER_KEY_LOCATION),
        rejectUnauthorized: false,
      });
      this.receiverAgent = new Agent({
        cert: readFileSync(process.env.MESH_RECEIVER_CERT_LOCATION),
        key: readFileSync(process.env.MESH_RECEIVER_KEY_LOCATION),
        rejectUnauthorized: false,
      });
    };
    this.senderMailboxID = process.env.MESH_SENDER_MAILBOX_ID || "X26ABC1";
    this.receiverMailboxID = process.env.MESH_RECEIVER_MAILBOX_ID || "X26ABC2";
    this.senderMailboxPassword = process.env.MESH_SENDER_MAILBOX_PASSWORD || "password";
    this.receiverMailboxPassword = process.env.MESH_RECEIVER_MAILBOX_PASSWORD || "password";
  }

  senderConfig() {
    return {
      url: this.url,
      mailboxID: this.senderMailboxID,
      mailboxPassword: this.senderMailboxPassword,
      sharedKey: this.sharedKey,
      agent: this.senderAgent
    }
  }

  receiverConfig() {
    return {
      url: this.url,
      mailboxID: this.receiverMailboxID,
      mailboxPassword: this.receiverMailboxPassword,
      sharedKey: this.sharedKey,
      agent: this.receiverAgent
    }
  }
}
