
export default class meshService {
  constructor(loader,
    senderService,
    receiverService) {
    this.loader = loader;
    this.senderService = senderService;
    this.receiverService = receiverService;
  }

  async sendMessage() {
    console.log('Send message.');
    this.senderService.sendMessage();
  }

  async sendFile() {
    console.log('Send file.');
    this.senderService.createAndSendMessageChunks();
  }

  async receiveMessage() {
    console.log('Receive message.');
    let count = this.receiverService.getMessageCount();
    console.log(`There are ${count} messages.`);
    this.receiverService.readMessages();
  }

  async messageCount() {
    let count = this.receiverService.getMessageCount();
    console.log(`There are ${count} messages.`);
  }
}
