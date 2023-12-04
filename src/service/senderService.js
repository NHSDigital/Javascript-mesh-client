import { checkConnection } from "./helper";

export default class sendMessageService {
  constructor(url,
    mailboxID,
    mailboxPassword,
    sharedKey,
    agent) {
    this.url = url;
    this.mailboxID = mailboxID;
    this.mailboxPassword = mailboxPassword;
    this.sharedKey = sharedKey;
    this.agent = agent;
    message = "";
    messageFile = "";
    mailboxTarget = "";
  }

  setPayload(messageService) {
    this.message = messageService.message;
    this.messageFile = messageService.messageFile
  }

  setDestination(receiverService) {
    this.mailboxTarget = receiverService.mailboxTarget;
  }

  // Send a message
  async sendMessage() {
    await checkConnection();
    let newMessage = await sendMessage({
      url: this.url,
      mailboxID: this.mailboxID,
      mailboxPassword: this.mailboxPassword,
      message: this.message,
      mailboxTarget: this.mailboxTarget,
      sharedKey: this.sharedKey,
      agent: this.agent,
    });
    log.debug("New message created with an ID: " + newMessage.data["message_id"]);
    log.debug("Message content is: " + messageContent);
  }

  // Chunk a file
  async createAndSendMessageChunks() {
    await checkConnection();
    await sendMessageChunks({
      url: url,
      mailboxID: this.mailboxID,
      mailboxPassword: this.mailboxPassword,
      mailboxTarget: this.mailboxTarget,
      messageFile: this.messageFile,
      sharedKey: this.sharedKey,
      agent: this.agent,
    });
  }
}
