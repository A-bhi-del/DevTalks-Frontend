import React from 'react'
import { io } from 'socket.io-client';
import { BASE_URL } from './constants';

const createsocketConnection = (userId) => {
    return io(BASE_URL, {
        auth: { userId },
    });
}

export default createsocketConnection;
