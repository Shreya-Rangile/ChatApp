const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const zlib = require('zlib');
const { Server } = require("socket.io");
const { createServer } = require("http");
const multer = require("multer");
var cors = require('cors');

const app = express();
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/public", express.static("public"));
app.use("/public/uploads", express.static("public/uploads"));

//MONGOOSE 
mongoose.connect("mongodb://localhost:27017/usersDB", { useNewUrlParser: true });

const http = require('http');
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
});

//---------USER---------
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  contact: String,
  dob: Date,
  password: String,
  createdAt: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false }
});

//BEFORE SAVE THE USER IN DATABASE, ENCRYPT THE PASSWORD
userSchema.pre('save', async function (next) {
  const user = this;
  if (!user.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);
    user.password = hashedPassword;
    next();
  } catch (error) {
    return next(error);
  }
});
const User = mongoose.model("User", userSchema);

//---------GROUP---------
const groupSchema = new mongoose.Schema({
  name: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Group = mongoose.model("Group", groupSchema);

//---------CHAT---------
const chatSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.ObjectId,
    ref: User
  },
  receiverId: {
    type: mongoose.Schema.ObjectId,
    ref: User
  },
  groupId: {
    type: mongoose.Schema.ObjectId,
    ref: Group
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastMessage: String,
  chatType: { type: String, default: "individual" },
  groupName: String,
});

const Chat = mongoose.model("Chat", chatSchema);

//---------MESSAGE---------
const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.ObjectId,
    ref: User
  },
  receiverId: {
    type: mongoose.Schema.ObjectId,
    ref: User
  },
  chatId: {
    type: mongoose.Schema.ObjectId,
    ref: Chat
  },
  message: String,
  sentAt: { type: Date, default: Date.now },
  type: { type: String, default: "text" },
  filename: String,
  isRead: { type: Boolean, default: false },
  senderName: String,
});

const Message = mongoose.model("Message", messageSchema);

//---------GROUP PARTICIPANT---------
const groupParticipantSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: User
  },
  groupId: {
    type: mongoose.Schema.ObjectId,
    ref: Group
  },
  isAdmin: { type: Boolean, default: false },
  isActive: {type: Boolean, default: true}
});

const GroupParticipant = mongoose.model("GroupParticipant", groupParticipantSchema);


let socket_io = {};
// let socket_io  = io;
//SERVER SIDE SOCKET
let sender;
io.on("connection", (socket) => {
  console.log('NEW USER -- ', socket.id)
  // SOCKET SETUP PROCESS
  socket.on('set-up', async (permanentId) => {
    socket.join(permanentId);
    socket.emit('connected');
    socket_io[permanentId] = socket
    sender = permanentId;
    // console.log("permanent id is: "+ permanentId);
    // console.log("permanent id type is: " +  typeof permanentId);

    await User.findByIdAndUpdate({ _id: permanentId }, { $set: { isOnline: true } });
    io.emit("userStatusChange", { userId: permanentId, isOnline: true });
    // socket.emit("userStatusChange", { userId: permanentId, isOnline: true });


    //JOIN TO ROOM FUNCTION CALL -- WRITE LOGIC HERE
    const list = await GroupParticipant.find({ userId: permanentId, isActive: true }).populate("groupId");
    // console.log(list);
    for (const i of list) {
      const groupId = i.groupId;
      // console.log(groupId.name);
      groupName = groupId.name;
      socket.join(groupName);
    }

  });
  // socket_io = socket;

  //SEND EVENT 
  socket.on('send', (data) => {

  });

  //ON LOGOUT SET THE USER AS OFFLINE
  socket.on("logout", async function () {
    if (sender) {
      console.log("sender is when logout: "+ sender);
      console.log("user logged out");
      await User.findByIdAndUpdate({ _id: sender.toString() }, { $set: { isOnline: false } });
      io.emit("userStatusChange", { userId: sender.toString(), isOnline: false });
    }

  });
  //ON DISCONNECT SET THE USER AS OFFLINE
  socket.on("disconnect", async function () {
    console.log('user disconnected');
    if (sender) {
      console.log("sender is when disconnect: "+ sender);

      await User.findByIdAndUpdate({ _id: sender.toString() }, { $set: { isOnline: false } });
      io.emit("userStatusChange", { userId: sender.toString(), isOnline: false });
    }
  });

  socket.on('isTyping', ({ userId, senderId }) => {
    socket.to(userId).emit('isTyping', { senderId });
  });

  socket.on('stopTyping', ({ userId, senderId }) => {
    socket.to(userId).emit('stopTyping', { senderId });
  });

});


