import log from "loglevel";
import { default as handShake } from "../get/handshake.js";
import { default as sendChunkedMessage } from "../post/send_chunked_message.js";
import https from "https";

/**
 * @namespace createMessageChunks
 */

/**
 * Creates and sends a chunked message from a file using the provided configuration settings.
 * Similar to createMessages, it checks the mailbox connection before proceeding with the message sending.
 *
 * @memberof createMessageChunks
 * @function createMessageChunks
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

export async function createMessageChunks(config) {
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
    mailboxID: senderMailboxID,
    mailboxPassword: senderMailboxPassword,
    sharedKey: sharedKey,
    agent: senderAgent,
  });

  await sendChunkedMessage({
    url: url,
    mailboxID: senderMailboxID,
    mailboxPassword: senderMailboxPassword,
    mailboxTarget: receiverMailboxID,
    sharedKey: sharedKey,
    agent: senderAgent,
    fileContent: fileContent,
  });
}

export default createMessageChunks;
