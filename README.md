# Repository Template

[![CI/CD Pull Request](https://github.com/nhs-england-tools/repository-template/actions/workflows/cicd-1-pull-request.yaml/badge.svg)](https://github.com/nhs-england-tools/repository-template/actions/workflows/cicd-1-pull-request.yaml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=repository-template&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=repository-template)

Welcome to the Galleri MESH client. This repository houses a Javascript MESH client which is used by the Galleri project to communicate with [MESH](https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh), however it is intended to be universal so any teams that want to use javascript to talk to mesh could utilize this client

## Table of Contents

- [Repository Template](#repository-template)
  - [Table of Contents](#table-of-contents)
  - [Setup](#setup)
  - [Usage](#usage)
    - [MESH module services](#mesh-module-services)
    - [Testing](#testing)
  - [Contacts](#contacts)
  - [Licence](#licence)

## Setup

This client is compatible with the sandbox, integration and production MESH systems. To use it follow these instructions:

1. install the module with `npm i nhs-mesh-client`

2. Set the environmental variables to configure the targets, you can do this by setting the environment variables in a .env file or use system variables.

3. If you want to run against a local sandbox for testing you can use the following example which will work with the defaults if you are running [mesh-sandbox](https://github.com/NHSDigital/mesh-sandbox) locally

```shell
# Required variables

# enables or disabled sandbox mode, this should be set to `true` for the sandbox or `false` for integration environments
export MESH_SANDBOX=true

# The url for the interface you will be connecting to, this is the default
# for a local sandbox environment
export MESH_URL="https://localhost:8700"

# The ID of the mailbox that you want to send messages from, default is the mesh-sandbox id
export MESH_SENDER_MAILBOX_ID="X26ABC1"

# The Password of the mailbox that you want to send messages to, default is the mesh-sandbox password
export MESH_SENDER_MAILBOX_PASSWORD="password"

# The ID of the mailbox that you want to receive messages from, default is the mesh-sandbox id
export MESH_RECEIVER_MAILBOX_ID="X26ABC2"

# The Password of the mailbox that you want to receive messages to, default is the mesh-sandbox password
export MESH_RECEIVER_MAILBOX_PASSWORD="password"

# The message content that will be delivered
MESH_MESSAGE="This is a test"

# Set the log level you want to see, for testing the recommended setting is `DEBUG` but there are also `ERROR` and `INFO` levels
LOG_LEVEL="DEBUG"



# Optional vars which are needed for integration but not for sandbox

# The location of the certificate used by the sending mailbox, only required for integration and production.
MESH_SENDER_CERT_LOCATION="/cert/location/here"

# The location of the key used with the certificate above, only required for integration and production.
MESH_SENDER_KEY_LOCATION="/cert/location/here"

# The location of the certificate used by the receiving mailbox, only required for integration and production.
MESH_RECEIVER_CERT_LOCATION="/cert/location/here"

# The location of the key used with the certificate above, only required for integration and production.
MESH_RECEIVER_KEY_LOCATION="/cert/location/here"

# The location of the CA cert which is required for integration and production MESH systems.
MESH_SENDER_CA_LOCATION="/cert/location/here"
```

## Usage

See MeshService.test.js to see an implementation of the mesh module services configured to send and receive a message/file.

You will need the dotenv package for the following.
To connect to the sanbox environment the following environmental variables need to be set:

    LOG_LEVEL="DEBUG"
    MESH_URL="https://localhost:8700"
    MESH_SHARED_KEY="TestKey"
    MESH_SENDER_MAILBOX_ID="X26ABC1"
    MESH_SENDER_MAILBOX_ACCESS_ID=""
    MESH_RECEIVER_MAILBOX_ID="X26ABC2"
    MESH_RECEIVER_MAILBOX_ACCESS_ID=""
    MESH_DATA_FILE="./tests/testdata-organizations-100000.csv"
    MESH_SANDBOX="true"
    MESH_RECEIVE_TIMEOUT="30"

Alternatively see meshModuleTemplate.js which contains an example on connecting to your own MESH Mailbox by setting your own environmental variables.

#### MESH module services

The module contains a Loader, SenderService, ReceiverService and MeshService classes that need
to be configured.

Once dotenv is installed, set your values in your .env file including the message and/or file to transmit. The Loader class will initialise the environmental variables. User loaderInstance.state()
to debug the values.

The SenderService instance takes loaderInstance.senderConfig() as an argument and sets the
senderInstance values. You can pass in different loaderInstances to configure multiple senderInstances. A Payload object containing the message and/or file to transmit. A destination which is the receiver mailbox id.

The receiverService instance takes loaderInstance.receiverConfig() as an argument and sets the
receiverInstance values. You can pass in different loaderInstances to configure multiple receiverInstances.

The MeshServices instance takes as argument a senderInstance and a receiverInstance and creates
a sender/receiver relationship between the two instances. You can use meshInstance to call
sendMessage(), sendFile() and receiveMessage(). You can configure multiple meshInstances with
different sender/receiver instances and allow relationships between different senders and receivers.

### Testing

`npm test` will execute meshService.test.js.

## Contacts

Maintainers: andrew.cleveland1@nhs.net

## Licence

Unless stated otherwise, the codebase is released under the MIT License. This covers both the codebase and any sample code in the documentation.

Any HTML or Markdown documentation is [© Crown Copyright](https://www.nationalarchives.gov.uk/information-management/re-using-public-sector-information/uk-government-licensing-framework/crown-copyright/) and available under the terms of the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).
