import React, { useEffect, useContext} from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketContext } from '../UserSocket';


function Logout(){
    const navigate = useNavigate();  
  const socket = useContext(SocketContext);

    useEffect(() => {
        const handleLogout = () => {
            // console.log(localStorage);
            localStorage.clear();
            // console.log(localStorage);
            socket.emit('logout');
            navigate(`/users/login`);
        };

        handleLogout();
    }, []);

    return null;

}

export default Logout;