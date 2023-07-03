import React, { useEffect, useState } from 'react';
import { socket, SocketContext } from './UserSocket';
import io from 'socket.io-client';

const SocketContextProvider = () => {
    const [userId, setUserId] = useState("");

    useEffect(() => {
        socket.on('connected', () => {
          socket.emit('set-up', userId);
        });


    }, [userId]);

    const setUserIdContext = (id) => {
        setUserId(id);
    };

    return (
        <SocketContext.Provider value={socket}>
          
          
        </SocketContext.Provider>
      );
    

};

export default SocketContextProvider;


