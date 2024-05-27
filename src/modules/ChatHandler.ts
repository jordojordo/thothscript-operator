import WebSocket, { WebSocketServer } from 'ws';
import { Server as HttpServer } from 'http';
import * as gptscript from '@gptscript-ai/gptscript';

import { mainTool, kubectlTool, helmTool } from '../types/tools.js';

interface ChatState {
  run: gptscript.Run;
  next: gptscript.Run | null;
  initializing: boolean;
}

interface UserMessage {
  id: number,
  author: string,
  input: string,
  toolConfig: {
    maxTokens: number,
    modelName: string,
    temperature: number,
    chat: boolean,
    runOpts: gptscript.RunOpts
  }
}

interface SystemOutput {
  message: string | { [key: string]: any };
  event?: string;
  error?: any;
}

class ChatHandler {
  private wss: WebSocketServer;
  private chatSessions: Map<WebSocket, ChatState>;

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server });
    this.chatSessions = new Map();

    this.wss.on('connection', (ws: WebSocket) => this.handleConnection(ws));
  }

  private handleConnection(ws: WebSocket): void {
    console.log('Client connected');

    ws.on('message', async (message: WebSocket.Data) => {
      console.log('Received message:', message.toString());
      const parsedMessage = JSON.parse(message.toString());

      if ( parsedMessage.type === 'ping' ) {
        console.log('Received ping from client');
        // Optionally, send a pong response
        ws.send(JSON.stringify({ type: 'pong' }));
      }

      await this.handleMessage(ws, parsedMessage);
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      this.chatSessions.delete(ws);
    });
  }

  private async handleMessage(ws: WebSocket, message: UserMessage): Promise<void> {
    let chatState = this.chatSessions.get(ws);
    const input = message.input;

    if ( input && (!chatState || chatState.initializing) ) {
      console.log('Initializing new chat session with input:', input);
      try {
        const client = new gptscript.Client();
        const tools = [mainTool, kubectlTool, helmTool];
        const opts: gptscript.RunOpts = { ...message.toolConfig.runOpts, input };

        if ( message.toolConfig ) {
          for ( const tool of tools ) {
            tool.maxTokens = message.toolConfig.maxTokens;
            tool.modelName = message.toolConfig.modelName;
            tool.temperature = message.toolConfig.temperature;
            tool.chat = message.toolConfig.chat;
          }
        }

        chatState = {
          run: client.evaluate(tools, opts),
          next: null,
          initializing: true
        };

        this.chatSessions.set(ws, chatState);

        let chatOutput: { event: string, message: string | { [key: string]: any } };

        const initialOutput = await chatState.run.text();

        console.log('Chat session initialized and initial output sent:', initialOutput);

        chatOutput = { event: 'Initial', message: initialOutput };
        this.send(ws, chatOutput);
        
        chatState.initializing = false;
      } catch (error: any) {
        console.warn('Error initializing chat session:', error);

        const chatOutput = { event: 'Error', message: 'Failed to initialize chat session, please try again.', error };
        this.send(ws, chatOutput);
      }
      return;
    }

    if ( chatState && input ) {
      try {
        if ( chatState.run.state === gptscript.RunState.Continue ) {
          console.log('Continuing chat with input:', input);
          chatState.next = chatState.run.nextChat(input);
          const output = await chatState.next.text();

          chatState.next.on(gptscript.RunEventType.CallContinue, (data) => {
            console.log('CallContinue continue event:', data);
            const chatOutput = { event: 'CallContinue', message: data };
            
            this.send(ws, chatOutput);
          });

          chatState.next.on(gptscript.RunEventType.CallProgress, (data) => {
            console.log('CallProgress continue event:', data.content);
            const chatOutput = { event: 'CallProgress', message: data };
            
            this.send(ws, chatOutput);
          });
  
          chatState.next.on(gptscript.RunEventType.CallFinish, (data) => {
            console.log('CallFinish continue event:', data.content);
            const chatOutput = { event: 'CallFinish', message: data };

            this.send(ws, chatOutput);
          });

          chatState.run = chatState.next;
          const chatOutput = { event: 'Next', message: output };

          this.send(ws, chatOutput);
          console.log('Sent output to client:', output);
        } else {
          const chatOutput = { event: 'Close', message: 'Chat session finished' }

          this.send(ws, chatOutput);
          console.log('Chat session finished');

          this.chatSessions.delete(ws);
        }
      } catch (error: any) {
        const chatOutput = { event: 'Error', message: 'Failed to continue chat session, please try again.', error };

        this.send(ws, chatOutput);
        console.warn('Error during chat continuation:', error);
      }
    } else if ( !input && chatState ) {
      console.log('No input provided for continuation.');
      const chatOutput = { event: 'Error', message: 'No input provided for continuation.' };

      this.send(ws, chatOutput);
    } else {
      console.log('No input or valid chat state found.');
      const chatOutput = { event: 'Error', message: 'No input or valid chat state found.' };

      this.send(ws, chatOutput);
    }
  }

  private async send(ws: WebSocket, chatOutput: SystemOutput): Promise<void> {
    ws.send(JSON.stringify({ id: Date.now(), author: 'System', output: chatOutput }));
  }
}

export default ChatHandler;
