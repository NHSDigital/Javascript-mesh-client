import log from "loglevel";
import https from "https";

/**
 * @namespace loadConfig
 */

/**
 * Loads and returns the configuration settings for the message exchange system.
 * Initializes logging level, sets up HTTPS agents based on the environment (sandbox or integration),
 * and prepares the necessary parameters for message exchange operations.
 *
 * @memberof loadConfig
 * @function loadConfig
 * @param {Object} config - Configuration options for setting up the environment.
 * @param {string} [config.logLevel="DEBUG"] - Specifies the logging level.
 * @param {string} [config.url="https://localhost:8700"] - The base URL for the message exchange service.
 * @param {string} [config.sharedKey="TestKey"] - The shared key used for authentication.
 * @param {string} [config.sandbox="true"] - Flag indicating whether to run in sandbox mode (ignores SSL errors).
 * @param {string} [config.senderCert] - The certificate for the sender, required for integration mode.
 * @param {string} [config.senderKey] - The private key for the sender, required for integration mode.
 * @param {string} [config.receiverCert] - The certificate for the receiver, required for integration mode.
 * @param {string} [config.receiverKey] - The private key for the receiver, required for integration mode.
 * @param {string} [config.senderMailboxID="X26ABC1"] - The mailbox ID of the sender.
 * @param {string} [config.senderMailboxPassword="password"] - The mailbox password of the sender.
 * @param {string} [config.receiverMailboxID="X26ABC2"] - The mailbox ID of the receiver.
 * @param {string} [config.receiverMailboxPassword="password"] - The mailbox password of the receiver.
 * @param {string} [config.messageContent="This is a test"] - Default message content for testing.
 * @param {string} [config.fileContent="node_modules/nhs-mesh-client/tests/testdata-organizations-100000.csv"] - Path to a file containing test data.
 * @returns {Promise<Object>} A promise that resolves to an object containing the loaded configuration settings.
 */
export async function loadConfig({
  logLevel = "DEBUG",
  url = "https://localhost:8700",
  sharedKey = "TestKey",
  sandbox = "true",
  senderCert,
  senderKey,
  receiverCert,
  receiverKey,
  senderMailboxID = "X26ABC1",
  senderMailboxPassword = "password",
  receiverMailboxID = "X26ABC2",
  receiverMailboxPassword = "password",
  messageContent = "This is a test",
  fileContent = "node_modules/nhs-mesh-client/tests/testdata-organizations-100000.csv",
}) {
  log.setLevel(log.levels[logLevel]);
  let senderAgent;
  let receiverAgent;

  if (sandbox === "true") {
    log.debug("Running in sandbox mode");
    // just setup to ignore self-signed certs
    senderAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    receiverAgent = new https.Agent({
      rejectUnauthorized: false,
    });
  } else {
    log.debug("Running in integration mode");
    // Setup the https agents for integration, you can ignore this for sandbox
    senderAgent = new https.Agent({
      cert: senderCert,
      key: senderKey,
      rejectUnauthorized: false,
    });
    receiverAgent = new https.Agent({
      cert: receiverCert,
      key: receiverKey,
      rejectUnauthorized: false,
    });
  }

  log.debug("Environment variables loaded");

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
    messageContent,
    fileContent,
  };
}

export default loadConfig;
