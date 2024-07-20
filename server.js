const express = require('express');
const app = express();
const server = require('http').createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
})




// const io = require('socket.io')(server);


const path = require('path');
const port = process.env.PORT || 3000;



const admin = require("firebase-admin");
const serviceAccount = require("./weather-station.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://weathercast-3d11e-default-rtdb.asia-southeast1.firebasedatabase.app"
});



app.use(express.static(path.join(__dirname + '/public')));
app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname + '/public/index.html'));
});


const sockets = new Map();

const realtime_db = admin.database();
realtime_db.ref("Weather_Station_A/realtime").on("value", (snapshot) => {
  const data = snapshot.val();
  sockets.forEach((socket) => {
    const message = {
      type: 'realtime',
      data
    }
    socket.emit("data", message);
    socket.emit("data", { type: "history_perminutes", data: null })
  });
});

io.on('connection', (socket) => {
  sockets.set(socket.id, socket);
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
    sockets.delete(socket.id);
    socket.disconnect();
  });
});


server.listen(port, () => {
  console.log('listening on *:3000');
});