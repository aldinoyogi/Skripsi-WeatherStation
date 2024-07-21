const express = require('express');
const app = express();
const server = require('http').createServer(app);
const path = require('path');


const SocketIO = require("socket.io")
const io = SocketIO(server);


const { GetFirebaseRecord } = require("./firebase-action")
const port = process.env.PORT || 3000;


const realtimeDatabase = new GetFirebaseRecord();

realtimeDatabase.setListenerRealtimeA();
realtimeDatabase.setInitiateHistoryPerMinutesA();
realtimeDatabase.setListenHistoryPerMinutesA();
realtimeDatabase.setInitiateHistoryAverageA();
realtimeDatabase.setListenHistoryAverageA();


realtimeDatabase.setListenerRealtimeB();
realtimeDatabase.setInitiateHistoryPerMinutesB();
realtimeDatabase.setListenHistoryPerMinutesB();
realtimeDatabase.setInitiateHistoryAverageB();
realtimeDatabase.setListenHistoryAverageB();


app.use(express.static(path.join(__dirname + '/public')));
app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});


io.on('connection', (socket) => {
  socket.on("channel", (channel) => {
    realtimeDatabase.addSocket(socket, channel);
  });

  socket.on('disconnect', () => {
    realtimeDatabase.deleteSocket(socket);
  });
});


server.listen(port, () => {
  console.log(`listening on *:${port}`);
});
