import log from "loglevel";
import getMessageCount from "./src/get/message_count.js";
import readMessage from "./src/get/read_message.js";
import markAsRead from "./src/put/mark_as_read.js";

export default class receiverService {
  constructor() {
    constructor(config) {
      this.url = config.url;
      this.mailboxID = config.mailboxID;
      this.mailboxPassword = config.mailboxPassword;
      this.sharedKey = config.sharedKey;
      this.agent = config.agent;
      this.message = "";
      this.messageFile = "";
      this.mailboxTarget = "";

      let logLevel = process.env.LOG_LEVEL || "DEBUG";
      log.setLevel(log.levels[logLevel]);
    }
  }

  async getMessageCount() {
    // Get the number of messages in mailbox before we add any new ones.
    log.debug("\nchecking number of messages in mailbox");
    let inboxCount = await getMessageCount({
      url: url,
      mailboxID: receiverMailboxID,
      mailboxPassword: receiverMailboxPassword,
      sharedKey: sharedKey,
      agent: receiverAgent,
    });
  }

  async readMessages(){
      // Loop through the message and read them. so they don't interfere with tests
  if (inboxCount.data["approx_inbox_count"] > 0) {
    log.info(
      "There are " +
        inboxCount.data["approx_inbox_count"] +
        " Messages in the mailbox"
    );
    log.debug("\nLooping through messages to read their content\n");
    for (let message of inboxCount.data["messages"]) {
      let messageResponse = await readMessage({
        url: url,
        mailboxID: receiverMailboxID,
        mailboxPassword: receiverMailboxPassword,
        sharedKey: sharedKey,
        messageID: message,
        agent: receiverAgent,
      });
      try {
        if (messageResponse.data === "") {
          log.warn("WARNING: No data for message " + message);
        } else if (messageResponse.status === 200) {
          log.debug("Message ID is: " + message);
          log.debug(`Writing message to 'input/${message}.csv`);
          writeFile(
            `./input/${message}.csv`,
            JSON.stringify(messageResponse.data, null, 2),
            "utf8",
            (err) => {
              if (err) {
                log.error(
                  `ERROR: an error occurred while trying to write chunk data: ${err}`
                );
              }
            }
          );
        } else if (messageResponse.status === 206) {
          log.debug("Message ID is: " + message);
          log.debug(`Writing chunked message to 'input/${message}.csv`);
          writeFile(
            `./input/${message}.csv`,
            JSON.stringify(messageResponse.data, null, 2),
            "utf8",
            (err) => {
              if (err) {
                log.error(
                  `ERROR: an error occurred while trying to write chunk data: ${err}`
                );
              }
            }
          );
        }
      } catch {
        console.error("ERROR: Failure reading message" + message);
      }

      // mark the messages as read
      log.debug("clearing the message from the mailbox");
      await markAsRead({
        url: url,
        mailboxID: receiverMailboxID,
        mailboxPassword: receiverMailboxPassword,
        sharedKey: sharedKey,
        message: message,
        agent: receiverAgent,
      });
      try {
      } catch {
        console.error("ERROR: Failure marking message" + message + " as read");
      }
    }
  } else {
    log.info("There are no messages in the inbox");
  }
  }

}