//MULTER SETUP
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = file.originalname.split(".").pop();
    // cb(null, Date.now() + "-" + file.originalname)
    cb(null, uniqueSuffix + "." + fileExtension);
  }
});

const upload = multer({ storage: storage });


//SERVER SIDE API
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/Index.html");
});

app.get("/login.html", function (req, res) {
  res.sendFile(__dirname + "/login.html");
});

app.get("/signup.html", function (req, res) {
  res.sendFile(__dirname + "/signup.html");
});

//API TO REGISTER A USER
app.route("/users")
  .get(async function (req, res) {
    try {
      const users = await User.find({}).select('-password -__v');
      return res.send({ statusCode: 200, message: 'success', data: users });
    } catch (err) {
      console.log(err);
    }
  })
  .post(async function (req, res) {
    var Name = req.body.name;
    var email = req.body.email;
    var dob = req.body.dob;
    var contactNo = req.body.contact;
    var userPassword = req.body.password;
    // console.log(Name);
    const existingUser = await User.findOne({
      email: email
    });
    if (existingUser) {
      return res.send("User already exists!");
    }
    const user = new User({
      name: Name,
      email: email,
      dob: dob,
      contact: contactNo,
      password: userPassword
    });
    try {
      await user.save();
      res.send("User created successfully!");
    } catch (err) {
      console.log(err);
      res.status(500).send("An error occurred.");
    }
  });

//SERVER SIDE API TO GET, PATCH, POST A PARTICULAR USER
app.route("/users/:id")
  .get(async function (req, res) {
    var userId = req.params.id;
    try {
      const user = await User.findOne({ _id: userId }).select('-password -__v');
      if (user) {
        return res.send({ statusCode: 200, message: 'success', data: user })
      } else {
        res.send("User not found");
      }
    } catch (err) {
      console.log(err);
      res.status(500).send("An error occurred.");
    }
  })
  .patch(async function (req, res) {
    const userId = req.params.id;
    const { name, email, contact, dob } = req.body;
    if (req.body.password) {
      res.status(422).send("Password is not accepted while updating")
    }
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          name, email, contact, dob
        }
      ).select('-password');
      if (!updatedUser) {
        return res.status(404).send("User not found");
      }
      res.send(updatedUser);
    } catch (err) {
      console.log(err);
      res.status(500).send("An error occurred.");
    }
  })
  .delete(async function (req, res) {
    var userId = req.params.id;
    try {
      const deletedUser = await User.findByIdAndDelete(userId).select('-password -__v');

      console.log("Deleted");

      if (!deletedUser) { return res.status(404).send("User not found"); }
      res.send(deletedUser);
    }
    catch (err) {
      console.log(err);
      res.status(500).send("An error occurred.");
    }
  });

httpServer.listen(3000, () => {
  console.log('server running on 3000')
})


// LOGIN API
app.post('/users/login', async function (req, res, next) {
  User.find({ email: req.body.email }).exec().then(user => {
    if (user.length < 1) {
      return res.status(401).send("User does not exist");
    }
    bcrypt.compare(req.body.password, user[0].password, (err, result) => {
      if (err) {
        return res.status(500).send("An error occurred.");
      }
      if (!result) {
        return res.status(401).send("Password does not match");
      }
      const token = jwt.sign({
        ID: user[0]._id,
        email: user[0].email
      },
        'Dummy text',
        {
          expiresIn: "24h"
        });
      res.status(200).json({
        id: user[0]._id,
        email: user[0].email,
        token: token,
        name: user[0].name,
      });
    });
  }).catch(err => {
    res.status(500).send("An error occurred.");
  });
});

//API TO DISPLAY A LIST OF ALL THE USERS IN DATABASE WITH A POST REQUEST
app.route("/users-list")
  .post(async function (req, res) {
    const currentUser = req.body.id;
    try {
      const users = await User.find({ _id: { $ne: currentUser } }).select('-password -__v -dob -email');
      return res.send({ statusCode: 200, message: 'success', data: users });

    }
    catch (err) {
      console.log(err);
      return res.status(500).send({ statusCode: 500, message: 'Internal server error' });

    }
  });

