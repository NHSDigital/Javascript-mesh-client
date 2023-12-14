import log from "loglevel";
import { waitSeconds } from "./Helper.js";

export default class MeshService {
  constructor(loader,
    senderService,
    receiverService) {
    this.loader = loader;
    this.senderService = senderService;
    this.receiverService = receiverService;

    const logLevel = process.env.LOG_LEVEL || "DEBUG";
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
    if (wait === false) {
      log.debug("\nchecking if the message has arrived");
      await this.receiverService.readMessages();
    } else {
      const timeout = process.env.MESH_RECEIVE_TIMEOUT;
      log.debug(`\nwaiting ${timeout} seconds for mesh to process the message`);
      await waitSeconds(timeout);
      log.debug("\nchecking if the message has arrived");
      await this.receiverService.readMessages();
    }
  }
}
