import log from "loglevel";
import { writeFile } from "fs";
import getMessageCount from "../get/message_count.js";
import readMessage from "../get/read_message.js";
import markAsRead from "../put/mark_as_read.js";
import { checkConnection } from "./Helper.js";

export default class ReceiverService {
  constructor(config) {
    this.url = config.url;
    this.mailboxID = config.mailboxID;
    this.mailboxPassword = config.mailboxPassword;
    this.sharedKey = config.sharedKey;
    this.agent = config.agent;

    const logLevel = process.env.LOG_LEVEL || "DEBUG";
    log.setLevel(log.levels[logLevel]);
  }

  async readMessages() {
    await checkConnection(
      this.url,
      this.mailboxID,
      this.mailboxPassword,
      this.sharedKey,
      this.agent
    );

    // Get the number of messages in mailbox before we add any new ones.
    log.debug("\nchecking number of messages in mailbox");
    let inboxCount = await getMessageCount({
      url: this.url,
      mailboxID: this.mailboxID,
      mailboxPassword: this.mailboxPassword,
      sharedKey: this.sharedKey,
      agent: this.agent
    });

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
          url: this.url,
          mailboxID: this.mailboxID,
          mailboxPassword: this.mailboxPassword,
          sharedKey: this.sharedKey,
          messageID: message,
          agent: this.agent
        })
        try {
          if (messageResponse.data === "") {
            log.warn("WARNING: No data for message " + message);
          } else {
            switch (messageResponse.status) {
              case 200:
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
                break;
              case 206:
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
                break;
              case 400:
                (err) => {
                  log.error(
                    `ERROR: an error occurred while trying to write chunk data: ${err}`
                  );
                }
                break;
              case 408:
                (err) => {
                  log.error(
                    `ERROR: an error occurred while trying to write chunk data: ${err}`
                  );
                }
                break;
              default:
                (err) => {
                  log.error(
                    `ERROR: an error occurred while trying to write chunk data: ${err}`
                  );
                }
                break;
            }
          }
        } catch {
          console.error("ERROR: Failure reading message" + message);
        }

        try {
          // mark the messages as read
          log.debug("clearing the message from the mailbox");
          await markAsRead({
            url: this.url,
            mailboxID: this.mailboxID,
            mailboxPassword: this.mailboxPassword,
            sharedKey: this.sharedKey,
            message: message,
            agent: this.agent
          });
        } catch {
          console.error("ERROR: Failure marking message" + message + " as read");
        }
      }
    } else {
      log.info("There are no messages in the inbox");
    }
  }
}
