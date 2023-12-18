import log from "loglevel";
import fs from "fs";
import path from "node:path";
import handShake from "../get/handshake.js";

const logLevel = process.env.LOG_LEVEL || "DEBUG";
log.setLevel(log.levels[logLevel]);

// Timeout for receiving a file
export async function waitSeconds() {
  log.debug("\nChecking connection to mailbox with handshake");
  const seconds = process.env.MESH_RECEIVE_TIMEOUT;
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`${seconds} seconds have passed.`);
    }, seconds * 1000);
  });
}

// Check connection by performing a handshake
export async function checkConnection(
  url,
  mailboxID,
  mailboxPassword,
  sharedKey,
  agent
) {
  log.debug("\nChecking connection to mailbox with handshake");
  await handShake({
    url: url,
    mailboxID: mailboxID,
    mailboxPassword: mailboxPassword,
    sharedKey: sharedKey,
    agent: agent,
  });
}

// Remove all files from a directory
export async function emptyDir(__dirname) {
  fs.readdir(__dirname, (err, files) => {
    if (err) throw err;
    for (const file of files) {
      fs.unlink(path.join(__dirname, file), (err) => {
        if (err) throw err;
      });
    }
  });
}
