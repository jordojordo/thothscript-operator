import express from 'express';
import bodyParser from 'body-parser';
import { createServer } from 'http';

import ChatHandler from './modules/ChatHandler.js';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

new ChatHandler(server);

app.use(bodyParser.json());

app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
