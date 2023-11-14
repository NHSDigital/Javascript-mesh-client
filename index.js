import log from "loglevel";
import { Agent } from "https";
import { readFileSync } from "fs";
import handShake from "./src/get/handshake.js";
import getMessageCount from "./src/get/message_count.js";
import readMessage from "./src/get/read_message.js";
import markAsRead from "./src/put/mark_as_read.js";
import sendMessage from "./src/post/send_message.js";
import sendMessageChunks from "./src/post/send_message_chunks.js";

// defaults to the local url for the sandbox environment
const url = process.env.MESH_URL || "https://localhost:8700";

// This is the shared key for all mailboxes within an account
const sharedKey = process.env.MESH_sharedKey;

// This should be disabled for sandbox use, but enabled for integration and prod
const tlsEnabled = process.env.MESH_TLS_ENABLED;

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

const logLevel = process.env.LOG_LEVEL || "SILENT";
log.setLevel(log.levels[logLevel]);

// The 'sender' is the mailbox we will be sending the message from
const senderMailboxID = process.env.MESH_SENDER_MAILBOX_ID;
const senderMailboxPassword = process.env.MESH_SENDER_MAILBOX_PASSWORD;

const messageContent = process.env.MESH_MESSAGE || "This is a test";

// The 'receiver' is the mailbox we will be checking for new message
const receiverMailboxID = process.env.MESH_RECEIVER_MAILBOX_ID;
const receiverMailboxPassword = process.env.MESH_RECEIVER_MAILBOX_PASSWORD;

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
  await handShake(
    url,
    senderMailboxID,
    senderMailboxPassword,
    sharedKey,
    tlsEnabled,
    senderAgent
  );

  log.debug("\nCreating new message");
  // Create new messages
  const newMessage = await sendMessage(
    url,
    senderMailboxID,
    senderMailboxPassword,
    messageContent,
    receiverMailboxID,
    tlsEnabled,
    senderAgent
  );
  log.debug("New message created with an ID: " + newMessage.data["message_id"]);
  log.debug("Message content is: " + messageContent);
}

async function createMessageChunks() {
  // Check connection to mailbox
  log.debug("\nChecking connection to mailbox with handshake");
  await handShake(
    url,
    senderMailboxID,
    senderMailboxPassword,
    sharedKey,
    tlsEnabled,
    senderAgent
  );

  // log.debug("\nCreating new message chunks");
  // // Create new messages
  // const newMessage = await sendMessageChunks({
  //   url: url,
  //   mailboxID: senderMailboxID,
  //   mailboxPassword: senderMailboxPassword,
  //   mailboxTarget: receiverMailboxID,
  //   tlsEnabled: tlsEnabled,
  //   agent: senderAgent,
  // });
  // log.debug("New message created with an ID: " + newMessage.data["message_id"]);
  // log.debug("Message content is: " + messageContent);
}

async function receiveMessage() {
  // Check connection to mailbox
  log.debug("\nChecking connection to mailbox with handshake");
  await handShake(
    url,
    receiverMailboxID,
    receiverMailboxPassword,
    sharedKey,
    tlsEnabled,
    receiverAgent
  );

  // Get the number of messages in mailbox before we add any new ones.
  log.debug("\nchecking number of messages in mailbox");
  const inboxCount = await getMessageCount(
    url,
    receiverMailboxID,
    receiverMailboxPassword,
    sharedKey,
    tlsEnabled,
    receiverAgent
  );

  // Loop through the message and read them. so they don't interfere with tests
  if (inboxCount.data["approx_inboxCount"] > 0) {
    log.info(
      "There are " +
        inboxCount.data["approx_inboxCount"] +
        " Messages in the mailbox"
    );
    log.debug("\nLooping through messages to read their content");
    for (const message of inboxCount.data["messages"]) {
      const messageResponse = await readMessage(
        url,
        receiverMailboxID,
        receiverMailboxPassword,
        sharedKey,
        message,
        tlsEnabled,
        receiverAgent
      );
      try {
        if (messageResponse.data === "") {
          log.warn("WARNING: No data for message " + message);
        } else {
          console.debug("Message ID is: " + message);
          console.debug("Message content is: " + messageResponse.data["data"]);
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

// await createMessages();
// log.debug("\nwaiting 30 seconds for mesh to process the message");
// await waitThirtySeconds();
// log.debug("\nchecking if the message has arrived");
// await receiveMessage();
await sendMessageChunks({
  url: url,
  mailboxID: senderMailboxID,
  mailboxPassword: senderMailboxPassword,
  mailboxTarget: receiverMailboxID,
  tlsEnabled: tlsEnabled,
  agent: senderAgent,
});
