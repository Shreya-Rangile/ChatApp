import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketContext } from '../UserSocket';
import { capitalCase, upperCase } from "text-case";
import axios from 'axios';

const ChatList = () => {
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();
  const socket = useContext(SocketContext);

    // useEffect(() => {
    //     fetchChatList();
    // }, []);

    useEffect(()=>{
        fetchChatList();

        socket.on('userStatusChange', ({userId, isOnline}) =>{
            setUsers(prevUsers => prevUsers.map(user =>
                user._id === userId ? { ...user, isOnline} : user               
                ));
            fetchChatList();
        });
        
        return () =>{
            socket.off('userStatusChange');
        };

    }, [socket]);

    const fetchChatList = async () => {
        try {
            const response = await axios.post('http://localhost:3000/chat-list', {
                id: localStorage.getItem("Id")
            });

            const data = response.data;

            if (data.statusCode === 200) {
                setUsers(data.data);
        console.log(response.data);

            } else {
                console.log('Error: ', data.message);
            }

        } catch (err) {
            console.log("error: ", err);
        }
    }

    const handleOpenChat = async (id, name, chatId) => {
        localStorage.setItem("name", name);
        localStorage.setItem("currentChatId", chatId);
        navigate(`/chat/${id}`);
    };

    return (

        <div className=" grid place-items-center content-between p-10">
            <h1 className="text-xl font-semibold w-96 text-center text-slate-200 bg-gray-800">Chat List</h1>
            <ul className="w-96 border-4 border-zinc-100">
                {users.map((user, index) => (
                    <li className="w-full border-b border-neutral-200 flex flex-wrap py-4 hover:bg-zinc-100 hover:cursor-pointer" key={index} onClick={() => handleOpenChat(user.id, user.name, user.chatId)} >
                    <div className="relative inline-flex items-center justify-center w-10 h-10  p-1 overflow-visible bg-gray-100 rounded-full dark:bg-gray-600 m-2 ">
              <span className="font-medium text-gray-600 dark:text-gray-300">{upperCase(user.name.charAt(0))}</span>
              <span className={` top-0 left-7 absolute  w-2.5 h-2.5   rounded-full ${user.isOnline ? ' bg-green-400' : ' bg-yellow-400'}`}></span>
              
                     </div>
                        <ul className=''>
                            <li className='text-xl'>
                            {user.name}                       
                            </li>
                            <li className='text-sm text-gray-500'>{user.lastMessage}</li>
                            <li className='text-sm text-gray-500'>
                            {new Date(user.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {/* {user.updatedAt} */}
                             </li>

                        </ul>

                    </li>
                ))}
            </ul>
        </div>
    )

}

export default ChatList;

