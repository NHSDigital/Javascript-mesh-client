import { Agent } from "https";
import { readFileSync } from "fs";

export default class loaderService {
  constructor(dotenv) {
    const result = dotenv.config();
    if (result.error) {
      throw result.error;
    }
    console.log("Environment variables loaded");

    this.url = process.env.MESH_URL;
    this.sharedKey = process.env.MESH_SHARED_KEY;
    this.sandbox = process.env.MESH_SANDBOX;
    this.senderAgent = new Agent({
      cert: readFileSync(process.env.MESH_SENDER_CERT_LOCATION),
      key: readFileSync(process.env.MESH_SENDER_KEY_LOCATION),
      rejectUnauthorized: false,
    });
    this.receiverAgent = new Agent({
      cert: readFileSync(process.env.MESH_RECEIVER_CERT_LOCATION),
      key: readFileSync(process.env.MESH_RECEIVER_KEY_LOCATION),
      rejectUnauthorized: false,
    });
    this.senderMailboxID = process.env.MESH_SENDER_MAILBOX_ID;
    this.senderMailboxPassword = process.env.MESH_SENDER_MAILBOX_PASSWORD;
    this.receiverMailboxID = process.env.MESH_RECEIVER_MAILBOX_ID;
    this.receiverMailboxPassword = process.env.MESH_RECEIVER_MAILBOX_PASSWORD;
    this.payload = {
      messageContent:"none",
      messageFile:"none"
    }
  }

  log(){
    console.log(this);
  }
}
