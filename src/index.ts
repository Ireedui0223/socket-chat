import bodyParser from 'body-parser';
import cors from 'cors';
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import http from 'http';
import morgan from 'morgan';
import SocketServer from './sockets/init';

const { SERVICE_NAME, PORT } = process.env;

const app = express();

// Middlewares
app.use(morgan('dev'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const server = http.createServer(app);
new SocketServer(server);

// Routes
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  if (req.method == 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  next();
});

app.get('/users', async (_: any, res: Response) => {
  return res.json({
    success: true,
    users: SocketServer.instance.users
  });
});

process.on('uncaughtException', (err: Error) => {
  console.log('process exception errHandle: ', err.message);
});

server.listen(PORT, async () => {
  console.log(`Listening on port for ${SERVICE_NAME}: ${PORT}`);
});
