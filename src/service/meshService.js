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
    if (timeout > 0) {
      log.debug(`\nwaiting ${timeout} seconds for mesh to process the message`);
      await waitSeconds(timeout);
      log.debug("\nchecking if the message has arrived");
      log.warn("\nchecking if messages has arrived is taking longer than usual");
      await this.receiverService.readMessages();
    } else if (timeout === "") {
      log.debug("\nno timeout set");
      log.debug("\nchecking if the message has arrived");
      await this.receiverService.readMessages();
    }
  }
}

// remove comments - done
// make env consts - done
// make logs debug level logs - done
// add description for sandbox id - done
// pass down to override - done
// make empty dirs a function - done
