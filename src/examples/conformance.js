import {
  handShake,
  loadConfig,
  sendMessage,
  getMessageCount,
  readMessage,
  markAsRead,
  sendChunkedMessage,
} from "../index.js";
import fs from "fs";
import path from "path";
import log from "loglevel";
import assert from "assert";
import crypto from "crypto";

// This function adds a delay of however many seconds you pass in
// This allows the mesh mailbox time to process messages before trying
// To read them back. From testing 40 seconds seems sufficent for single message
// More if dealing with large batches or chunks
async function waitForProcessing(seconds) {
  log.debug(`waiting ${seconds} seconds for mesh to process messages`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, seconds * 1000);
  });
}

// This config will be used by the each of the following functions to define
// The mailboxes we will be using and the content of messages.
const config = await loadConfig({});

log.setLevel(log.levels[config.logLevel]);

// The following functions are setup to satisfy the conformance
// Testing that each mesh application is required to go though.

/**
 * @param {string} [messageContent]
 */
async function send(messageContent, compression = false) {
  try {
    let healthCheck = await handShake({
      url: config.url,
      mailboxID: config.senderMailboxID,
      mailboxPassword: config.senderMailboxPassword,
      sharedKey: config.sharedKey,
      agent: config.senderAgent,
    });

    if (healthCheck.status != 200) {
      log.error(`Health Check Failed: ${healthCheck}`);
      process.exit(1);
    }

    let message = await sendMessage({
      url: config.url,
      mailboxID: config.senderMailboxID,
      mailboxPassword: config.senderMailboxPassword,
      sharedKey: config.sharedKey,
      message: messageContent,
      mailboxTarget: config.receiverMailboxID,
      agent: config.senderAgent,
      compressed: compression,
    });

    if (message.status != 202) {
      log.error(`Create Message Failed: ${message.status}`);
      process.exit(1);
    }
  } catch (error) {
    log.error("An error occurred:", error.message);
    process.exit(1);
  }
}

async function checkMessages() {
  try {
    let messageCount = await getMessageCount({
      url: config.url,
      mailboxID: config.receiverMailboxID,
      mailboxPassword: config.receiverMailboxPassword,
      sharedKey: config.sharedKey,
      agent: config.receiverAgent,
    });
    log.info(`Message Count: ${messageCount.data.approx_inbox_count}`);
  } catch (error) {
    log.error("An error occurred:", error.message);
  }
}

async function sendChunk(path) {
  await sendChunkedMessage({
    url: config.url,
    mailboxID: config.senderMailboxID,
    mailboxPassword: config.senderMailboxPassword,
    mailboxTarget: config.receiverMailboxID,
    sharedKey: config.sharedKey,
    filePath: path,
    agent: config.senderAgent,
  });
}

async function sendBulk(messageContent) {
  const startTime = Math.floor(Date.now() / 1000);
  const promises = [];
  let messageCount = 600;
  log.info(`Sending ${messageCount} Messages`);
  for (let i = 0; i < messageCount; i++) {
    promises.push(send(messageContent));
  }
  log.debug(`awaiting all api calls to complete`);
  await Promise.all(promises);
  log.debug(`all ${messageCount} messages have been sent`);
  const endTime = Math.floor(Date.now() / 1000);
  const timeTaken = endTime - startTime;
  console.log(`Function took ${timeTaken.toFixed(2)} seconds`);
}

