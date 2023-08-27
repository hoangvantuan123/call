const express = require('express')
const app = express()
const server = require('http').Server(app)
const socketIo = require("socket.io");
const cors = require("cors");
// Khởi tạo Socket.io với Cors
const io = socketIo(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });
const { v4: uuidV4 } = require('uuid')
app.use(cors());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.set('view engine', 'ejs')
app.use(express.static('public'))




app.get('/', (req, res) => {
 
})
io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
      socket.join(roomId)
      socket.to(roomId).emit('user-connected', userId); // Chỉnh lại đây
  
      socket.on('disconnect', () => {
        socket.to(roomId).emit('user-disconnected', userId); // Chỉnh lại đây
      })
    })
  })
  

server.listen(5000)