import { io } from 'socket.io-client';
import { BASE_URL } from './constants';

let socketInstance = null;

const readToken = (explicitToken) => {
  if (explicitToken) return explicitToken;
  
  // Try to get token from cookies FIRST (this is what HTTP requests use)
  try {
    const match = document.cookie.match(/(?:^|; )token=([^;]+)/);
    if (match && match[1]) {
      const cookieToken = decodeURIComponent(match[1]);
      console.log("🍪 Using token from cookie");
      return cookieToken;
    }
  } catch {}
  
  // Fallback to localStorage
  try {
    const lsToken = localStorage.getItem('token');
    if (lsToken) {
      console.log("💾 Using token from localStorage");
      return lsToken;
    }
  } catch {}
  
  // Try to get user from localStorage and extract token if needed
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.token) {
      console.log("👤 Using token from user object");
      return user.token;
    }
  } catch {}
  
  console.log("❌ No token found anywhere");
  return undefined;
};

export const getSocket = (userId, token) => {
  if (socketInstance && socketInstance.connected) {
    console.log("🔌 Reusing existing socket connection");
    return socketInstance;
  }

  if (socketInstance) {
    console.log("🔌 Disconnecting old socket");
    try {
      socketInstance.disconnect();
    } catch {}
  }

  // Clear old localStorage token to force using cookies
  try {
    const oldToken = localStorage.getItem('token');
    if (oldToken) {
      console.log("🧹 Clearing old localStorage token");
      localStorage.removeItem('token');
    }
  } catch {}

  const authToken = readToken(token);
  console.log("🔌 Creating new socket connection with token:", !!authToken);

  socketInstance = io(BASE_URL, {
    auth: { token: authToken },
    withCredentials: true,
    transports: ['websocket', 'polling'], // Allow both transports
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
  });

  // Add connection event listeners for debugging
  socketInstance.on('connect', () => {
    console.log('🔌 Socket connected successfully');
  });

  socketInstance.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socketInstance.on('connect_error', (error) => {
    console.error('🔌 Socket connection error:', error);
    
    // If it's an authentication error, try to refresh token
    if (error.message && error.message.includes('Authentication failed')) {
      console.log('🔄 Authentication failed, attempting token refresh...');
      import('./tokenRefresh.js').then(({ handleTokenError }) => {
        handleTokenError();
      });
    }
  });

  socketInstance.on('error', (error) => {
    console.error('🔌 Socket error:', error);
    
    // Handle authentication errors
    if (error.message && error.message.includes('Authentication failed')) {
      console.log('🔄 Socket authentication failed, attempting token refresh...');
      import('./tokenRefresh.js').then(({ handleTokenError }) => {
        handleTokenError();
      });
    }
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
