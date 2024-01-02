// import fs from "fs";
// import csvParser from "csv-parser";
// import Payload from "../src/model/Payload.js";
// import Loader from "../src/service/Loader.js";
// import SenderService from "../src/service/SenderService.js";
// import ReceiverService from "../src/service/ReceiverService.js";
// import MeshService from "../src/service/MeshService.js";
// import { emptyDir } from "../src/service/Helper.js";

// // Empty input and output dirs
// async function emptyDirs() {
//   await emptyDir("./input");
//   await emptyDir("./output");
// }

// // Function to get current filenames
// function getFilenames(__dirname) {
//   let files = [];
//   fs.readdirSync(__dirname).forEach((file) => {
//     files.push(file);
//   });
//   return files;
// }

// describe("mesh service", () => {
//   const envVars = {
//     LOG_LEVEL: "DEBUG",
//     MESH_URL: "https://localhost:8700",
//     MESH_SHARED_KEY: "TestKey",
//     MESH_SENDER_MAILBOX_ID: "X26ABC1",
//     MESH_SENDER_MAILBOX_ACCESS_ID: "",
//     MESH_RECEIVER_MAILBOX_ID: "X26ABC2",
//     MESH_RECEIVER_MAILBOX_ACCESS_ID: "",
//     MESH_DATA_FILE: "./tests/testdata-organizations-100000.csv",
//     MESH_SANDBOX: "true",
//     MESH_RECEIVE_TIMEOUT: "30",
//   };

//   // Load variables
//   // If no object provided then load from .env
//   const loaderInstance = new Loader(envVars);
//   // console.log('check state ->  ' + JSON.stringify(loaderInstance.state()));
//   const messageFile =
//     process.env.MESH_DATA_FILE || "./tests/testdata-organizations-100000.csv";

//   // Create payload
//   const data = new Payload("This is a JEST test.", messageFile);

//   // Get destination Id or provide one
//   const destination = loaderInstance.receiverMailboxID || "X26OT264";

//   // Configure sender service
//   const sendInstance = new SenderService(
//     loaderInstance.senderConfig(),
//     data,
//     destination
//   );

//   // Configure receiver service
//   const receiverInstance = new ReceiverService(loaderInstance.receiverConfig());

//   // Create mesh communication service
//   const meshInstance = new MeshService(
//     loaderInstance,
//     sendInstance,
//     receiverInstance
//   );

//   test("send a message", async () => {
//     emptyDirs(); // Empty input/output dirs

//     // Create services
//     await meshInstance.sendMessage();
//     await meshInstance.receiveMessage(false); // no timeout

//     // Check sent message content is received
//     const filename = getFilenames("./input");
//     const message = fs.readFileSync("./input/" + filename, "utf-8");
//     expect(JSON.parse(message).data).toBe(data.messageContent);
//   });

//   test("send a file", async () => {
//     emptyDirs(); // Empty input/output dirs

//     // Create services
//     await meshInstance.sendFile();
//     await meshInstance.receiveMessage();

//     // Check sent file content is received
//     const filenames = getFilenames("./output").toString().split(",");

//     const expectedResultChunk1 = {
//       Index: "1",
//       "Organization Id": "8cC6B5992C0309c",
//       Name: "Acevedo LLC",
//       Website: "https://www.donovan.com/",
//       Country: "Holy See (Vatican City State)",
//       Description: "Multi-channeled bottom-line core",
//       Founded: "2019",
//       Industry: "Graphic Design / Web Design",
//       "Number of employees": "7070",
//     };

//     const expectedResultChunk2 = {
//       743: "CafDEA20374C6aB",
//       "stics / Procurement": "74823",
//       _2: "Leon-Marshall",
//       _3: "https://barajas.com/",
//       _4: "Croatia",
//       _5: "Virtual holistic methodology",
//       _6: "1997",
//       _7: "Marketing / Advertising / Sales",
//       _8: "5984",
//     };

//     const resultChunk1 = [];
//     const resultChunk2 = [];

//     fs.createReadStream("./output/" + filenames[0])
//       .pipe(csvParser())
//       .on("data", (data) => {
//         resultChunk1.push(data);
//       })
//       .on("end", () => {
//         expect(resultChunk1[0]).toStrictEqual(expectedResultChunk1);
//       });

//     fs.createReadStream("./output/" + filenames[2])
//       .pipe(csvParser())
//       .on("data", (data) => {
//         resultChunk2.push(data);
//       })
//       .on("end", () => {
//         expect(resultChunk2[0]).toStrictEqual(expectedResultChunk2);
//       });
//   }, 40000); // 50 second timeout for sending a file test
// });
