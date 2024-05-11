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

  private sendUserEmit(
    socket: Socket,
    socket_id: string,
    body: any,
    event: string
  ) {
    console.log(
      '------------------ SENDING EVENT TO TARGET ------------------'
    );
    console.log(
      `Message sent socketId (${socket_id}) by emit event (${event})`
    );

    socket.to(socket_id).emit(event, body);
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
      }, 2000);
    });
    return askPromise;
  };

  socketHandle = async (socket: Socket) => {
    console.log(socket.id);

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
          this.sendUserEmit(
            socket,
            socket.id,
            { error: 'No message' },
            'error'
          );
          return;
        }
        const history = this.users.find(
          (connection) => connection.socketId === socket.id
        );

        if (history) {
          history.promps.push(chat_text);
        }
        this.askFromModel(chat_text)
          .then((response) => {
            console.log(response, 'response');
            this.sendUserEmit(
              socket,
              socket.id,
              { response: 'Амжилттай хүлээн авлаа' },
              'success_response'
            );
          })
          .catch((err) => {
            this.sendUserEmit(
              socket,
              socket.id,
              { error: err.message },
              'error'
            );
          });
      } catch (error) {
        console.log('error');
        console.log(error);
      }
    });

    socket.on('disconnect', () => {
      console.log('disconnect event');
      socket.disconnect(true);
    });
  };
}
