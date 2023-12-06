import dotenv from "dotenv";
import { waitThirtySeconds } from "./src/service/helper.js";
import payload from "./src/model/payload.js"
import loader from "./src/service/loader.js";
import senderService from "./src/service/senderService.js";
import receiverService from "./src/service/receiverService.js"
import meshService from "./src/service/meshService.js";


// Load variables
const loaderInstance = new loader(dotenv);

// Create payload
const data = new payload(
  'This message contains a file with female data.',
  process.env.MESH_DATA_FILE
)

// Get destination Id or provide one
const destination = loaderInstance.receiverMailboxID || "X26OT264";

// Configure sender service
const sendInstance = new senderService(loaderInstance.senderConfig());
sendInstance.setPayload(data);
sendInstance.setDestination(destination);
console.log(sendInstance);

// Configure receiver service
const receiverInstance = new receiverService();

// Create mesh communication service
const meshInstance = new meshService(loaderInstance, sendInstance, receiverInstance);

// Send a message/file
await meshInstance.sendMessage();
await meshInstance.sendFile();
await waitThirtySeconds();
// Received a message
await meshInstance.receiveMessage();
