async function createMessages() {
  // Check connection to mailbox
  log.debug("\nChecking connection to mailbox with handshake");
  await handShake({
    url: url,
    mailboxID: senderMailboxID,
    mailboxPassword: senderMailboxPassword,
    sharedKey: sharedKey,
    agent: senderAgent,
  });

  log.debug("\nCreating new message");
  // Create new messages
  let newMessage = await sendMessage({
    url: url,
    mailboxID: senderMailboxID,
    mailboxPassword: senderMailboxPassword,
    message: messageContent,
    mailboxTarget: receiverMailboxID,
    sharedKey: sharedKey,
    agent: senderAgent,
  });
  log.debug("New message created with an ID: " + newMessage.data["message_id"]);
  log.debug("Message content is: " + messageContent);
}

async function createMessageChunks() {
  // Check connection to mailbox
  log.debug("\nChecking connection to mailbox with handshake");
  await handShake({
    url: url,
    mailboxID: senderMailboxID,
    mailboxPassword: senderMailboxPassword,
    sharedKey: sharedKey,
    agent: senderAgent,
  });

  await sendMessageChunks({
    url: url,
    mailboxID: senderMailboxID,
    mailboxPassword: senderMailboxPassword,
    mailboxTarget: receiverMailboxID,
    messageFile: messageFile,
    sharedKey: sharedKey,
    agent: senderAgent,
  });
}
