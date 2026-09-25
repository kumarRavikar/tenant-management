import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (token?: string): Socket => {
  if (!socket) {
    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') ||
      'https://tenant-management-2.onrender.com';

    socket = io(SOCKET_URL, {
      withCredentials: true,
      auth: {
        token: token || localStorage.getItem('accessToken') || undefined,
      },
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const connectSocket = (token?: string): Socket => {
  const s = getSocket(token);
  if (!s.connected) {
    if (token) {
      s.auth = { token };
    }
    s.connect();
  }
  return s;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

