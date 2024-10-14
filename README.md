# ThothScript Operator

## Overview

The ThothScript Operator is a Node.js application designed to facilitate script operations on a Kubernetes cluster using the GPTScript AI. It provides an API interface that leverages kubectl and Helm capabilities to manage Kubernetes resources through natural language scripting.

## Features

  - GPTScript Integration: Execute scripts using GPTScript, a natural language scripting language that simplifies interactions with Large Language Models (LLMs).
  - Kubernetes Management: Perform CRUD operations on Kubernetes resources using kubectl and Helm commands.
  - API Interface: Provides an API for script execution and Kubernetes management, making it easy to integrate with other services or applications.
  - Modular Design: Extend and customize the operator to suit specific requirements.
  - Development Tools: Includes commands for building, cleaning, starting, and developing the application, ensuring a smooth workflow for developers.

## Installation

To deploy the ThothScript Operator in your Kubernetes cluster, you can use the provided Helm chart. Follow these steps to install the Helm chart:

1. Add the Helm repository:

```bash
helm repo add jordojordo https://jordojordo.github.io/helm-charts
helm repo update
```

2. Install the ThothScript Operator chart:

```bash
helm install thothscript-operator jordojordo/thothscript-operator
```

### Configuration

You can customize the installation by providing your own values file or setting parameters directly in the command line. For example:

```bash
helm install thothscript-operator thothscript-operator/thothscript-operator --namespace thothscript \
  --set image.tag=0.1.0 \
  --set service.type=NodePort
```

For more detailed information on the available parameters and their default values, refer to the [Helm chart](https://github.com/jordojordo/helm-charts/tree/thothscript-operator/charts/thothscript-operator).

## Usage

Below is an example of how to integrate the ThothScript Operator with any node.js based chatbot. The chatbot connects to the ThothScript Operator via WebSocket, allowing users to send GPTScript commands and receive responses.

```typescript
const url = 'ws://your-operator-url/ws/';
let socket;

const connect = () => {
  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log('Connected to ThothScript Operator');
  };

  socket.onmessage = (event) => {
    const parsedMessage = JSON.parse(event.data);
    console.log('Received message:', parsedMessage);
    handleMessage(parsedMessage);
  };

  socket.onclose = () => {
    console.log('Disconnected from ThothScript Operator');
    // Optionally, attempt to reconnect
    setTimeout(connect, 10000); // Try to reconnect every 10 seconds
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
};

const handleMessage = (message) => {
  if (message.output) {
    console.log('Output:', message.output);
  } else {
    console.error('Error:', message.error);
  }
};

const send = (text) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    const message = {
      author: 'User',
      input: text,
      toolConfig: {
        maxTokens: 100,
        modelName: 'gpt-4-turbo',
        temperature: 0.7,
        chat: true,
      },
    };
    socket.send(JSON.stringify(message));
    console.log('Sent message:', message);
  } else {
    console.error('WebSocket is not connected');
  }
};

// Connect to the WebSocket server
connect();

// Example of sending a message
send('Hello, ThothScript!');
```

### How to Use This Example

  - Connect to WebSocket Server: The connect function establishes a WebSocket connection to the ThothScript Operator.
  - Handle Incoming Messages: The handleMessage function processes messages received from the server and logs the output or errors.
  - Send Messages: The send function sends a message to the ThothScript Operator with the necessary configuration.

## Development

To set up the thothscript-operator, ensure you have Node.js installed, then run:

```bash
pnpm install
```

## Usage
Start the server with:

```bash
pnpm start
```

For development, watch for changes in the source files:

```bash
pnpm dev
```

## License

Copyright 2024 Thothscript

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
