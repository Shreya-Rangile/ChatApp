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
import { MdArrowBackIosNew } from 'react-icons/md'

const Chat = () => {
  const myId = localStorage.getItem('Id');
  // const chatId = localStorage.getItem('currentChatId');
  const receiverName = localStorage.getItem('name');
  const inputDocument = useRef();
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const socket = useContext(SocketContext);
  const params = useParams();
  const navigate = useNavigate();
  const [isHidden, setIsHidden] = useState(true);
  const imageUrl = "http://localhost:3000/public/uploads";
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);


  //SET THE SELECTED IMAGE TO FILE AND OPENS THE IMAGE PREVIEW
  const handleFileChange = (e) => {
    const files = e.target.files;
    const urls = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(file.type);
      console.log(selectedImage);
      urls.push(URL.createObjectURL(file));

    }
    setSelectedImage(urls);
    setIsImagePreviewOpen(true);

    // setSelectedImage([URL.createObjectURL(file)]);


  };
  //CLOSE THE IMAGE PREVIEW AND SET THE SELECTED IMAGE TO NULL
  const closeImagePreview = () => {

    setIsImagePreviewOpen(false);
    setSelectedImage(null);

  };

  //USE EFFECT TO FETCH THE PREVIOUS CONVERSATION AND SET IT TO CHAT LOG WHEN USER CHANGES
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.post(`http://localhost:3000/chat/${params?.id}`, {
          senderId: myId,
          receiverId: params?.id,
        });
        const { data } = response.data;
        if (data && data.length > 0 && data[0].chatId !== undefined) {
          // console.log(data[0].chatId);
          localStorage.setItem("currentChatId", data[0].chatId);
        }
        // console.log(data);
        // console.log(localStorage.getItem("currentChatId"));
        setChatLog(data);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };
    fetchMessages();
    return () => {
      socket.emit('stopTyping', { userId: params?.id, senderId: myId });
    }
  }, [params?.id]);


  //USE EFFECT TO ADD THE RECEIVED MESSAGE IN CHAT LOG AFTER TRIMMING THE MESSAGE
  useEffect(() => {
    // console.log('first time');
    const receiveMessage = (data) => {
      // console.log(data);
      if (data.type == "text") {
        const trimmedMessage = data.message.trimStart();
        setChatLog((prevChatLog) => [
          ...prevChatLog,
          { message: trimmedMessage, sent: false, senderId: data.id, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ]);
      }
      else {
        setChatLog((prevChatLog) => [
          ...prevChatLog,
          { filename: data.filename, type: data.mimetype, sent: false, senderId: data.id, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ]);
      }

    };

    socket.on('receive', receiveMessage);

    return () => {
      socket.off('receive', receiveMessage);
    };
  }, [socket]);


  //FUNCTION TO SEND MESSAGE AFTER TRIMMING AND THEN EMIT THE SEND EVENT IN SOCKET
  const handleSendMessage = async () => {
    const trimmedMessage = message.trimStart();
    if (trimmedMessage === '') {
      return;
    }
    setChatLog((prevChatLog) => [
      ...prevChatLog,
      { message: trimmedMessage, sent: true, senderId: myId, type: "text", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setMessage('');
    // console.log(myId);
    // const timeNow=new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    // socket.emit('send', { message: trimmedMessage, receiverId: params?.id, senderId: myId, type: "text" });
    const chatId = localStorage.getItem('currentChatId');


    const res = await axios.post("http://localhost:3000/send-message", {
      receiverId: params?.id,
      senderId: myId,
      type: "text",
      message: trimmedMessage,
      chatId: chatId,
    })

    console.log(res.data.chatId);
    if(res.data.chatId){
      localStorage.setItem('currentChatId', res.data.chatId);
    }

    stopTyping();
  };

  //FUNCTION TO SEND MESSAGE ON KEY PRESS ENTER
  const handleKeyPress = (event) => {
    if (event.keyCode === 13) {
      if (!event.shiftKey) {
        event.preventDefault();
        handleSendMessage();
      } else { setMessage((prevMessage) => prevMessage + '\n'); }
    }
  };

  //HIDE THE FILE INPUT
  const handleUploadFile = () => {
    if (!isHidden) {
      setSelectedImage(null);
      inputDocument.current.value = '';
    }
    setIsHidden(!isHidden);
  }




  const upload = async (filetype) => {
    try {
      const files = inputDocument.current.files; // Retrieve all selected files
      const formData = new FormData();

      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      formData.append('senderId', myId);
      formData.append('receiverId', params?.id);

      const response = await axios.post('http://localhost:3000/upload', formData);
      const uploadedFiles = response.data.files;



      for (let i = 0; i < uploadedFiles.length; i++) {
        const { filename, mimetype } = uploadedFiles[i];

        setChatLog(prevChatLog => [
          ...prevChatLog,
          {
            filename,
            sent: true,
            senderId: myId,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: filetype
          }
        ]);

        const chatId = localStorage.getItem('currentChatId');

        await axios.post("http://localhost:3000/send-message", {
          receiverId: params?.id,
          senderId: myId,
          type: filetype,
          filename,
          mimetype,
          chatId: chatId ? chatId : null
        });
      }

      closeImagePreview();
      inputDocument.current.value = '';
      setIsHidden(!isHidden);

    } catch (err) {
      console.error('Error uploading files:', err);
    }
  };


  //TYPING INDICATOR
  useEffect(() => {
    const handleIsTyping = ({ senderId }) => {
      if (senderId !== myId) {
        // console.log("is typing");
        setIsTyping(true);
      }
    };

    const handleStopTyping = ({ senderId }) => {
      if (senderId !== myId) {
        // console.log("stopped typing");
        setIsTyping(false);
      }
    };

    socket.on('isTyping', handleIsTyping);
    socket.on('stopTyping', handleStopTyping);

    return () => {
      socket.off('isTyping', handleIsTyping);
      socket.off('stopTyping', handleStopTyping);
    };
  }, [socket]);


  const stopTyping = () => {
    socket.emit('stopTyping', { userId: params?.id, senderId: myId });
  };

  const handleTyping = () => {
    socket.emit('isTyping', { userId: params?.id, senderId: myId });
  };

  useEffect(() => {
    if (message === '') {
      stopTyping();
    }
  }, [message]);

  const handleBack = () => {
    localStorage.removeItem("currentChatId");
    localStorage.removeItem("name");
    navigate(`/main`);
  }


  return (
    <div className="grid place-items-center content-between p-10">


      <div className="w-full md:w-9/12 lg:w-4/12 h-16  flex  flex-wrap  bg-gray-800">
        <button className="text-white  text-xl" onClick={handleBack}><MdArrowBackIosNew /></button>
        <div className="relative inline-flex items-center justify-center w-10 h-10  p-1 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600 m-2 ">

          <span className="font-medium text-gray-600 dark:text-gray-300">{upperCase(receiverName.charAt(0))}</span>
        </div>
        <div >
          <h2 className="text-xl font-semibold  text-left  text-white p-0 pt-2">{localStorage.getItem("name")}</h2>
          {isTyping && <p className=' text-white text-left text-sm p-0 '>typing...</p>}
        </div>
      </div>


      <div className="w-full md:w-9/12 lg:w-4/12 h-96 border-4 border-zinc-100 flex flex-col justify-between">
        <div className="flex flex-col-reverse  overflow-y-auto overflow-x-hidden h-screen custom-scrollbar custom-scrollbar:hover">

          {
            chatLog.slice(0).reverse().map((chat, index) => (
              <div key={index} className={`w-full mb-0.5 flex ${myId === chat.senderId ? 'justify-end' : 'justify-start'}`} >

                {chat?.message && !chat?.filename && (
                  <div
                    className={`px-2 py-1 rounded-lg text-lg break-all max-w-xs ${myId === chat.senderId ? ' bg-slate-600 text-white' : ' bg-zinc-300'}`}
                  >
                    <p className='pr-4'>{chat.message}</p>

                    <p className='text-xsm text-right'>
                      {chat.sentAt ? (
                        new Date(chat.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      ) : (chat.timestamp)}
                    </p>

                  </div>

                )}

                {chat?.filename && (
                  <div className={`p-1 rounded-lg text-lg break-all max-w-xs ${myId === chat.senderId ? ' bg-slate-600 text-white' : ' bg-zinc-300'}`}>
                    {
                      chat.type.startsWith("image") && (
                        <a href={`${imageUrl}/${chat.filename}?${Date.now()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img className='w-32 rounded-lg' src={`${imageUrl}/${chat.filename}?${Date.now()}`} alt="File" />
                          {/* <p className='text-xsm text-right '>{new Date(chat.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p> */}
                          <p className='text-xsm text-right'>
                            {chat.sentAt ? (
                              new Date(chat.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            ) : (chat.timestamp)}
                          </p>

                        </a>
                      )
                    }

                    {
                      chat.type.startsWith("audio") && (
                        <audio controls>
                          <source src={`${imageUrl}/${chat.filename}?${Date.now()}`} type="audio/mpeg" />
                        </audio>
                      )
                    }

                  </div>

                )}

              </div>
            ))}
        </div>



        {isImagePreviewOpen && (
          <ImagePreviewModal imageUrls={selectedImage} onClose={closeImagePreview} onSend={(filetype) => upload("image")} />
        )}


        {/* DIV FOR SEND IMAGE */}
        <div className={`flex bg-transparent ${isHidden ? 'hidden' : ''}`}>
          <input type="file" ref={inputDocument} accept='image/* , .txt, .csv, .xls, .xlsx, .pdf, .doc, .docx, video/*, audio/*' onChange={handleFileChange} multiple />
          <button onClick={(filetype) => upload("audio")} className=" px-2 py-2 text-2xl" > <MdSend /> </button>
        </div>

        {/* DIV FOR SEND MESSAGE */}
        <div className="flex items-center">
          <textarea

            placeholder="Type a message" value={message} onChange={(e) => { setMessage(e.target.value); handleTyping(); }} onKeyDown={handleKeyPress} className="w-full h-10 py-2 px-4 rounded-lg focus:outline-none resize-none" autoFocus
          ></textarea>
          <button className="ml-1 px-2 py-2 text-2xl" onClick={handleUploadFile} name="attach"
          ><GrAttachment /></button>
          <button id="send" onClick={handleSendMessage} className=" px-2 py-2 text-2xl" > <MdSend /> </button>
        </div>

      </div>
    </div>
  );
};

export default Chat;
