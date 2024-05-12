import { Server as HttpServer } from 'http';
import isEmpty from 'lodash/isEmpty';
import { Server as SocketIOServer, Socket } from 'socket.io';
import axios from 'axios';
export default class SocketServer {
  public static instance: SocketServer;
  public io: SocketIOServer;
  public users: Array<{
    socketId: string;
    promps: Array<string>;
  }>;

  constructor(server: HttpServer) {
    SocketServer.instance = this;
    this.users = [];

    this.io = new SocketIOServer(server, {
      serveClient: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      },
      cookie: false,
      allowUpgrades: false
    });

    this.io.setMaxListeners(Infinity);

    this.io.on('connection', this.socketHandle);
  }

  private sendUserEmit(socket: Socket, body: any, event: string) {
    console.log(
      '------------------ SENDING EVENT TO TARGET ------------------'
    );
    console.log(
      `Message sent socketId (${socket.id}) by emit event (${event})`
    );

    socket.emit(event, body);
    console.log(
      '---------------------------------------------------------------'
    );
  }
  private askFromModel = async (text: string) => {
    const askPromise = new Promise((resolve, reject) => {
      const requestHeader = {
        method: 'POST',
        url: 'http://localhost:9000/api/match-input',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        data: { input: text }
      };
      return axios(requestHeader)
        .then((response) => {
          console.log(response);
          resolve(response);
        })
        .catch((err) => {
          console.log(err);
          reject(err.message);
        });
    });
    return askPromise;
  };
  socketHandle = async (socket: Socket) => {
    const history = this.users.find(
      (connection) => connection.socketId === socket.id
    );

    if (!history) {
      this.users.push({
        socketId: socket.id,
        promps: []
      });
    }

    socket.on('send_chat', async (data: { chat_text: string }) => {
      try {
        const { chat_text } = data;
        if (isEmpty(chat_text) || chat_text.length < 2) {
          this.sendUserEmit(socket, 'No message', 'error');
          return;
        }
        const history = this.users.find(
          (connection) => connection.socketId === socket.id
        );

        if (history) {
          history.promps.push(chat_text);
        }
        // socket.to(socket.id).emit('success', 'success');
        await this.askFromModel(chat_text)
          .then((response: any) => {
            this.sendUserEmit(socket, response?.data || '', 'success');
          })
          .catch((err) => {
            this.sendUserEmit(socket, err.message, 'error');
          });
      } catch (error) {
        this.sendUserEmit(socket, error.message, 'error');
      }
    });

    socket.on('disconnect', () => {
      console.log('disconnect event');
      socket.disconnect(true);
    });
  };
}