//API TO SHOW ALL THE PREVIOUS CONVERSATIONS ON CHAT SCREEN
app.route("/chat/:id")
  .post(async function (req, res) {
    const { senderId, receiverId } = req.body;
    try {
      const messages = await Message.find({
        $or: [
          { senderId: senderId, receiverId: receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }).sort({ sentAt: 1 });
      // console.log("messages retrieved");
      await Message.updateMany(
        {
          senderId: receiverId,
          receiverId: senderId,
          isRead: false
        },
        {
          isRead: true
        }
      );
      return res.send({ statusCode: 200, message: 'success', data: messages });
    } catch (err) {
      console.log(err);
      return res.status(500).send({ statusCode: 500, message: 'Internal server error' });
    }
  });

//API TO UPLOAD IMAGES
app.route("/upload")
  .post(upload.array("files", 10), function (req, res) {
    try {
      const uploadedFiles = req.files.map(file => ({
        filename: file.filename,
        mimetype: file.mimetype
      }));

      return res.status(200).send({ statusCode: 200, files: uploadedFiles });
      // return res.status(200).send({ statusCode: 200, filename: req.file.filename, mimetype: req.file.mimetype });
    } catch (err) {
      return res.status(500).send({ statusCode: 500, message: 'Internal server error' });
    }
  });

//API TO SEND MESSAGES AND STORE IT INTO DATABASE
app.route("/send-message")
  .post(async function (req, res) {
    const data = req.body;
    try {
      //IF CHATID EXISTS
      if (data.chatId) {


        //CREATE MESSAGE
        if (data.type == "text") {
          const message = new Message({
            senderId: data.senderId,
            receiverId: data.receiverId,
            message: data.message,
            chatId: data.chatId
          });
          try {
            await message.save();
          } catch (err) {
            console.log(err);
          }
        } else if (data.type == "image") {
          const message = new Message({
            senderId: data.senderId,
            receiverId: data.receiverId,
            type: data.mimetype,
            filename: data.filename,
            chatId: data.chatId
          });
          try {
            await message.save();
          } catch (err) {
            console.log(err);
          }
        }
        // else if (data.type =="audio") {
        //   const message = new Message({
        //     senderId: data.senderId,
        //     receiverId: data.receiverId,
        //     type: data.mimetype,
        //     filename: data.filename,
        //     chatId: newChat._id
        //   });
        //   try {
        //     await message.save();
        //   } catch (err) {
        //     console.log(err);
        //   }
        // }
        //EMIT THE SOCKET RECEIVE EVENT
        socket_io[data.senderId].to(data.receiverId).emit('receive', data);

        //UPDATE THE CHAT BETWEEN USERS
        await Chat.updateOne({
          _id: data.chatId
        }, {
          $set: {
            updatedAt: Date.now(),
            lastMessage: data.message
          }
        })

        return res.status(200).send({ message: "Chat updated successfully" });
      }


      //CREATE A CHAT IF  CHATID DOESNOT EXISTS

      const newChat = new Chat({
        senderId: data.senderId,
        receiverId: data.receiverId,
        lastMessage: data.message,
        // updatedAt: Date.now()
      })
      await newChat.save();

      //IF CHAT ID DOES NOT EXISTS THEN CREATE MESSAGE
      if (data.type == "text") {
        const message = new Message({
          senderId: data.senderId,
          receiverId: data.receiverId,
          message: data.message,
          chatId: newChat._id
        });
        try {
          await message.save();
        } catch (err) {
          console.log(err);
        }
      } else if (data.type === "image") {
        const message = new Message({
          senderId: data.senderId,
          receiverId: data.receiverId,
          type: data.mimetype,
          filename: data.filename,
          chatId: newChat._id
        });
        try {
          await message.save();
        } catch (err) {
          console.log(err);
        }
      }

      //  else if (data.type ==="audio") {
      //   const message = new Message({
      //     senderId: data.senderId,
      //     receiverId: data.receiverId,
      //     type: data.mimetype,
      //     filename: data.filename,
      //     chatId: newChat._id
      //   });
      //   try {
      //     await message.save();
      //   } catch (err) {
      //     console.log(err);
      //   }
      // }

      //EMIT THE SOCKET RECEIVE EVENT
      socket_io[data.senderId].to(data.receiverId).emit('receive', data);
      // socket_io.to(data.receiverId).emit('receive', data);


      return res.status(200).send({ chatId: newChat._id, message: "Chat created successfully" });
    } catch (err) {
      console.log(err);
      return res.status(500).send("Failed");
    }

  })


//API TO DISPLAY USERS WITH WHOM CHAT EXISTS
app.route("/chat-list")
  .post(async function (req, res) {
    const currentUser = req.body.id;
    // console.log("current user in chatList is: "+currentUser)
    try {
      const chats = await Chat.find({
        $or: [
          { senderId: currentUser },
          { receiverId: currentUser }
        ]
      })
        .populate('senderId', 'name isOnline').populate('receiverId', 'name isOnline').exec();
      // console.log(chats);
      // console.log("chatList[0]: "+chats[1].senderId._id);
      // console.log("currentUser type is: "+ typeof currentUser);
      const chatList = chats.map(chat => ({
        name: chat.senderId._id.toString() !== currentUser ? chat.senderId.name : chat.receiverId.name,
        id: chat.senderId._id.toString() !== currentUser ? chat.senderId._id : chat.receiverId._id,
        isOnline: chat.senderId._id.toString() !== currentUser ? chat.senderId.isOnline : chat.receiverId.isOnline,
        chatId: chat._id,
        lastMessage: chat.lastMessage,
        updatedAt: chat.updatedAt,
        // isOnline: chat.senderId.isOnline
      }));

      chatList.sort((a, b) => b.updatedAt - a.updatedAt);

      return res.status(200).send({ statusCode: 200, message: "success", data: chatList, chats: chats });
      // return res.status(200).send({statusCode: 200, message: "success", chats: chats});

    } catch (err) {
      console.log(err);
      return res.status(500).send({ statusCode: 500, message: "Internal Server Error" });
    }
  });


//API TO CREATE A GROUP AND ADD PARTICIPANTS TO IT
app.route("/add-participant")
  .post(async function (req, res) {

    //REQUIRED FIELDS ARE: GROUPNAME, USERIDS
    // console.log(req.body);
    const { groupName, userIds } = req.body;
    const newGroup = new Group({
      name: groupName,
    });

    try {
      await newGroup.save();
      const groupId = newGroup._id;

      const newChat = new Chat({
        // senderId: userIds[0],
        groupId: groupId,
        groupName: groupName,
        chatType: "group",
        lastMessage: "New group " + groupName + " is created!",
      });
      await newChat.save();
      // console.log("New chat id is: " + newChat._id);
      const currentChat = newChat._id;
      const totalUsers = userIds.length;
      for (let i = 0; i < totalUsers; i++) {
        const newGroupParticipant = new GroupParticipant({
          userId: new ObjectId(userIds[i]),
          groupId: groupId,
        });
        await newGroupParticipant.save();

        const lastUserJoined = await User.findOne({ _id: userIds[i] }, 'name');
        const newMessage = new Message({
          chatId: currentChat,
          message: lastUserJoined.name + " joined the chat!",
          type: "info"
        });
        await newMessage.save();

        if (i == totalUsers - 1) {
          await Chat.findByIdAndUpdate({ _id: currentChat }, { $set: { lastMessage: lastUserJoined.name + " joined the chat!" } });
        }
      }
      return res.status(200).send("Group created successfully");

    } catch (err) {
      console.log(err);
      return res.status(500).send("Internal server error");
    }
  });

//API TO ADD PARTICIPANTS IN EXISTING GROUP
app.route("/add-ingroup")
  .post(async function (req, res) {
    //REQUIRED FIELDS ARE: GROUPID, USERIDS, CHATID
    const { groupId, userIds, chatId } = req.body;
    try {
      const totalUsers = userIds.length;
      for (let i = 0; i < totalUsers; i++) {
        const exists = await GroupParticipant.findOne({ userId: userIds[i], groupId: groupId });
        if(exists){
          if(exists.isActive=='true'){
            console.log("this user already exists in this group");  
            continue;
          }else{
            await GroupParticipant.findByIdAndUpdate(exists._id, {$set: {isActive: true, updatedAt: Date.now()}});
            continue;
          }
          
        }
        const newGroupParticipant = new GroupParticipant({
          userId: userIds[i],
          groupId: groupId
        });
        await newGroupParticipant.save();

        const lastUserJoined = await User.findById(userIds[i], 'name');
        const newMessage = new Message({
          chatId: chatId,
          message: lastUserJoined.name + " joined the chat!",
          type: "info"
        });
        await newMessage.save();

        if (i === totalUsers - 1) {
          await Chat.findByIdAndUpdate(chatId, { $set: { lastMessage: lastUserJoined.name + " joined the chat!" } });
        }
      }
      return res.status(200).send("Added successfully");
    } catch (err) {
      return res.status(500).send("Internal server error");
    }
  });

app.route("/group-list")
  .post(async function (req, res) {
    const currentUser = req.body.id;
    // console.log("current user is: "+ currentUser);
    try {
      const groupList = await GroupParticipant.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(currentUser)
          }
        },
        {
          $lookup: {
            from: "groups",
            localField: "groupId",
            foreignField: "_id",
            as: "group",
          }
        },
        {
          $unwind: "$group"
        },
        {
          $lookup: {
            from: "chats",
            localField: "group._id",
            foreignField: "groupId",
            as: "chat",
          }
        },
        {
          $unwind: "$chat"
        },
        {

          $project: {
            "group._id": 0,
            "group.__v": 0,
            // "chat._id": 0,
            "chat.__v": 0
          }

        }, {
          $sort: { "chat.updatedAt": -1 }
        }
      ])
      // console.log(groupList);
      return res.status(200).send({ statusCode: 200, groupList: groupList });

    } catch (err) {
      console.log(err);
      return res.status(500).send({ statusCode: 500, message: "Internal Server Error" });

    }
  })


