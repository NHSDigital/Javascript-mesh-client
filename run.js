import Payload from "./src/model/Payload.js";
import Loader from "./src/service/loader.js";
import SenderService from "./src/service/SenderService.js";
import ReceiverService from "./src/service/receiverService.js";
import MeshService from "./src/service/MeshService.js";

// Load variables
const loaderInstance = new Loader();

// Create message
const messageContent = process.env.MESH_MESSAGE || "This is a test 243434";
const messageFile =
  process.env.MESH_DATA_FILE || "./tests/testdata-organizations-100000.csv";

// Create payload
const data = new Payload(
  messageContent,
  messageFile
)

// Get destination Id or provide one
const destination = loaderInstance.receiverMailboxID || "X26OT264";

// Configure sender service
const sendInstance = new SenderService(
  loaderInstance.senderConfig(),
  data,
  destination);

// // Configure receiver service
const receiverInstance = new ReceiverService(
  loaderInstance.receiverConfig());

// // Create mesh communication service
const meshInstance = new MeshService(
  loaderInstance,
  sendInstance,
  receiverInstance);

// Send a message/file
await meshInstance.sendMessage();
await meshInstance.sendFile();
// Received a message
// If timeout set as environmental variable then wait that many seconds
// Provide false to disable timeout
await meshInstance.receiveMessage();
