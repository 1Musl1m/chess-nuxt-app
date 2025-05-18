import { Server, type ServerOptions } from "socket.io";
import type { H3Event } from 'h3';

const options: Partial<ServerOptions> = {
  path: '/api/socket.io',
  serveClient: false,
};

let io: Server | null = null;

const rooms: Record<string, string[]> = {};

export function initSocket(event: H3Event) {
  console.log('[Socket.IO] initSocket вызван');
  if (io) return;

  // @ts-ignore
  const server = event.node.res?.socket?.server;
  if (!server) return;

  io = new Server(server, options);

  // --- Чат ---
  io.of('/chat').on('connection', (socket) => {
    console.log('[Socket.IO] Чат: подключен', socket.id);

    socket.emit('connected', { message: 'Конект есть' });

    socket.on('chat', (data) => {
      io!.of('/chat').emit('chat', { id: socket.id, ...data });
    });
  });

  // --- Игра ---
  io.of('/game').on('connection', (socket) => {
    console.log('[Socket.IO] Игра: подключен', socket.id);

    socket.on('joinRoom', (roomId: string) => {
      console.log(`[GAME] ${socket.id} хочет зайти в ${roomId}`);
      const room = rooms[roomId] || [];

      if (room.length >= 2) {
        socket.emit('roomFull');
        return;
      }

      room.push(socket.id);
      rooms[roomId] = room;
      socket.join(roomId);

      const color = room.length === 1 ? 'white' : 'black';
      socket.emit('joined', { roomId, color });

      if (room.length === 2) {
        io!.of('/game').to(roomId).emit('startGame');
      }

      console.log(`🔗 Игрок ${socket.id} подключился к комнате ${roomId} как ${color}`);
    });

    socket.on('move', ({ roomId, move }) => {
      socket.to(roomId).emit('opponentMove', move);
       console.log(`♻️ Переслан ход в комнату ${roomId}:`, move);
    });

    socket.on('disconnect', () => {
      for (const [roomId, sockets] of Object.entries(rooms)) {
        rooms[roomId] = sockets.filter(id => id !== socket.id);
        if (rooms[roomId].length === 0) delete rooms[roomId];
      }
      console.log(`❌ Игрок ${socket.id} отключился`);
    });
  });
}