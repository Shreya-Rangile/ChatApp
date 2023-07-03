import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { capitalCase, upperCase } from "text-case";
import axios from 'axios';
import { FiMenu } from 'react-icons/fi';


const GroupList = () => {
    const [groupName, setGroupName] = useState("");
    const [groups, setGroups] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedParticipants, setSelectedParticipants] = useState([]);


    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const navigate = useNavigate();
    const myId = localStorage.getItem('Id');
    useEffect(() => {
        fetchGroupList();
    }, []);

    const fetchGroupList = async () => {
        try {
            const response = await axios.post('http://localhost:3000/group-list', {
                id: localStorage.getItem("Id")
            });
            const data = response.data;
            console.log(response.data);
            if (data.statusCode === 200) {
                setGroups(data.groupList);
                // console.log(data.groupList);
            } else {
                console.log('Error: ', data.message);
            }

        } catch (err) {
            console.log("error: ", err);
        }
    }

    const handleOpenChat = (groupName, chatId, groupId, isActive) => {
        localStorage.setItem("name", groupName);
        localStorage.setItem("currentChatId", chatId);
        localStorage.setItem("groupId", groupId);
        localStorage.setItem("isActive", isActive);
        navigate(`/group-chat/${chatId}`);
    };

    const handleOpenDialog = () => {
        fetchUsers();
        console.log("Dialog box is opened");
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        console.log("Dialog is closed");
        setIsDialogOpen(false);
    };


    const handleSubmit = async () => {
        try {
            const participantsWithMyId = [myId, ...selectedParticipants];
            const response = await axios.post('http://localhost:3000/add-participant', {
                groupName: groupName,
                userIds: participantsWithMyId,
            });
            console.log("Selected participants are: "+selectedParticipants);
            console.log("Selected participants along with me are: "+participantsWithMyId);
            handleCloseDialog();
            
        } catch (err) {
            console.log("error: ", err);
        }
    }


    const fetchUsers = async () => {
        try {

            const response = await axios.post('http://localhost:3000/users-list', {
                id: localStorage.getItem("Id")
            });
            const data = response.data;

            if (data.statusCode === 200) {
                setUsers(data.data);
            } else {
                console.log('Error:', data.message);
            }

        } catch (err) {
            console.log('Error:', err);

        }
    }

    return (

        <div className=" grid place-items-center content-between p-10">
            <div className='w-96 text-slate-200 bg-gray-800'>

                <h1 className="text-xl font-semibold text-center ">Group List</h1>
                {/* <button><FiMenu/></button> */}
            </div>
            <ul className="w-96 border-4 border-zinc-100">
                {groups.map((group, index) => (
                    <li className="w-full border-b border-neutral-200  py-4  flex flex-wrap hover:bg-zinc-100 hover:cursor-pointer" key={index}
                        onClick={() => handleOpenChat(group.group.name, group.chat._id, group.groupId, group.isActive)}>
                        <div className="relative inline-flex items-center justify-center w-10 h-10  p-1 overflow-visible bg-gray-100 rounded-full dark:bg-gray-600 m-2 ">
                            <span className="font-medium text-gray-600 dark:text-gray-300">{upperCase(group.group.name.charAt(0))}</span>

                        </div>
                        <ul>
                            <li className='text-xl'>{group.group.name}</li>
                            {group.isActive && (
                                <div>
                                <li className='text-sm'>{group.chat.lastMessage}</li>
                            <li className='text-sm text-gray-500'>
                             {new Date(group.chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </li>


                                </div>
                              

                            )}

                            {!group.isActive && (
                                <li className='text-sm text-gray-500'>You were removed</li>
                            )}
                            
                        </ul>
                    </li>
                ))}
            </ul>


            <div className="relative left-40 inline-flex items-end justify-center w-10 h-10  p-1 overflow-visible  rounded-full bg-gray-800 m-2 ">
                <button className='text-2xl text-white' onClick={handleOpenDialog}>+</button>
            </div>

            {isDialogOpen && (
                <div className=" fixed inset-0 flex items-center justify-center z-50">
                    <div className=" absolute inset-0 bg-black flex items-center justify-center">


                        <div className='bg-white rounded-lg w-full md:w-9/12 lg:w-4/12 h-96 p-10'>


                            <h1 className='p-1  text-xl'>Create a group</h1>
                            <form className='' onSubmit={handleSubmit}>
                                {/* <input className='block border-2' type='text' placeholder='Group Name' /> */}


                                <input className="block border-2" type="text" placeholder="Group Name" value={groupName} onChange={(e) => setGroupName(e.target.value)} required/>

                                <label className='p-1  text-xl'>Select participants</label>

                                


                                <select multiple className="block m-2 w-96" onChange={(e) => setSelectedParticipants(Array.from(e.target.selectedOptions, (option) => option.value))} >
                                    {users.map((user, index) => (
                                        <option key={index} value={user._id}>
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
                            <button className="text-white bg-green-500 px-4 py-2 rounded-lg mt-4 w-20 h-10 m-2" type='submit'>Create</button>


                            </form>
                            <button className="text-white bg-red-500 px-4 py-2 rounded-lg mt-4 w-20 h-10 m-2" onClick={handleCloseDialog}>Close</button>
                        </div>
                    </div>
                </div>
            )}



        </div>
    )

}

export default GroupList;