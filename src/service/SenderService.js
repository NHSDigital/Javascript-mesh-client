import log from "loglevel";
import sendMessage from "../post/send_message.js";
import sendMessageChunks from "../post/send_message_chunks.js";
import { checkConnection } from "./Helper.js";

export default class SenderService {
  constructor(config, payload, destination) {
    this.url = config.url;
    this.mailboxID = config.mailboxID;
    this.mailboxPassword = config.mailboxPassword;
    this.sharedKey = config.sharedKey;
    this.agent = config.agent;
    this.messageContent = payload.messageContent;
    this.messageFile = payload.messageFile;
    this.mailboxTarget = destination;

    const logLevel = process.env.LOG_LEVEL || "DEBUG";
    log.setLevel(log.levels[logLevel]);
  }

  // Send a message
  async sendMessage() {
    await checkConnection(
      this.url,
      this.mailboxID,
      this.mailboxPassword,
      this.sharedKey,
      this.agent
    );
    log.debug("\nCreating new message");
    let newMessage = await sendMessage({
      url: this.url,
      mailboxID: this.mailboxID,
      mailboxPassword: this.mailboxPassword,
      message: this.messageContent,
      mailboxTarget: this.mailboxTarget,
      sharedKey: this.sharedKey,
      agent: this.agent,
    });
    log.debug(
      "New message created with an ID: " + newMessage.data["message_id"]
    );
    log.debug("Message content is: " + this.messageContent);
  }

  // Chunk a file
  async createAndSendMessageChunks() {
    await checkConnection(
      this.url,
      this.mailboxID,
      this.mailboxPassword,
      this.sharedKey,
      this.agent
    );
    await sendMessageChunks({
      url: this.url,
      mailboxID: this.mailboxID,
      mailboxPassword: this.mailboxPassword,
      mailboxTarget: this.mailboxTarget,
      messageFile: this.messageFile,
      sharedKey: this.sharedKey,
      agent: this.agent,
    });
  }
}