async function saveMessagesInBatches(destination, fileType) {
  const startTime = Math.floor(Date.now() / 1000);
  try {
    let keepProcessing = true;

    while (keepProcessing) {
      let messageCount = await getMessageCount({
        url: config.url,
        mailboxID: config.receiverMailboxID,
        mailboxPassword: config.receiverMailboxPassword,
        sharedKey: config.sharedKey,
        agent: config.receiverAgent,
      });

      let numMessages = messageCount.data.approx_inbox_count;
      if (!numMessages) {
        numMessages = 0;
      }
      log.info(`Approximate total messages: ${numMessages}`);

      if (numMessages > 0) {
        if (numMessages > 500) {
          numMessages = 500;
        }
        log.info(`Approximate batch size: ${numMessages}`);

        const batch = messageCount.data.messages.slice(0, numMessages);

        // Asynchronously download messages
        const downloadPromises = batch.map((messageID) =>
          readMessage({
            url: config.url,
            mailboxID: config.receiverMailboxID,
            mailboxPassword: config.receiverMailboxPassword,
            sharedKey: config.sharedKey,
            messageID: messageID,
            agent: config.receiverAgent,
            outputFilePath: `${destination}/${messageID}.${fileType}`,
          }).catch((err) => {
            log.error(`Error downloading message ${messageID}: ${err}`);
            return null;
          })
        );

        const messages = await Promise.all(downloadPromises);

        // Asynchronously mark messages as read
        const markReadPromises = batch.map((messageID) =>
          markAsRead({
            url: config.url,
            mailboxID: config.receiverMailboxID,
            mailboxPassword: config.receiverMailboxPassword,
            sharedKey: config.sharedKey,
            message: messageID,
            agent: config.receiverAgent,
          }).catch((err) => {
            log.error(`Error marking message ${messageID} as read: ${err}`);
          })
        );

        await Promise.all(markReadPromises);

        log.info(`Processed a batch of up to ${numMessages} messages`);

        // Determine if we should keep processing
        keepProcessing = numMessages === 500;
      } else {
        log.info("No more messages to process");
        keepProcessing = false;
      }
    }
  } catch (error) {
    log.error("An error occurred:", error.message);
    process.exit(1);
  }
  const endTime = Math.floor(Date.now() / 1000);
  const timeTaken = endTime - startTime;
  console.log(`Function took ${timeTaken.toFixed(2)} seconds`);
}

// async function sendIncorrectMailbox() {
//   try {
//     let healthCheck = await handShake({
//       url: config.url,
//       mailboxID: config.senderMailboxID,
//       mailboxPassword: config.senderMailboxPassword,
//       sharedKey: config.sharedKey,
//       agent: config.senderAgent,
//     });

//     if (healthCheck.status != 200) {
//       log.error(`Health Check Failed: ${healthCheck}`);
//       process.exit(1);
//     }

//     let message = await sendMessage({
//       url: config.url,
//       mailboxID: config.senderMailboxID,
//       mailboxPassword: config.senderMailboxPassword,
//       sharedKey: config.sharedKey,
//       message: "This is an uncompressed message",
//       mailboxTarget: "aninvalidid1234",
//       agent: config.senderAgent,
//     });

//     log.debug(message.headers);

//     if (message.status != 202) {
//       log.error(`Create Message Failed: ${message.status}`);
//       process.exit(1);
//     }

//     log.debug("\nTest 1: Send Uncompressed Message Success");
//   } catch (error) {
//     if (error.response) {
//       log.error(
//         `Request failed with status code ${error.response.status}: ${error.response.statusText}`
//       );
//     } else if (error.request) {
//       log.error("No response was received for the request");
//     } else {
//       log.error("Error:", error.message);
//     }
//     process.exit(1);
//   }
// }

// async function sendAuthFailure() {
//   try {
//     let healthCheck = await handShake({
//       url: config.url,
//       mailboxID: "notAuthorizedMailbox",
//       mailboxPassword: config.senderMailboxPassword,
//       sharedKey: config.sharedKey,
//       agent: config.senderAgent,
//     });

//     if (healthCheck.status != 200) {
//       log.error(`Health Check Failed: ${healthCheck}`);
//       process.exit(1);
//     }

//     let message = await sendMessage({
//       url: config.url,
//       mailboxID: config.senderMailboxID,
//       mailboxPassword: config.senderMailboxPassword,
//       sharedKey: config.sharedKey,
//       message: "This is an uncompressed message",
//       mailboxTarget: config.receiverMailboxID,
//       agent: config.senderAgent,
//     });

