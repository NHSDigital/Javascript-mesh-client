import dotenv from "dotenv";
import payload from "./src/model/payload.js"
import loader from "./src/service/loader.js";
import senderService from "./src/service/senderService.js";
import receiverService from "./src/service/receiverService.js"
import meshService from "./src/service/meshService.js";

// Load variables
const loaderInstance = new loader(dotenv);

// Create message
const messageContent = process.env.MESH_MESSAGE || "This is a test 243434";
const messageFile =
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

// // Configure receiver service
const receiverInstance = new receiverService(
  loaderInstance.receiverConfig());

// // Create mesh communication service
const meshInstance = new meshService(
  loaderInstance,
  sendInstance,
  receiverInstance);

// Send a message/file
await meshInstance.sendMessage();
await meshInstance.sendFile();
// Received a message
// If timeout set as environmental variable then wait that many seconds
await meshInstance.receiveMessage();
