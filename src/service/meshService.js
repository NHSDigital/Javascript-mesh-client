import log from "loglevel";
import { waitThirtySeconds } from "./helper.js";

export default class meshService {
  constructor(loader,
    senderService,
    receiverService) {
    this.loader = loader;
    this.senderService = senderService;
    this.receiverService = receiverService;

    let logLevel = process.env.LOG_LEVEL || "DEBUG";
    log.setLevel(log.levels[logLevel]);
  }

  async sendMessage() {
    log.debug("\nsending a message");
    await this.senderService.sendMessage();
  }

  async sendFile() {
    log.debug("\nsending a file");
    await this.senderService.createAndSendMessageChunks();
  }

  async receiveMessage(wait) {
    if(wait === true){
      log.debug("\nwaiting 30 seconds for mesh to process the message");
      await waitThirtySeconds();
      log.debug("\nchecking if the message has arrived");
      await this.receiverService.readMessages();
    } else {
      log.debug("\nchecking if the message has arrived");
      await this.receiverService.readMessages();
    }
  }
}
