export async function waitThirtySeconds(override) {
  return new Promise((resolve) => {
    if (override === undefined) {
      setTimeout(() => {
        resolve("30 seconds have passed.");
      }, 30); // 30000 milliseconds = 30 seconds
    } else {
      setTimeout(() => {
        resolve(`${seconds} seconds have passed.`);
      }, seconds * 1000); // custom milliseconds = override seconds
    }
  });
}

// Check connection by performing a handshake
export async function checkConnection(url, mailboxID, mailboxPassword, sharedKey, agent) {
  log.debug("\nChecking connection to mailbox with handshake");
  await handShake({
    url: url,
    mailboxID: mailboxID,
    mailboxPassword: mailboxPassword,
    sharedKey: sharedKey,
    agent: agent
  });
}
