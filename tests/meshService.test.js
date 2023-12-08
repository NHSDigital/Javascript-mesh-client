import dotenv from "dotenv";
import loader from "../src/service/loader.js"
import payload from "../src/model/payload.js";
import senderService from "../src/service/senderService.js";
import receiverService from "../src/service/receiverService.js"
import meshService from "../src/service/meshService.js";
import fs from "fs";
import path from "node:path";

// Empty input and output dirs
async function emptyDirs() {
  const inputDir = "./input";
  const outputDir = "./output";

  fs.readdir(inputDir, (err, files) => {
    if (err) throw err;
    for (const file of files) {
      fs.unlink(path.join(inputDir, file), (err) => {
        if (err) throw err;
      });
    }
  });

  fs.readdir(outputDir, (err, files) => {
    if (err) throw err;
    for (const file of files) {
      fs.unlink(path.join(outputDir, file), (err) => {
        if (err) throw err;
      });
    }
  });
}

// Function to get current filenames
function getFilenames(__dirname) {
  let files = [];
  fs.readdirSync(__dirname).forEach(file => {
    files.push(file);
  });
  return files;
}

describe('mesh service', () => {

  // Load variables
  const loaderInstance = new loader(dotenv);

  // Create message
  let messageContent = "This is a JEST test.";
  let messageFile = "./tests/testdata-organizations-100000.csv";

  // Create payload
  const data = new payload(
    messageContent,
    messageFile
  )

  // Get destination Id or provide one
  const destination = loaderInstance.receiverMailboxID || "X26OT264";

  // Configure sender service
  const sendInstance = new senderService(
    loaderInstance.senderConfig(),
    data,
    destination);

  // Configure receiver service
  const receiverInstance = new receiverService(
    loaderInstance.receiverConfig());

  // Create mesh communication service
  const meshInstance = new meshService(
    loaderInstance,
    sendInstance,
    receiverInstance);
  // console.log(meshInstance);

  test('send a message', async () => {

    emptyDirs(); // Empty input/output dirs

    // Initialise services
    await meshInstance.sendMessage();
    await meshInstance.receiveMessage(false);

    // Check sent message content is received
    const __dirname = getFilenames("./input");
    const message = fs.readFileSync('./input/' + __dirname, 'utf-8');
    expect(JSON.parse(message).data).toBe(data.messageContent);
  });

  // test('send a file', () => {
  //   expect(1 + 2).toBe(3);
  // });

});
