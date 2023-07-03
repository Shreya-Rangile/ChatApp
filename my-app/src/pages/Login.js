import React, { useState, useContext} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { SocketContext } from '../UserSocket';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const socket = useContext(SocketContext)

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };
  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };
  const handleLogin = async () => {
    
    try {
      const response = await axios.post('http://localhost:3000/users/login', {
        email: email,
        password: password,
      });
      console.log(response.data.id);
      // console.log(response.data.token);
      // const { id, token } = response.data;
      
      // localStorage.setItem('Id', id);
      // localStorage.setItem('Token',token);

      localStorage.setItem('Id', response.data.id);
      localStorage.setItem('Token', response.data.token);
      localStorage.setItem('senderName', response.data.name);
     
      // navigate(`/users-list`);
      navigate(`/main`);
      // window.location.href = '/users-list';
    } catch (error) {
      console.error(error);
    }
  };
  const handleKeyPress = (event) => {
    if (event.keyCode === 13) {
      handleLogin();
    }
  };
  const handleNewRegister = async () => {
    navigate(`/users`);
    // window.location.href = '/users';    
  };

  return (
    <div className="grid h-screen place-items-center">
      
      <div >
      <div className="flex items-center justify-center">
</div>
     
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" >
  <h2 className="text-center text-xl">Login</h2>

        <div className="mb-4">
          <label className="block text-gray-700 text-lg font-bold mb-2" htmlFor="username">Email:</label>
          <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="email"
           value={email} 
          onChange={handleEmailChange} 
          name='email' id='email'
          />
          
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-lg font-bold mb-2" htmlFor="password">Password:</label>
          <input className="shadow appearance-none border  rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" type="password" 
          value={password}
           onChange={handlePasswordChange}
           name="password" id="password"
           onKeyDown={handleKeyPress}
            />
        </div>

        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline m-2" type="button" onClick={(e) => {handleLogin()}}>Login</button>          
         <br/>
         <br/>
        <p className="text-indigo-400">Don't have an account? Register Now!</p>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline m-2" type="button" onClick={(e) => {handleNewRegister()}}>Register</button>        
        
      </div>
      </div>
    </div>
  );
}

export default Login;


