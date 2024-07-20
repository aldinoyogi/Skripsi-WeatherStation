// const express = require('express');
// const app = express();
// const http = require('http');
// const server = http.createServer(app);
// const { Server } = require("socket.io");


const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
// const app = express();
// const server = require('http').Server(app);
const port = process.env.PORT || 3000;

// const io = require('socket.io')(server, {
//   cors: {
//     methods: ["GET", "POST"],
//     origin: "*"
//   }
// });


const path = require('path');



// const admin = require("firebase-admin");
// const serviceAccount = require("./weather-station.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://weathercast-3d11e-default-rtdb.asia-southeast1.firebasedatabase.app"
// });



app.use(express.static(path.join(__dirname + '/public')));
app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname + '/public/index.html'));
});


const sockets = {};

// const realtime_db = admin.database();
// realtime_db.ref("Weather_Station_A/realtime").on("value", (snapshot) => {
//   const data = snapshot.val();
//   Object.keys(sockets).forEach((key) => {
//     const socket = sockets[key];
//     const message = {
//       type: 'realtime',
//       data
//     }
//     socket.emit("data", message);
//   })
// });

io.on('connection', (socket) => {
  sockets[socket.id] = socket;
  // realtime_db.ref("Weather_Station_A/realtime").get().then((snapshot) => {
  //   if (snapshot.exists()) {
  //     const data = snapshot.val();
  //     const message = {
  //       type: 'realtime',
  //       data
  //     }
  //     socket.emit("data", message);
  //   }
  // })

  // socket.emit("data", { type: "history_perminutes", data: null })
  socket.emit("data", { type: "dummy", data: "Hello" })
  const sendMessage = setInterval(() => {
    socket.emit("data", { type: "dummy", data: "Hello" })
  }, 2000)

  socket.on('disconnect', () => {
    clearInterval(sendMessage);
    // socket.disconnect();
    delete sockets[socket.id];
  });
});


server.listen(port, () => {
  console.log('listening on *:3000');
});