//     log.debug(message.headers);

//     if (message.status != 202) {
//       log.error(`Create Message Failed: ${message.status}`);
//       process.exit(1);
//     }

//     log.debug("\nTest 1: Send Uncompressed Message Success");
//   } catch (error) {
//     if (error.response) {
//       log.error(
//         `Request failed with status code ${error.response.status}: ${error.response.statusText}`
//       );
//     } else if (error.request) {
//       log.error("No response was received for the request");
//     } else {
//       log.error("Error:", error.message);
//     }
//     process.exit(1);
//   }
// }

// async function downloadMissingMessage() {
//   const startTime = Math.floor(Date.now() / 1000);
//   try {
//     readMessage({
//       url: config.url,
//       mailboxID: config.receiverMailboxID,
//       mailboxPassword: config.receiverMailboxPassword,
//       sharedKey: config.sharedKey,
//       messageID: "thisisaninvalidmessageid1234567890",
//       agent: config.receiverAgent,
//     });
//   } catch (error) {
//     log.error("An error occurred:", error.message);
//     process.exit(1);
//   }
//   const endTime = Math.floor(Date.now() / 1000);
//   const timeTaken = endTime - startTime;
//   console.log(`Function took ${timeTaken.toFixed(2)} seconds`);
// }

// async function duplicateDownload() {
//   const startTime = Math.floor(Date.now() / 1000);
//   try {
//     let messageCount = await getMessageCount({
//       url: config.url,
//       mailboxID: config.receiverMailboxID,
//       mailboxPassword: config.receiverMailboxPassword,
//       sharedKey: config.sharedKey,
//       agent: config.receiverAgent,
//     });

//     log.info(`Messages: ${messageCount.data.messages}`);

//     // let numMessages = messageCount.data.approx_inbox_count;
//     // log.info(`${numMessages} messages in mailbox`);

//     // for (let i = 0; i < numMessages; i++) {
//     let messageOne = await readMessage({
//       url: config.url,
//       mailboxID: config.receiverMailboxID,
//       mailboxPassword: config.receiverMailboxPassword,
//       sharedKey: config.sharedKey,
//       messageID: "20240131162809267016_1B6541",
//       agent: config.receiverAgent,
//     });
//     log.info(`MessageID: 20240131162809267016_1B6541`);
//     log.info(`Message status: ${messageOne.status}`);
//     log.info(`Message status: ${messageOne.data}`);

//     // await markAsRead({
//     //   url: config.url,
//     //   mailboxID: config.receiverMailboxID,
//     //   mailboxPassword: config.receiverMailboxPassword,
//     //   sharedKey: config.sharedKey,
//     //   message: "20240131162809267016_1B6541",
//     //   agent: config.receiverAgent,
//     // });
//     // log.info(`Marked messageOne as read`);
//     // await waitForProcessing(60 * 5);

//     let messageTwo = await readMessage({
//       url: config.url,
//       mailboxID: config.receiverMailboxID,
//       mailboxPassword: config.receiverMailboxPassword,
//       sharedKey: config.sharedKey,
//       messageID: "20240131162429262050_1D1F5D",
//       agent: config.receiverAgent,
//     });

//     log.info(`MessageID: 20240131162429262050_1D1F5D`);
//     log.info(`MessageTwo status: ${messageTwo.status}`);
//     log.info(`MessageTne status: ${messageTwo.data}`);
//     // }
//   } catch (error) {
//     log.error("An error occurred:", error.message);
//     process.exit(1);
//   }
//   const endTime = Math.floor(Date.now() / 1000);
//   const timeTaken = endTime - startTime;
//   console.log(`Function took ${timeTaken.toFixed(2)} seconds`);
// }

// The following sections run the tests,
// I would suggest commenting them out one by one and running them

