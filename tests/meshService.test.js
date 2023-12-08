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
  let messageContent = process.env.MESH_MESSAGE || "This is a test 2";
  let messageFile =
    process.env.MESH_DATA_FILE || "./tests/testdata-organizations-100000.csv";

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
  // console.log(sendInstance);

  // Configure receiver service
  const receiverInstance = new receiverService(
    loaderInstance.receiverConfig());
  // // console.log(receiverInstance);

  // Create mesh communication service
  const meshInstance = new meshService(
    loaderInstance,
    sendInstance,
    receiverInstance);
  // console.log(meshInstance);

  test('send a message', async () => {

    emptyDirs();

    // await meshInstance.sendMessage();
    // await meshInstance.receiveMessage(false);

    // // console.log(getFilenames("./input"));

    // fs.readFile("./input/*", 'utf8', function (err, data) {
    //   var dataArray = data.split(/\r?\n/);
    //   console.log(dataArray);
    // })

    expect(1 + 2).toBe(3);
  });

  // test('send a file', () => {
  //   expect(1 + 2).toBe(3);
  // });

  // test('receive a message', () => {
  //   expect(1 + 2).toBe(3);
  // });

  // test('receive a file', () => {
  //   expect(1 + 2).toBe(3);
  // });
});
