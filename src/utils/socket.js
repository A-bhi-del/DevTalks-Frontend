import React from 'react'
import { io } from 'socket.io-client';
import { BASE_URL } from './constants';

const createsocketConnection = () => {
    return io(BASE_URL);
}

export default createsocketConnection;
