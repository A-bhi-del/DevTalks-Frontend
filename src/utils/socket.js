import { io } from 'socket.io-client';
import { BASE_URL } from './constants';

let socketInstance = null;

const readToken = (explicitToken) => {
  if (explicitToken) return explicitToken;
  try {
    const lsToken = localStorage.getItem('token');
    if (lsToken) return lsToken;
  } catch {}
  try {
    const match = document.cookie.match(/(?:^|; )token=([^;]+)/);
    if (match && match[1]) return decodeURIComponent(match[1]);
  } catch {}
  return undefined;
};

export const getSocket = (userId, token) => {
  if (socketInstance && socketInstance.connected) return socketInstance;

  if (socketInstance) {
    try {
      socketInstance.disconnect();
    } catch {}
  }

  const authToken = readToken(token);

  socketInstance = io(BASE_URL, {
    auth: { token: authToken },
    withCredentials: true,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    try {
      socketInstance.disconnect();
    } catch {}
    socketInstance = null;
  }
};

export default getSocket;
