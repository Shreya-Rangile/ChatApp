import React, { useEffect, useState, useContext, useRef } from 'react';
import { MdSend } from 'react-icons/md';
import { GrAttachment } from 'react-icons/gr';
import { SocketContext } from '../UserSocket';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { capitalCase, upperCase } from "text-case";
import ImagePreviewModal from './ImagePreview';
import { Routes, Route, useLocation } from 'react-router-dom';
import { MdArrowBackIosNew } from 'react-icons/md';
import {IoIosAddCircle} from 'react-icons/io';
import {IoIosRemoveCircleOutline} from 'react-icons/io';

import { FiMenu } from 'react-icons/fi';

const moment = require("moment");

const GroupChat = () => {
    const myId = localStorage.getItem('Id');
    const myName = localStorage.getItem('senderName');
    const chatId = localStorage.getItem('currentChatId');
    const groupId = localStorage.getItem('groupId');
    const groupName = localStorage.getItem('name');
    const isActive = localStorage.getItem('isActive');
    const inputDocument = useRef();
    const [message, setMessage] = useState('');
    const [chatLog, setChatLog] = useState([]);
    const [users, setUsers] = useState([]);
    const [nonUsers, setNonUsers] = useState([]);
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const socket = useContext(SocketContext);
    const params = useParams();
    const navigate = useNavigate();
    const [isHidden, setIsHidden] = useState(true);
    const [addParticipant, setAddParticipant] = useState(false);
    const [removeParticipant, setRemoveParticipant] = useState(false);
    const [dialogHeading, setIsDialogHeading] = useState('');
    const imageUrl = "http://localhost:3000/public/uploads";
    const [selectedImage, setSelectedImage] = useState(null);
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    // var DialogHeading = "";


    //SET THE SELECTED IMAGE TO FILE AND OPENS THE IMAGE PREVIEW
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(URL.createObjectURL(file));
            setIsImagePreviewOpen(true);
            // navigate('/chat/preview');
        }
    };
    //CLOSE THE IMAGE PREVIEW AND SET THE SELECTED IMAGE TO NULL
    const closeImagePreview = () => {
        // inputDocument.current.value = '';
        setIsImagePreviewOpen(false);
        setSelectedImage(null);

    };


    //FETCHING MESSAGES

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                console.log(chatId);
                const response = await axios.post(`http://localhost:3000/group-chat/${params?.chatId}`, {
                    chatId: chatId,
                    userId: myId,
                    groupId: groupId,
                })
                console.log(response.data);
                const { data } = response.data;
                console.log("isActive is: "+ isActive);
                setChatLog(data);
            } catch (err) {
                console.log(err);

            }
        }
        fetchMessages();
    }, [params?.chatId])
    //ADD RECEIVED MESSAGE IN CHAT LOG



    useEffect(() => {
        // console.log('first time');
        const receiveMessage = (data) => {
            if(data.chatId!==chatId && isActive){
                return;
            }
            console.log('socket -- ', data);
            if (data.type == "text") {
                const trimmedMessage = data.message.trimStart();

                setChatLog((prevChatLog) => [
                    ...prevChatLog,
                    { message: trimmedMessage, sent: false, senderId: data.id, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                ]);
            }
            else {
                console.log(data);
                setChatLog((prevChatLog) => [
                    ...prevChatLog,
                    { filename: data.filename, sent: false, senderId: data.id, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                ]);
            }

        };
        // console.log(chatLog);
        console.log(socket.id);
        socket.on('receive', receiveMessage);
        

        return () => {
            socket.off('receive', receiveMessage);
        };
    }, [socket]);


    //FUNCTION TO SEND MESSAGE ON KEY PRESS ENTER
    const handleKeyPress = (event) => {
        if (event.keyCode === 13) {
            if (!event.shiftKey) {
                event.preventDefault();
                handleSendMessage();
            } else { setMessage((prevMessage) => prevMessage + '\n'); }
        }
    };



    //FUNCTION TO SEND MESSAGE AFTER TRIMMING AND THEN EMIT THE SEND EVENT IN SOCKET
    const handleSendMessage = async () => {
        const trimmedMessage = message.trimStart();
        if (trimmedMessage === '') {
            return;
        }
        setChatLog((prevChatLog) => [
            ...prevChatLog,
            { message: trimmedMessage, sent: true, senderId: myId, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ]);
        setMessage('');
        const chatId = localStorage.getItem('currentChatId');
        const res = await axios.post("http://localhost:3000/sendmessage-group", {
            senderId: myId,
            senderName: myName,
            type: "text",
            message: trimmedMessage,
            chatId: chatId,
            groupName: groupName,
        })


    };

    //FUNCTION TO UPLOAD IMAGE ON THE DATABASE
    const upload = async () => {
        try {
            const file = inputDocument.current.files[0];
            const formData = new FormData();
            formData.append('image', file);
            formData.append('senderId', myId);
            // formData.append('receiverId', params?.id);

            const response = await axios.post('http://localhost:3000/upload', formData);
            const { filename } = response.data;
            setChatLog((prevChatLog) => [
                ...prevChatLog,
                { filename, sent: true, senderId: myId, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
            ]);
            // console.log(chatLog);

            const chatId = localStorage.getItem('currentChatId');

            const res = await axios.post("http://localhost:3000/sendmessage-group", {
                senderName: myName,
                senderId: myId,
                type: "image",
                filename: response.data.filename,
                mimetype: response.data.mimetype,
                chatId: chatId,
                groupName: groupName,

            })



            closeImagePreview();
            inputDocument.current.value = '';
            setIsHidden(!isHidden);


        } catch (err) {
            console.error('Error uploading file:', err);
        }
    }

    const handleUploadFile = () => {
        if (!isHidden) {
            setSelectedImage(null);
            inputDocument.current.value = '';
        }
        setIsHidden(!isHidden);
    }

    const handleBack = () => {
        localStorage.removeItem("currentChatId");
        localStorage.removeItem("name");
        navigate(`/main`);
    }

    const handleCreateGroup = () => {
        navigate()
    }

    const handleOpenDialog = () => {
        console.log("Dialog box is opened");
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        //set values to false here
        setAddParticipant(false);
        setRemoveParticipant(false);


        console.log("Dialog is closed");
        setIsDialogOpen(false);
    };

    const handleAddUsers = async ()=>{
        // DialogHeading = "Add participants";
        setIsDialogHeading("Add Participant");
        setAddParticipant(true);
        handleOpenDialog();

        const response = await axios.post("http://localhost:3000/participants", {
            groupId: groupId,
        })
        // console.log(response.data);
        const data = response.data;
        if (data.statusCode === 200) {
            setUsers(data.nonUserList);
            console.log(users);
        } else {
            console.log('Error:', data.message);
        }
    }
    const handleRemoveUsers = async ()=>{
        // DialogHeading = "Remove Participants";
        setRemoveParticipant(true);
        setIsDialogHeading("Remove Participant");

        handleOpenDialog();
        const response = await axios.post("http://localhost:3000/participants", {
            groupId: groupId,
        })
        const data = response.data;
        if (data.statusCode === 200) {
            setUsers(data.userList);
            console.log("data.participants are: ", ...data.userList);
            console.log( "participants are:  ", users);
        } else {
            console.log('Error:', data.message);
        }

    }

    const handleAdd = async () =>{
        try {           
            const response = await axios.post('http://localhost:3000/add-ingroup', {
                groupId: groupId,
                userIds: selectedParticipants,
                chatId: chatId,
            });
            console.log("Selected participants are: "+selectedParticipants);
            
            handleCloseDialog();
            
        } catch (err) {
            console.log("error: ", err);
        }
    }

    const handleRemove = async () =>{
        try{
            const response = await axios.post('http://localhost:3000/delete-from-group', {
                groupId: groupId,
                userIds: selectedParticipants,
            });
            console.log("Selected participants to deletee are :"+ selectedParticipants);
            handleCloseDialog();
        }catch(err){
            console.log("error: ", err);
        }
    }


    return (
        <div className="grid place-items-center content-between p-10">

            <div className="w-full md:w-9/12 lg:w-4/12 h-16  flex bg-gray-800 justify-between justify-items-center">
            <div className='flex flex-wrap'>
            <button className="text-white  text-xl" onClick={handleBack}><MdArrowBackIosNew /></button>
                <div className="relative inline-flex items-center justify-center w-10 h-10  p-1 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600 m-2 ">
                    <span className="font-medium text-gray-600 dark:text-gray-300">{upperCase(groupName.charAt(0))}</span>
                </div>
                <div >
                    <h2 className="text-xl font-semibold  text-left  text-white p-0 pt-2">{localStorage.getItem("name")}</h2>
                </div>
            </div>
                
                <div className='justify-self-end p-2 pt-5'>
                    <button className="text-white  text-xl" id='addButton' onClick={handleAddUsers}><IoIosAddCircle/></button>
                    <button className="text-white  text-xl" id='removeButton' onClick={handleRemoveUsers}><IoIosRemoveCircleOutline/></button>

                </div>
            </div>

            <div className="w-full md:w-9/12 lg:w-4/12 h-96 border-4 border-zinc-100 flex flex-col justify-between">
                <div className="flex flex-col-reverse  overflow-y-auto overflow-x-hidden h-screen custom-scrollbar custom-scrollbar:hover">
                    {chatLog.slice(0).reverse().map((chat, index) => (
                        <div key={index} className={`w-full mb-0.5 flex ${myId === chat.senderId ? 'justify-end' : (chat.type === 'info' ? 'justify-center' : 'justify-start')}`} >

                            {chat?.message && !chat?.filename && chat?.type != "info" && (
                                <div className={`px-2 py-1 rounded-lg text-lg break-all max-w-xs ${myId === chat.senderId ? ' bg-slate-600 text-white' : ' bg-zinc-300'}`} >
                                    {
                                       chat?.senderName!==myName &&(
                                        <p className='text-xsm text-left'>{chat.senderName}</p>

                                       ) 
                                    }
                                    <p className='pr-2'>{chat.message}</p>
                                    <p className='text-xsm text-right'>
                                        {chat.sentAt ? (
                                            
                                            new Date(chat.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        ) : (chat.timestamp)}
                                    </p>

                                </div>

                            )}
                            {
                                chat?.type == "info" && (
                                    <div className='flex justify-center rounded-lg bg-slate-400 p-1'>
                                        <p className='text-sm'>{chat.message}</p>
                                    </div>

                                )
                            }

                            {chat?.filename && (
                                <div className={`p-1 rounded-lg text-lg break-all max-w-xs ${myId === chat.senderId ? ' bg-slate-600 text-white' : ' bg-zinc-300'}`}>
                                    <a href={`${imageUrl}/${chat.filename}?${Date.now()}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                    { chat?.senderName!==myName &&( <p className='text-xsm text-left'>{chat.senderName}</p> ) }
                                        <img className='w-32 rounded-lg' src={`${imageUrl}/${chat.filename}?${Date.now()}`} alt="File" />
                                        {/* <p className='text-xsm text-right '>{new Date(chat.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p> */}
                                        <p className='text-xsm text-right'>
                                            {chat.sentAt ? (
                                                new Date(chat.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            ) : (chat.timestamp)}
                                        </p>
                                    </a>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {isImagePreviewOpen && (
                    <ImagePreviewModal imageUrl={selectedImage} onClose={closeImagePreview} onSend={upload} />
                )}

                {/* DIV FOR SEND IMAGE */}
                <div className={`flex bg-transparent ${isHidden ? 'hidden' : ''}`}>
                    <input type="file" ref={inputDocument} accept='image/*' onChange={handleImageChange} />
                </div>

                {/* DIV FOR SEND MESSAGE */}
                <div className="flex items-center">
                    <textarea placeholder="Type a message" value={message} className="w-full h-10 py-2 px-4 rounded-lg focus:outline-none resize-none" onChange={(e) => { setMessage(e.target.value); }} autoFocus onKeyDown={handleKeyPress} disabled={!isActive} ></textarea>
                    <button className="ml-1 px-2 py-2 text-2xl" onClick={handleUploadFile} name="attach"
                    ><GrAttachment /></button>
                    <button id="send" className=" px-2 py-2 text-2xl" onClick={handleSendMessage}>
                        <MdSend />
                    </button>
                </div>

            </div>




            {isDialogOpen && (
                <div className=" fixed inset-0 flex items-center justify-center z-50">
                    <div className=" absolute inset-0 bg-black flex items-center justify-center">
                        <div className='bg-white rounded-lg w-full md:w-9/12 lg:w-4/12 h-96 p-10'>
                          
                            <h1 className='p-1  text-xl'>{dialogHeading}</h1>
                            <form className='' 
                            // onSubmit={handleAdd}
                            onSubmit={addParticipant ? handleAdd : handleRemove}
                            >                          

                                <label className='p-1  text-xl'>Select participants</label>
                                <select multiple className="block m-2 w-96" 
                                onChange={(e) => setSelectedParticipants(Array.from(e.target.selectedOptions, (option) => option.value))}
                                 >
                                 {users.map((user, index) => (
                                        <option key={index} value={user._id}>
                                            {user.name}
                                        </option>
                                    ))}
                                   
                                </select>

                                {addParticipant && (
                            <button className="text-white bg-green-500 px-4 py-2 rounded-lg mt-4 w-20 h-10 m-2" type='submit'>Create</button>
                                )}
                                {
                                    removeParticipant && (
                                        <button className="text-white bg-green-500 px-4 py-2 rounded-lg mt-4 w-20 h-10 m-2" type='submit'>Remove</button>

                                    )
                                }


                            </form>
                            <button className="text-white bg-red-500 px-4 py-2 rounded-lg mt-4 w-20 h-10 m-2" onClick={handleCloseDialog}>Close</button>
                        </div>
                    </div>
                </div>
            )}




        </div>
    );
};

export default GroupChat;


{/* <p className='text-xsm text-right'>
  {chat.sentAt ? (
    moment(chat.sentAt).fromNow()
  ) : (
    moment(chat.timestamp, 'hh:mm A').fromNow()
  )}
</p> */}
