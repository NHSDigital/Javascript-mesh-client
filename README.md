# Repository Template

[![CI/CD Pull Request](https://github.com/nhs-england-tools/repository-template/actions/workflows/cicd-1-pull-request.yaml/badge.svg)](https://github.com/nhs-england-tools/repository-template/actions/workflows/cicd-1-pull-request.yaml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=repository-template&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=repository-template)

Welcome to the Javascript MESH client repo. This repository houses a Javascript MESH client which can be used by any nodejs application to communicate with [MESH](https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh)

## Table of Contents

- [Repository Template](#repository-template)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Setup](#setup)
  - [Functions](#functions)
    - [Handshake](#handshake)
    - [Message Retrieval](#message-retrieval)
    - [Message Management](#message-management)
    - [Message Creation and Sending](#message-creation-and-sending)
    - [Configuration and Examples](#configuration-and-examples)
  - [Usage](#usage)
  - [Contributing](#contributing)
  - [Testing](#testing)
  - [Contacts](#contacts)
  - [Licence](#licence)

## Installation

This library does not require any external dependencies beyond those used in the src directory files. However, ensure you have a modern version of Node.js installed that supports ES Modules.

you can install the module with `npm i nhs-mesh-client`

jsdocs can be accessed [here](https://nhsdigital.github.io/Javascript-mesh-client/)

## Setup

This client is compatible with the sandbox, integration and production MESH systems.

The repository is structured into several directories, each containing specific types of operations:

- `get/`: Contains functions for retrieving information from the message exchange system.
- `put/`: Contains functions for updating the status of messages.
- `post/`: Contains functions for creating or sending messages.
- `examples/`: Contains examples on how to use the functions in practical scenarios.

## Functions

### Handshake

- `handShake`: Establishes a connection with the message exchange system, ensuring that communication is possible.

### Message Retrieval

- `getMessageCount`: Retrieves the count of messages currently stored in the mailbox.
- `readMessage`: Reads the content of a specific message.

### Message Management

- `markAsRead`: Marks a message as read or acknowledged, updating its status within the system.

### Message Creation and Sending

- `sendMessage`: Sends a new message to the specified recipient.
- `sendChunkedMessage`: Sends a large message in chunks, suitable for handling large datasets or files.

### Configuration and Examples

- `loadConfig`: Loads and returns configuration settings for the message exchange system, preparing it for operation.
- `createMessages`: Demonstrates how to create and send a message using the system.
- `createMessageChunks`: Demonstrates how to send a large message in chunks.
- `receiveMessage`: Demonstrates how to retrieve and process messages from the mailbox.

## Usage

To use any of the provided functions, first ensure you have the necessary configuration. This typically involves setting up authentication details, specifying the target mailbox IDs, and other relevant settings. Here's a basic example

```javascript
import { loadConfig, createMessages } from "./src/index.js";

async function main() {
  const config = await loadConfig({
    logLevel: "DEBUG",
    url: "https://example.com/messaging",
    // additional configuration options...
  });

  await createMessages(config);
}

main();
```

## Contributing

Contributions to improve or extend the functionality of this message exchange system are welcome. Please follow the existing code structure and document any new functions or changes thoroughly.

## Testing

`npm test` will execute meshService.test.js.

## Contacts

Maintainers: [andrew cleveland](mainto:andrew.cleveland1@nhs.net)

## Licence

Unless stated otherwise, the codebase is released under the MIT License. This covers both the codebase and any sample code in the documentation.

Any HTML or Markdown documentation is [© Crown Copyright](https://www.nationalarchives.gov.uk/information-management/re-using-public-sector-information/uk-government-licensing-framework/crown-copyright/) and available under the terms of the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).
