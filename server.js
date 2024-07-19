const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const path = require('path');



const admin = require("firebase-admin");
const serviceAccount = require("./weather-station.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://weathercast-3d11e-default-rtdb.asia-southeast1.firebasedatabase.app"
});



app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


const sockets = {};

const realtime_db = admin.database();
realtime_db.ref("Weather_Station_A/realtime").on("value", (snapshot) => {
  const data = snapshot.val();
  Object.keys(sockets).forEach((key) => {
    const socket = sockets[key];
    const message = {
      type: 'realtime',
      data
    }
    socket.emit("data", message);
  })
});

io.on('connection', (socket) => {
  sockets[socket.id] = socket;
  realtime_db.ref("Weather_Station_A/realtime").get().then((snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const message = {
        type: 'realtime',
        data
      }
      socket.emit("data", message);
    }
  })

  socket.emit("data", { type: "history_perminutes", data: null })

  socket.on('disconnect', () => {
    delete sockets[socket.id];
  });
});


server.listen(3000, () => {
  console.log('listening on *:3000');
});