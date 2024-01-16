import log from "loglevel";
import { Agent } from "https";
import { readFileSync, writeFile } from "fs";
import handShake from "./src/get/handshake.js";
import getMessageCount from "./src/get/message_count.js";
import readMessage from "./src/get/read_message.js";
import markAsRead from "./src/put/mark_as_read.js";
import sendMessage from "./src/post/send_message.js";
import sendMessageChunks from "./src/post/send_message_chunks.js";
import dotenv from "dotenv";

export async function loadConfig() {
  log.debug("Environment variables loaded");

  let logLevel = process.env.LOG_LEVEL || "DEBUG";
  log.setLevel(log.levels[logLevel]);

  // defaults to the local url for the sandbox environment, defaults for sandbox
  let url = process.env.MESH_URL || "https://localhost:8700";

  // This is the shared key for all mailboxes within an account, defaults for sandbox
  let sharedKey = process.env.MESH_SHARED_KEY || "TestKey";

  // This should be "true" for sandbox use, but "false" for integration and prod.
  // must be a string not bool, cant pass bools in as environmental vars
  let sandbox = process.env.MESH_SANDBOX || "true";

  let senderAgent;
  let receiverAgent;
  if (sandbox === "true") {
    log.debug("Running in sandbox mode");
    // just setup to ignore self-signed certs
    senderAgent = new Agent({
      rejectUnauthorized: false,
    });

    receiverAgent = new Agent({
      rejectUnauthorized: false,
    });
  } else {
    log.debug("Running in integration mode");
    // Setup the https agents for integration, you can ignore this for sandbox
    senderAgent = new Agent({
      cert: Buffer.from(process.env.MESH_SENDER_CERT, "base64").toString(
        "utf8"
      ),
      key: Buffer.from(process.env.MESH_SENDER_KEY, "base64").toString("utf8"),
      rejectUnauthorized: false,
    });
    receiverAgent = new Agent({
      cert: process.env.MESH_RECEIVER_CERT,
      key: process.env.MESH_RECEIVER_KEY,
      rejectUnauthorized: false,
    });
  }

  // The 'sender' is the mailbox we will be sending the message from, defaults to sandbox
  let senderMailboxID = process.env.MESH_SENDER_MAILBOX_ID || "X26ABC1";
  let senderMailboxPassword =
    process.env.MESH_SENDER_MAILBOX_PASSWORD || "password";

  let messageContent = process.env.MESH_MESSAGE || "This is a test";
  let messageFile =
    process.env.MESH_DATA_FILE || "./tests/testdata-organizations-100000.csv";
  // The 'receiver' is the mailbox we will be checking for new message, defaults to sandbox
  let receiverMailboxID = process.env.MESH_RECEIVER_MAILBOX_ID || "X26ABC2";
  let receiverMailboxPassword =
    process.env.MESH_RECEIVER_MAILBOX_PASSWORD || "password";

  return {
    logLevel,
    url,
    sharedKey,
    senderAgent,
    receiverAgent,
    senderMailboxID,
    senderMailboxPassword,
    receiverMailboxID,
    receiverMailboxPassword,
  };
}

export { default as handShake } from "./src/get/handshake.js";
export { default as getMessageCount } from "./src/get/message_count.js";
export { default as readMessage } from "./src/get/read_message.js";
export { default as markAsRead } from "./src/put/mark_as_read.js";
export { default as sendMessage } from "./src/post/send_message.js";
export { default as sendMessageChunks } from "./src/post/send_message_chunks.js";

export async function createMessages() {
  // Check connection to mailbox
  log.debug("\nChecking connection to mailbox with handshake");
  await handShake({
    url: url,
    mailboxID: senderMailboxID,
    mailboxPassword: senderMailboxPassword,
    sharedKey: sharedKey,
    agent: senderAgent,
  });

  log.debug("\nCreating new message");
  // Create new messages
  let newMessage = await sendMessage({
    url: url,
    mailboxID: senderMailboxID,
    mailboxPassword: senderMailboxPassword,
    message: messageContent,
    mailboxTarget: receiverMailboxID,
    sharedKey: sharedKey,
    agent: senderAgent,
  });
  log.debug("New message created with an ID: " + newMessage.data["message_id"]);
  log.debug("Message content is: " + messageContent);
}

export async function createMessageChunks() {
  // Check connection to mailbox
  log.debug("\nChecking connection to mailbox with handshake");
  await handShake({
    url: url,
    mailboxID: senderMailboxID,
    mailboxPassword: senderMailboxPassword,
    sharedKey: sharedKey,
    agent: senderAgent,
  });

  await sendMessageChunks({
    url: url,
    mailboxID: senderMailboxID,
    mailboxPassword: senderMailboxPassword,
    mailboxTarget: receiverMailboxID,
    messageFile: messageFile,
    sharedKey: sharedKey,
    agent: senderAgent,
  });
}

export async function receiveMessage() {
  // Check connection to mailbox
  log.debug("\nChecking connection to mailbox with handshake");
  await handShake({
    url: url,
    mailboxID: receiverMailboxID,
    mailboxPassword: receiverMailboxPassword,
    sharedKey: sharedKey,
    agent: receiverAgent,
  });

  // Get the number of messages in mailbox before we add any new ones.
  log.debug("\nchecking number of messages in mailbox");
  let inboxCount = await getMessageCount({
    url: url,
    mailboxID: receiverMailboxID,
    mailboxPassword: receiverMailboxPassword,
    sharedKey: sharedKey,
    agent: receiverAgent,
  });

  // Loop through the message and read them. so they don't interfere with tests
  if (inboxCount.data["approx_inbox_count"] > 0) {
    log.info(
      "There are " +
        inboxCount.data["approx_inbox_count"] +
        " Messages in the mailbox"
    );
    log.debug("\nLooping through messages to read their content\n");
    for (let message of inboxCount.data["messages"]) {
      let messageResponse = await readMessage({
        url: url,
        mailboxID: receiverMailboxID,
        mailboxPassword: receiverMailboxPassword,
        sharedKey: sharedKey,
        messageID: message,
        agent: receiverAgent,
      });
      try {
        if (messageResponse.data === "") {
          log.warn("WARNING: No data for message " + message);
        } else if (messageResponse.status === 200) {
          log.debug("Message ID is: " + message);
          log.debug(`Writing message to 'input/${message}.csv`);
          writeFile(
            `./input/${message}.csv`,
            JSON.stringify(messageResponse.data, null, 2),
            "utf8",
            (err) => {
              if (err) {
                log.error(
                  `ERROR: an error occurred while trying to write chunk data: ${err}`
                );
              }
            }
          );
        } else if (messageResponse.status === 206) {
          log.debug("Message ID is: " + message);
          log.debug(`Writing chunked message to 'input/${message}.csv`);
          writeFile(
            `./input/${message}.csv`,
            JSON.stringify(messageResponse.data, null, 2),
            "utf8",
            (err) => {
              if (err) {
                log.error(
                  `ERROR: an error occurred while trying to write chunk data: ${err}`
                );
              }
            }
          );
        }
      } catch {
        console.error("ERROR: Failure reading message" + message);
      }

      // mark the messages as read
      log.debug("clearing the message from the mailbox");
      await markAsRead({
        url: url,
        mailboxID: receiverMailboxID,
        mailboxPassword: receiverMailboxPassword,
        sharedKey: sharedKey,
        message: message,
        agent: receiverAgent,
      });
      try {
      } catch {
        console.error("ERROR: Failure marking message" + message + " as read");
      }
    }
  } else {
    log.info("There are no messages in the inbox");
  }
}
