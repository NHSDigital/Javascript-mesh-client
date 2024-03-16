import log from "loglevel";
import { default as handShake } from "../get/handshake.js";
import https from "https";
import { writeFile } from "fs";
import getMessageCount from "../get/message_count.js";
import readMessage from "../get/read_message.js";
import markAsRead from "../put/mark_as_read.js";

/**
 * @namespace receiveMessage
 * @memberof receiveMessage
 */

/**
 * Receives messages for a configured mailbox, acknowledging each message to clear it from the mailbox.
 * It checks for new messages, reads them, and marks them as read.
 *
 * @memberof receiveMessage
 * @function receiveMessage
 * @param {Object} config The configuration settings used for message exchange.
 * @param {string} [config.logLevel="DEBUG"] - Logging level. Determines the verbosity of logs produced by the application.
 * @param {string} [config.url="https://localhost:8700"] - The URL of the message exchange service. This is the endpoint where messages will be sent and received.
 * @param {string} [config.sharedKey="TestKey"] - A shared key used for authentication purposes with the message exchange service.
 * @param {string} [config.sandbox="true"] - Indicates if the application should run in sandbox mode. When in sandbox mode, SSL certificate validation is ignored, useful for development/testing environments.
 * @param {string} [config.senderCert] - The path to the sender's SSL certificate. Required for secure communication in non-sandbox (production) environments.
 * @param {string} [config.senderKey] - The path to the sender's private key associated with the SSL certificate.
 * @param {string} [config.receiverCert] - The path to the receiver's SSL certificate. Similar to senderCert, required for secure communication in non-sandbox environments.
 * @param {string} [config.receiverKey] - The path to the receiver's private key for SSL communication.
 * @param {string} [config.senderMailboxID="X26ABC1"] - The ID of the sender's mailbox. This ID is used to authenticate and route messages correctly.
 * @param {string} [config.senderMailboxPassword="password"] - The password for the sender's mailbox. Used in conjunction with the mailbox ID for authentication.
 * @param {string} [config.receiverMailboxID="X26ABC2"] - The ID of the receiver's mailbox. Specifies where the message will be sent.
 * @param {string} [config.receiverMailboxPassword="password"] - The password for the receiver's mailbox.
 * @param {string} [config.messageContent="This is a test"] - (For sendMessage and createMessages) The content of the message to be sent.
 * @param {Buffer} [config.fileContent="path/to/file.csv"] - (For sendChunkedMessage) The path to the file content to be sent in chunked messages.
 * @param {https.Agent} [config.senderAgent] - The HTTPS agent for the sender. Configured based on sandbox mode and SSL certificates.
 * @param {https.Agent} [config.receiverAgent] - The HTTPS agent for the receiver. Similar to senderAgent, configured based on environment and SSL certificates.
 * @returns {Promise<void>} - A promise that resolves when the message is successfully created and sent.
 */
export async function receiveMessage(config) {
  // Load config from loadConfig function
  const logLevel = config.logLevel;
  const url = config.url;
  const sharedKey = config.sharedKey;
  const senderAgent = config.senderAgent;
  const receiverAgent = config.receiverAgent;
  const senderMailboxID = config.senderMailboxID;
  const senderMailboxPassword = config.senderMailboxPassword;
  const receiverMailboxID = config.receiverMailboxID;
  const receiverMailboxPassword = config.receiverMailboxPassword;
  const messageContent = config.messageContent;
  const fileContent = config.fileContent;

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
export default receiveMessage;
