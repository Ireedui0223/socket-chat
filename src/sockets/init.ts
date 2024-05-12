import { Server as HttpServer } from 'http';
import isEmpty from 'lodash/isEmpty';
import { Server as SocketIOServer, Socket } from 'socket.io';

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
    console.log(text);
    const askPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (text.length < 4) reject('урт хүрэхгүй');
        resolve('model response');
      }, 4000);
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
          this.sendUserEmit(socket, { error: 'No message' }, 'error');
          return;
        }
        const history = this.users.find(
          (connection) => connection.socketId === socket.id
        );

        if (history) {
          history.promps.push(chat_text);
        }
        // socket.to(socket.id).emit('success', 'success');
        this.askFromModel(chat_text)
          .then(() => {
            this.sendUserEmit(socket, 'Амжилттай хүлээн авлаа', 'success');
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
