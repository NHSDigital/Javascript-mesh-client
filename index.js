import log from "loglevel";
import { Agent } from "https";
import { readFileSync } from "fs";
import handShake from "./src/get/handshake.js";
import getMessageCount from "./src/get/message_count.js";
import readMessage from "./src/get/read_message.js";
import markAsRead from "./src/put/mark_as_read.js";
import sendMessage from "./src/post/send_message.js";
// import generateHeaders from "./src/get/generate_headers.js";

// defaults to the local url for the sandbox environment
const url = process.env.MESH_URL || "https://localhost:8700";

// This is the shared key for all mailboxes within an account
const shared_key = process.env.MESH_SHARED_KEY;

// This should be disabled for sandbox use, but enabled for integration and prod
const tls_enabled = process.env.MESH_TLS_ENABLED;

// Setup the https agents for tls, you can ignore this for sandbox
let sender_agent = new Agent({
  cert: readFileSync(process.env.MESH_SENDER_CERT_LOCATION),
  key: readFileSync(process.env.MESH_SENDER_KEY_LOCATION),
  rejectUnauthorized: false,
});

let receiver_agent = new Agent({
  cert: readFileSync(process.env.MESH_RECEIVER_CERT_LOCATION),
  key: readFileSync(process.env.MESH_RECEIVER_KEY_LOCATION),
  rejectUnauthorized: false,
});

// Set the location of the crt and key files
const sender_cert_location = process.env.MESH_SENDER_CERT_LOCATION;
const sender_key_location = process.env.MESH_SENDER_KEY_LOCATION;
const receiver_cert_location = process.env.MESH_RECEIVER_CERT_LOCATION;
const receiver_key_location = process.env.MESH_RECEIVER_KEY_LOCATION;
const ca_location = process.env.MESH_SENDER_CA_LOCATION;

const logLevel = process.env.LOG_LEVEL || "SILENT";
log.setLevel(log.levels[logLevel]);

// The 'sender' is the mailbox we will be sending the message from
const sender_mailbox_id = process.env.MESH_SENDER_MAILBOX_ID;
const sender_mailbox_password = process.env.MESH_SENDER_MAILBOX_PASSWORD;

const message_content = process.env.MESH_MESSAGE || "This is a test";

// The 'receiver' is the mailbox we will be checking for new message
const receiver_mailbox_id = process.env.MESH_RECEIVER_MAILBOX_ID;
const receiver_mailbox_password = process.env.MESH_RECEIVER_MAILBOX_PASSWORD;

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
    sender_mailbox_id,
    sender_mailbox_password,
    shared_key,
    tls_enabled,
    sender_agent
  );

  log.debug("\nCreating new message");
  // Create new messages
  const new_message = await sendMessage(
    url,
    sender_mailbox_id,
    sender_mailbox_password,
    message_content,
    receiver_mailbox_id,
    tls_enabled,
    sender_agent
  );
  log.debug(
    "New message created with an ID: " + new_message.data["message_id"]
  );
  log.debug("Message content is: " + message_content);
}

async function receiveMessage() {
  // Check connection to mailbox
  log.debug("\nChecking connection to mailbox with handshake");
  const handshake_response = await handShake(
    url,
    receiver_mailbox_id,
    receiver_mailbox_password,
    shared_key,
    tls_enabled,
    receiver_agent
  );

  // Get the number of messages in mailbox before we add any new ones.
  log.debug("\nchecking number of messages in mailbox");
  const inbox_count = await getMessageCount(
    url,
    receiver_mailbox_id,
    receiver_mailbox_password,
    shared_key,
    tls_enabled,
    receiver_agent
  );

  // Loop through the message and read them. so they don't interfere with tests
  if (inbox_count.data["approx_inbox_count"] > 0) {
    log.info(
      "There are " +
        inbox_count.data["approx_inbox_count"] +
        " Messages in the mailbox"
    );
    log.debug("\nLooping through messages to read their content");
    for (const message of inbox_count.data["messages"]) {
      const message_response = await readMessage(
        url,
        receiver_mailbox_id,
        receiver_mailbox_password,
        shared_key,
        message,
        tls_enabled,
        receiver_agent
      );
      try {
        if (message_response.data === "") {
          log.warn("WARNING: No data for message " + message);
        } else {
          console.debug("Message ID is: " + message);
          console.debug("Message content is: " + message_response.data["data"]);
        }
      } catch {
        console.error("ERROR: Failure reading message" + message);
      }

      // mark the messages as read
      log.debug("clearing the message from the mailbox");
      await markAsRead(
        url,
        receiver_mailbox_id,
        receiver_mailbox_password,
        shared_key,
        message,
        tls_enabled,
        receiver_agent
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
log.debug("\nwaiting 30 seconds for mesh to process the message");
await waitThirtySeconds();
log.debug("\nchecking if the message has arrived");
await receiveMessage();
