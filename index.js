const express=require("express")
const app=express()
const socketio=require("socket.io")
const http=require("http")
const cors=require("cors")
const { userJoin, getRoomUsers, getCurrentUser, userLeave } = require("./utils/users")
const formateMessage = require("./utils/messages")


const httpserver=http.createServer(app)
const io=socketio(httpserver)

const boatName = "ChitChat";
app.use(cors({origin:"*"}))
app.use(express.static(__dirname + '/'))

app.get('/', (req, res) => {
    // res.sendFile(__dirname + 'joinroom.html')
    console.log("running")
   res.send("Welcome")
})
var user=null
io.on('connection', (socket) => {
    console.log('Connected...')
    socket.on('message', (msg) => {
        socket.broadcast.emit('message', msg)
    })
    socket.on("joinRoom", ({ username, room }) => {


         user = userJoin(socket.id, username, room)
    
        socket.join(user.room);

        // Welcome current 
        socket.emit("message", formateMessage(boatName, "Welcome"))

        // broadcat to other users
        socket.broadcast.to(user.room).emit("message", formateMessage(boatName, `${user.username} has joined the Group`))

        //  Get all room users
        io.to(user.room).emit("roomUsers", {
            room: user.room, users: getRoomUsers(user.room)
        })

    })
    socket.on("chatMessage",(msg)=>{
        const user = getCurrentUser(socket.id)
        io.to(user.room).emit("message",formateMessage(user.username,msg))
  });
  socket.on("disconnect",()=>{
      try {
        io.to(user.room).emit("message",formateMessage(boatName,`${user.username} has left the chat`))

        //  Get all room user
        io.to(user.room).emit("roomUsers", {
          room: user.room, users: getRoomUsers(user.room)
      })  
      } catch (error) {
        console.log(error)
      }
      const user = userLeave(socket.id)


  })

})

















httpserver.listen(8000,()=>{
    console.log("server is running")
})