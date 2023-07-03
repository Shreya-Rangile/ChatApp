import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// import Login from './Login';

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  // const [emailExists, setEmailExists] = useState(false);

  const handleNameChange = (event) => {
    setName(event.target.value);
  };
  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };
  // const handleEmailChange = async (event) => {
  //   const newEmail = event.target.value;
  //   setEmail(newEmail);
  //   try {
  //     const response = await axios.get(`http://localhost:3000/users/check-email?email=${newEmail}`);
  //     setEmailExists(response.data.exists);
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };
  const handleContactChange = (event) => {
    setContact(event.target.value);
  };
  const handleDOBChange = (event) => {
    setDob(event.target.value);
  };
  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };


  const handleRegister = async () => {


    if (!name || !email || !contact || !dob || !password) {
      // Check if any required field is empty
      console.log('Please fill all fields');
      return;
    }
    try {
      const response = await axios.post('http://localhost:3000/users', {
      name: name,
      email: email,
      contact: contact,
      dob: dob,
      password: password,
      });
      // console.log(response.data);
      navigate(`/users/login`);
      // window.location.href = '/users/login';
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="grid h-screen place-items-center">     
      <div >
      <div className="flex items-center justify-center">
  <h2 className="text-center">Register</h2>
</div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Name</label>
          <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text"
           value={name} 
          onChange={handleNameChange}
          required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email:</label>
          <input type="email" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
           value={email} 
          onChange={handleEmailChange}
          required          
          />
          {/* {emailExists && <p className="text-red-500 text-xs italic">Email already exists.</p>} */}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contact">Contact:</label>
          <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text"
           value={contact} 
          onChange={handleContactChange}
          required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dob">DOB:</label>
          <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="date"
           value={dob} 
          onChange={handleDOBChange}
          required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password:</label>
          <input className="shadow appearance-none border  rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" type="password"
            value={password} 
          onChange={handlePasswordChange}
          required
            />
        </div>
        <div className="flex items-center justify-between">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit"  onClick={(e) => {handleRegister()}}>Register</button>         
        </div>

      </div>
    </div>
  );
}

export default Register;
