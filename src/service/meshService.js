import log from "loglevel";
import { waitSeconds } from "./helper.js";

export default class meshService {
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

  async receiveMessage() {
    const timeout = process.env.MESH_RECEIVE_TIMEOUT;
    log.debug(`\nwaiting ${timeout} seconds for mesh to process the message`);
    await waitSeconds(timeout);
    log.debug("\nchecking if the message has arrived");
    log.warn("\nchecking if messages has arrived is taking longer than usual");
    await this.receiverService.readMessages();
  }
}
