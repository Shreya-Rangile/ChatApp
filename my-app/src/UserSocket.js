import React from 'react';
import io from "socket.io-client";
const socketUrl = 'http://localhost:3000';

export const socket = io(socketUrl, {
    timeout: 60000,
});
export const SocketContext = React.createContext();
// export const SocketContext = createContext();