app.route("/sendmessage-group")
  .post(async function (req, res) {

    const data = req.body;

    //REQUIRED FIELDS IN BODY: SENDERiD, SENDERnAME, MESSAGE, CHATiD, TYPE,      MIMETYPE, FILENAME

    try {

      //CREATE MESSAGE
      if (data.type == "text") {
        const message = new Message({
          senderId: data.senderId,
          senderName: data.senderName,
          message: data.message,
          chatId: data.chatId
        });
        try {
          console.log(data.type + " is sent")
          await message.save();
        } catch (err) {
          console.log(err);
        }
      } else if (data.type == "image") {
        const message = new Message({
          senderId: data.senderId,
          senderName: data.senderName,
          type: data.type,
          filename: data.filename,
          chatId: data.chatId
        });
        try {
          console.log(data.type + " is sent")
          await message.save();
        } catch (err) {
          console.log(err);
        }
      }

      socket_io[data.senderId].to(data.groupName).emit('receive', data);
      // console.log(data.groupName);
      // const clients = io.sockets.adapter.rooms.get(data.groupName);
      // console.log(clients);
      // io.to(data.groupName).emit('receive', data);

      await Chat.updateOne({
        _id: data.chatId
      }, {
        $set: {
          updatedAt: Date.now(),
          lastMessage: data.message
        }
      })
      // socket_io.broadcast(data.groupName).emit('receive', data);

      return res.status(200).send({ message: "Message Sent" });

    } catch (err) {
      console.log(err);
      return res.status(500).send({ statusCode: 500, message: "Internal Server error" });
    }
  });

