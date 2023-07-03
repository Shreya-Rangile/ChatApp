import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { capitalCase, upperCase } from "text-case";
import { SocketContext } from '../UserSocket';
import { useNavigate } from 'react-router-dom';

const UserList = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([]);
  const socket = useContext(SocketContext);
  const username = localStorage.getItem('name');

  //SOCKET SETUP AND FETCHING THE DATA ON LOADING 
  useEffect(() => {
    fetchData();
    const userId = localStorage.getItem('Id');
   
    socket.emit('set-up', userId);

    // socket.on('userStatusChange', ({ userId, isOnline }) => {
    //   setUsers(prevUsers =>
    //     prevUsers.map(user =>
    //       user._id === userId ? { ...user, isOnline } : user
    //     )
    //   );
    //   fetchData();
    // });

    // return () => {
    //   socket.off('userStatusChange');
    // };
  }, []);


  //FETCHING THE CHAT DATA BETWEEN 2 USERS
  const fetchData = async () => {
    try {
      const response = await axios.post('http://localhost:3000/users-list', {
        id: localStorage.getItem("Id")
      });
      const data = response.data;

      if (data.statusCode === 200) {     
       
        setUsers(data.data);
        console.log(response.data);
      } else {
        console.log('Error:', data.message);
      }
    } catch (error) {
      console.log('Error:', error);
    }
  };

  const handleOpenChat = (id, name, chatId) => {
    localStorage.setItem("name", name);
    // localStorage.setItem("currentChatId", chatId);
    if (chatId !== null) {
      localStorage.setItem("currentChatId", chatId);
    }else {
      localStorage.removeItem("currentChatId");
    }
    navigate(`/chat/${id}`);
  };

  return (

    <div className=" grid place-items-center content-between p-10">
      <h1 className="text-xl font-semibold w-96 text-center text-slate-200 bg-gray-800">User List</h1>
      <ul className="w-96 border-4 border-zinc-100">
        {users.map((user, index) => (
          <li
            className="w-full border-b border-neutral-200  py-4  flex flex-wrap hover:bg-zinc-100 hover:cursor-pointer"
            key={index} onClick={() => handleOpenChat(user._id, user.name, user.chatId || null)}
          >
            <div className="relative inline-flex items-center justify-center w-10 h-10  p-1 overflow-visible bg-gray-100 rounded-full dark:bg-gray-600 m-2 ">
              <span className="font-medium text-gray-600 dark:text-gray-300">{upperCase(user.name.charAt(0))}</span>
              {/* <span className={` top-0 left-7 absolute  w-2.5 h-2.5   rounded-full ${user.isOnline ? ' bg-green-400' : ' bg-yellow-400'}`}></span> */}
            </div>
            <ul>
              <li className='text-xl'>{capitalCase(user.name)}</li>
              <li className='text-sm text-gray-500'>{user.contact}</li>

              {/* {user.unreadCount !== 0 && (
                <li className='text-sm text-green-500'>Unread messages: {user.unreadCount}</li>
              )} */}
              

            </ul>

          </li>
        ))}
      </ul>
    </div>

  );
};

export default UserList;
