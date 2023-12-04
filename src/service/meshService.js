import { waitThirtySeconds } from "./helper.js";

export default class meshService {
  constructor(loaderService,
    senderService,
    receiverService) {
    this.loaderService = loaderService;
    this.senderService = senderService;
    this.receiverService = receiverService;
  }

  async #sendMessage() {

  }

  async #receiveMessage() {

  }

  async test(){
    console.log('Test...');
    this.loaderService.log();
    this.#sendMessage();
    waitThirtySeconds();
    this.#receiveMessage();
  }
}
