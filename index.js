import log from "loglevel";
import { Agent } from "https";
import { readFileSync, writeFile } from "fs";
import handShake from "./src/get/handshake.js";
import getMessageCount from "./src/get/message_count.js";
import readMessage from "./src/get/read_message.js";
import markAsRead from "./src/put/mark_as_read.js";
import sendMessage from "./src/post/send_message.js";
import sendMessageChunks from "./src/post/send_message_chunks.js";

// defaults to the local url for the sandbox environment
let url = process.env.MESH_URL || "https://localhost:8700";

// This is the shared key for all mailboxes within an account
let sharedKey = process.env.MESH_SHARED_KEY;

// This should be disabled for sandbox use, but enabled for integration and prod
let tlsEnabled = process.env.MESH_TLS_ENABLED;

// Setup the https agents for tls, you can ignore this for sandbox
let senderAgent = new Agent({
  cert: readFileSync(process.env.MESH_SENDER_CERT_LOCATION),
  key: readFileSync(process.env.MESH_SENDER_KEY_LOCATION),
  rejectUnauthorized: false,
});

let receiverAgent = new Agent({
  cert: readFileSync(process.env.MESH_RECEIVER_CERT_LOCATION),
  key: readFileSync(process.env.MESH_RECEIVER_KEY_LOCATION),
  rejectUnauthorized: false,
});

let logLevel = process.env.LOG_LEVEL || "SILENT";
log.setLevel(log.levels[logLevel]);

// The 'sender' is the mailbox we will be sending the message from
let senderMailboxID = process.env.MESH_SENDER_MAILBOX_ID;
let senderMailboxPassword = process.env.MESH_SENDER_MAILBOX_PASSWORD;

let messageContent = process.env.MESH_MESSAGE || "This is a test";
let messageFile =
  process.env.MESH_DATA_FILE || "./tests/testdata-organizations-100000.csv";
// The 'receiver' is the mailbox we will be checking for new message
let receiverMailboxID = process.env.MESH_RECEIVER_MAILBOX_ID;
let receiverMailboxPassword = process.env.MESH_RECEIVER_MAILBOX_PASSWORD;

// A 30 second wait timer to allow the messages to be received and processed by mesh
async function waitThirtySeconds() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("30 seconds have passed.");
    }, 30000); // 30000 milliseconds = 30 seconds
  });
}

async function createMessages() {
  // Check connection to mailbox
  log.debug("\nChecking connection to mailbox with handshake");
  await handShake({
    url: url,
    mailboxID: senderMailboxID,
    mailboxPassword: senderMailboxPassword,
    sharedKey: sharedKey,
    tlsEnabled: tlsEnabled,
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
    tlsEnabled: tlsEnabled,
    agent: senderAgent,
  });
  log.debug("New message created with an ID: " + newMessage.data["message_id"]);
  log.debug("Message content is: " + messageContent);
}

async function createMessageChunks() {
  // Check connection to mailbox
  log.debug("\nChecking connection to mailbox with handshake");
  await handShake({
    url: url,
    mailboxID: senderMailboxID,
    mailboxPassword: senderMailboxPassword,
    sharedKey: sharedKey,
    tlsEnabled: tlsEnabled,
    agent: senderAgent,
  });

  await sendMessageChunks({
    url: url,
    mailboxID: senderMailboxID,
    mailboxPassword: senderMailboxPassword,
    mailboxTarget: receiverMailboxID,
    messageFile: messageFile,
    tlsEnabled: tlsEnabled,
    agent: senderAgent,
  });
}

async function receiveMessage() {
  // Check connection to mailbox
  log.debug("\nChecking connection to mailbox with handshake");
  await handShake({
    url: url,
    mailboxID: receiverMailboxID,
    mailboxPassword: receiverMailboxPassword,
    sharedKey: sharedKey,
    tlsEnabled: tlsEnabled,
    agent: receiverAgent,
  });

  // Get the number of messages in mailbox before we add any new ones.
  log.debug("\nchecking number of messages in mailbox");
  let inboxCount = await getMessageCount({
    url: url,
    mailboxID: receiverMailboxID,
    mailboxPassword: receiverMailboxPassword,
    sharedKey: sharedKey,
    tlsEnabled: tlsEnabled,
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
        tlsEnabled: tlsEnabled,
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
      await markAsRead(
        url,
        receiverMailboxID,
        receiverMailboxPassword,
        sharedKey,
        message,
        tlsEnabled,
        receiverAgent
      );
      try {
      } catch {
        console.error("ERROR: Failure marking message" + message + " as read");
      }
    }
  } else {
    log.info("There are no messages in the inbox");
  }
}

await createMessages();
await createMessageChunks();
log.debug("\nwaiting 30 seconds for mesh to process the message");
await waitThirtySeconds();
log.debug("\nchecking if the message has arrived");
await receiveMessage();
// await sendMessageChunks({
//   url: url,
//   mailboxID: senderMailboxID,
//   mailboxPassword: senderMailboxPassword,
//   mailboxTarget: receiverMailboxID,
//   messageFile: messageFile,
//   tlsEnabled: tlsEnabled,
//   agent: senderAgent,
// });
