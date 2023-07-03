import React, {useState} from 'react';
import UserList from './UserList';
import ChatList from './ChatList';
import GroupList from './GroupList';

const MainComponent = () =>{
    return(
        <div className="grid grid-cols-3 h-screen">
      <div className="col-span-1">       
        <UserList />
      </div>
      <div className="col-span-1">      
        <ChatList />
      </div>
      <div className="col-span-1">      
        <GroupList />
      </div>
      </div>
    );
};

export default MainComponent;