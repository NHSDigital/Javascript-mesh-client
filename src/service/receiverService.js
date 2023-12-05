import log from "loglevel";
export default class receiverService {
  constructor(){

    let logLevel = process.env.LOG_LEVEL || "DEBUG";
    log.setLevel(log.levels[logLevel]);
  }

}
