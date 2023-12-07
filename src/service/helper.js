import log from "loglevel";
import handShake from "../get/handshake.js";

let logLevel = process.env.LOG_LEVEL || "DEBUG";
log.setLevel(log.levels[logLevel]);

// A 30 second wait timer to allow the messages to be received and processed by mesh
// Override this value by passing custom seconds when invoked
export async function waitThirtySeconds(override) {
  log.debug("\nChecking connection to mailbox with handshake");
  return new Promise((resolve) => {
    if (override === undefined) {
      setTimeout(() => {
        resolve("30 seconds have passed.");
      }, 30000); // 30000 milliseconds = 30 seconds
    } else {
      setTimeout(() => {
        resolve(`${override} seconds have passed.`);
      }, override * 1000); // custom milliseconds = override seconds
    }
  });
}

// Check connection by performing a handshake
export async function checkConnection(url, mailboxID, mailboxPassword, sharedKey, agent) {
  log.debug("\nChecking connection to mailbox with handshake");
  await handShake({
    url: url,
    mailboxID: mailboxID,
    mailboxPassword: mailboxPassword,
    sharedKey: sharedKey,
    agent: agent
  });
}
