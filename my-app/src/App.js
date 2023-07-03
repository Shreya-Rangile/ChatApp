import React from 'react';
import './App.css'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import UserList from './pages/UserList';
import Chat from './pages/Chat';
import GroupChat from './pages/GroupChat';
import Logout from './pages/Logout';
import ChatList from './pages/ChatList';
import GroupList from './pages/GroupList';
import ImagePreviewModal from './pages/ImagePreview';
import { SocketContext, socket } from './UserSocket';
import MainComponent from './pages/Main';

function App() {

    return (
    <Router>
      <div>
        <nav className="bg-gray-800 space-x-4 h-9 text-slate-400 pt-1">
              <Link to="/users/login" className='p-3' >Login</Link>
              <Link to="/users" className='p-3' >Register</Link>
              <Link to="/logout" className='p-3' >Logout</Link>

        </nav>
          <SocketContext.Provider value={socket}>
          <Routes>
            <Route path="/users/login" element={<Login />} />
              <Route path="/users" element={<Register />} />
              <Route path="/users-list" element={<UserList />} /> 
              <Route path="/main" element={<MainComponent />} /> 
              <Route path="/chat/:id" element={<Chat />} /> 
              <Route path="/group-chat/:chatId" element={<GroupChat />} /> 
              <Route path="/logout" element={<Logout />} /> 
              <Route path="/chat-list" element={<ChatList />} /> 
              <Route path="/group-list" element={<GroupList />} /> 

              
          </Routes>
          </SocketContext.Provider>
      </div>
    </Router>
  );

}

export default App;