app.route("/group-chat/:chatId")
  .post(async function (req, res) {

    //ADDED USERID
    const { chatId, userId, groupId } = req.body;

    try {
      // const {created, updated, isActive} = await GroupParticipant.findOne({userId: userId}, {createdAt: 1, updatedAt: 1, isActive: 1});
      const groupParticipant = await GroupParticipant.findOne(
        { userId: userId, groupId: groupId},
        { createdAt: 1, updatedAt: 1, isActive: 1 }
      );

      if (!groupParticipant) {
        return res.status(404).send({
          statusCode: 404,
          message: 'Group participant not found',
        });
      }

      const { createdAt, updatedAt, isActive } = groupParticipant;

      let messages;
      if(isActive){
        // const messages = await Message.find({ chatId: chatId }).sort({ sentAt: 1 });
        const messages = await Message.find({
          chatId: chatId,
          sentAt: { $gte: createdAt}
        }).sort({ sentAt: 1 });

        // console.log(messages);
        return res.status(200).send({ statusCode: 200, message: 'success', data: messages });

      }else{
        const messages = await Message.find({
          chatId: chatId,
          sentAt: { $gte: createdAt, $lte: updatedAt }
        }).sort({ sentAt: 1 });

        // console.log(messages);
        return res.status(200).send({ statusCode: 200, message: 'success', data: messages });
      }

    } catch (err) {
      console.log(err);
      return res.status(500).send({ statusCode: 500, message: 'Internal server error' });

    }
  })


  app.route("/participants")
  .post(async function(req, res){
    const {groupId} = req.body;
    try{
      const participants = await GroupParticipant.find({groupId: groupId, isActive: true}, {userId: 1, _id: 0});
      const participantIds = participants.map(participant => participant.userId);
      const nonUserList = await User.find({ _id: { $nin: participantIds} }, {_id: 1, name: 1});
      const userList = await User.find({ _id: { $in: participantIds}}, {_id: 1, name: 1});

      return res.status(200).send({statusCode: 200, nonUserList, userList});

    }catch(err){
      console.log(err);
      return res.status(500).send({ statusCode: 500, message: 'Internal server error' });
    }

  })

  app.route("/delete-from-group")
  .post(async function(req, res){
    //GROUPID , USERIDS
    const {groupId, userIds} = req.body; 
    try{
      const totalUsers = userIds.length;
      for(let i=0; i<totalUsers; i++){
        await GroupParticipant.findOneAndUpdate({groupId: groupId, userId: userIds[i]}, {$set: {isActive: false, updatedAt: Date.now()}});        
      }
    }catch(err){
      console.log(err);
      return res.status(500).send("Internal server error");
    }
  })


 


