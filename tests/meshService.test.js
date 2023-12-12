import fs from "fs";
import csvParser from "csv-parser";
import dotenv from "dotenv";
import payload from "../src/model/payload.js";
import loader from "../src/service/loader.js"
import senderService from "../src/service/senderService.js";
import receiverService from "../src/service/receiverService.js"
import meshService from "../src/service/meshService.js";
import { emptyDir } from "../src/service/helper.js";

// Empty input and output dirs
async function emptyDirs() {
  await emptyDir("./input")
  await emptyDir("./output")
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

  const messageFile =
    process.env.MESH_DATA_FILE || "./tests/testdata-organizations-100000.csv";

  // Create payload
  const data = new payload(
    "This is a JEST test.",
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

  test('send a message', async () => {
    emptyDirs(); // Empty input/output dirs

    // Create services
    await meshInstance.sendMessage();
    await meshInstance.receiveMessage(false); // no timeout

    // Check sent message content is received
    const filename = getFilenames("./input");
    const message = fs.readFileSync('./input/' + filename, 'utf-8');
    expect(JSON.parse(message).data).toBe(data.messageContent);
  });

  test('send a file', async () => {
    emptyDirs(); // Empty input/output dirs

    // Create services
    await meshInstance.sendFile();
    await meshInstance.receiveMessage();

    // Check sent file content is received
    const filenames = (getFilenames("./output")).toString().split(',');

    const expectedResultChunk1 = {
      Index: '1',
      'Organization Id': '8cC6B5992C0309c',
      Name: 'Acevedo LLC',
      Website: 'https://www.donovan.com/',
      Country: 'Holy See (Vatican City State)',
      Description: 'Multi-channeled bottom-line core',
      Founded: '2019',
      Industry: 'Graphic Design / Web Design',
      'Number of employees': '7070'
    };

    const expectedResultChunk2 = {
      '743': 'CafDEA20374C6aB',
      'stics / Procurement': '74823',
      _2: 'Leon-Marshall',
      _3: 'https://barajas.com/',
      _4: 'Croatia',
      _5: 'Virtual holistic methodology',
      _6: '1997',
      _7: 'Marketing / Advertising / Sales',
      _8: '5984'
    };

    const resultChunk1 = [];
    const resultChunk2 = [];

    fs.createReadStream("./output/" + filenames[0])
      .pipe(csvParser())
      .on("data", (data) => {
        resultChunk1.push(data);
      })
      .on("end", () => {
        expect(resultChunk1[0]).toStrictEqual(expectedResultChunk1);
      });

    fs.createReadStream("./output/" + filenames[2])
      .pipe(csvParser())
      .on("data", (data) => {
        resultChunk2.push(data);
      })
      .on("end", () => {
        expect(resultChunk2[0]).toStrictEqual(expectedResultChunk2);
      });

  }, 50000); // 50 second timeout for sending a file test
});
