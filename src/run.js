import dotenv from "dotenv";
import payload from "./model/payload.js"
import loaderService from "./service/loaderService.js";
import senderService from "./service/senderService.js";
import receiverService from "./service/receiverService.js"
import meshService from "./service/meshService.js";

// const data = new payload(
//   "This is the message content",
//   "This is the message file"
// )

const ls = new loaderService(dotenv);
const ss = new senderService();
const rs = new receiverService();
const ms = new meshService(ls, ss, rs);
ms.test();