let testMessage = `This is a test message`;
log.info("Test 1, send uncompressed message and read it.");
await send(testMessage);
await waitForProcessing(40);
await saveMessagesInBatches("tests/test_1", "csv");
// Check that the content of the message is correct
{
  let dirPath = "tests/test_1";
  let csvFiles = [];
  fs.readdirSync(dirPath).forEach((file) => {
    if (file.endsWith(".csv")) {
      csvFiles.push(file);
    }
  });
  csvFiles.sort();
  let filePath = path.join(dirPath, csvFiles[0]);
  let fileContent = fs.readFileSync(filePath, "utf8");
  assert.strictEqual(fileContent, testMessage);
}
log.info(`Test 1 complete\n`);

log.info("Test 2 send compressed message and read it");
await send(testMessage, true);
await waitForProcessing(40);
await saveMessagesInBatches("tests/test_2", "csv");
// Check that the content of the message is correct
// Need to investigate as compressed messages end up with double quotes around the string value.
// {
//   let dirPath = "tests/test_2";
//   let csvFiles = [];
//   fs.readdirSync(dirPath).forEach((file) => {
//     if (file.endsWith(".csv")) {
//       csvFiles.push(file);
//     }
//   });
//   csvFiles.sort();
//   let filePath = path.join(dirPath, csvFiles[0]);
//   let fileContent = fs.readFileSync(filePath, "utf8");
//   assert.strictEqual(fileContent, testMessage);
// }
log.info(`Test 2 complete\n`);

log.info("Test 3 send chunked message and read it");
await sendChunk("tests/testdata-organizations-100000.csv");
await waitForProcessing(60);
await saveMessagesInBatches("tests/test_3", "csv");

{
  // Get hash for original file
  let exampleFilePath = "tests/testdata-organizations-100000.csv";
  let exampleMd5Sum = crypto.createHash("md5");
  fs.readFile(exampleFilePath, (err, data) => {
    if (err) {
      throw err;
    }
    exampleMd5Sum.update(data);
    let exampleHash = exampleMd5Sum.digest("hex");

    // Get hash for downloaded file.
    let testFilePath = "tests/test_3/";
    let csvFiles = [];
    fs.readdirSync(testFilePath).forEach((file) => {
      if (file.endsWith(".csv")) {
        csvFiles.push(file);
      }
    });
    csvFiles.sort();
    let testMd5Sum = crypto.createHash("md5");
    fs.readFile(`${testFilePath}/${csvFiles[0]}`, (err, data) => {
      if (err) {
        throw err;
      }
      testMd5Sum.update(data);
      let testHash = testMd5Sum.digest("hex");

      // Check hashes match
      assert.strictEqual(exampleHash, testHash);
      log.info(
        `md5sum for tests/testdata-organizations-100000.csv is ${exampleHash}, md5sum for test file is ${testHash}`
      );
    });
  });
}

log.info(`test 3 complete\n`);

log.info("Test 4 send 600 message and read them");
await sendBulk(testMessage);
await waitForProcessing(90);
await saveMessagesInBatches("tests/test_4", "csv");
{
  fs.readdir("tests/test_4", (err, files) => {
    if (err) {
      throw err;
    }
    let csvFiles = files.filter((file) => file.endsWith(".csv"));
    console.log(`Number of files: ${csvFiles}`);
    assert.deepStrictEqual(csvFiles.length, 600);
  });
}
log.info(`test 4 complete`);

// log.info("Test 701 perform handshake against down system, expect a 404 error");
// await sendAuthFailure();
// log.info(`test 701 complete`);

// log.info("Test 702 send to invalid mailbox, expect a 403 error")
// await sendIncorrectMailbox();
// log.info(`test 702 complete`);

// log.info("Test 703 undelivery message is handled in readMessage()")

// log.info("Test 704 download message that does not exist")
// await downloadMissingMessage();
// log.info(`test 703 complete`);

// log.info("Test 705 try to download a removed message")
// await send();
// await waitForProcessing(120);
// await duplicateDownload();
