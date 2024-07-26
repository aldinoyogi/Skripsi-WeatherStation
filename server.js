const express = require('express');
const app = express();
const server = require('http').createServer(app);
const path = require('path');


const SocketIO = require("socket.io")
const io = SocketIO(server);


const { GetFirebaseRecord } = require("./firebase-action")
const port = process.env.PORT || 3000;



/*
 * Initializes the instance of the GetFirebaseRecord class.
 */
const realtimeDatabase = new GetFirebaseRecord();


/*
Sets init data of Weather Station A and Listeners its self
*/
realtimeDatabase.setListenerRealtimeA();
realtimeDatabase.setInitiateHistoryPerMinutesA();
realtimeDatabase.setListenerHistoryPerMinutesA();
realtimeDatabase.setInitiateHistoryAverageA();
realtimeDatabase.setListenerHistoryAverageA();


/*
Sets init data of Weather Station B and Listeners its self
*/
realtimeDatabase.setListenerRealtimeB();
realtimeDatabase.setInitiateHistoryPerMinutesB();
realtimeDatabase.setListenerHistoryPerMinutesB();
realtimeDatabase.setInitiateHistoryAverageB();
realtimeDatabase.setListenerHistoryAverageB();



/*
Sets static files
*/
app.use(express.static(path.join(__dirname + '/public')));


/*
Set routes for Station A and Station B
*/
app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname + '/stationa.html'));
});
app.get('/station-b', (_, res) => {
  res.sendFile(path.join(__dirname + '/stationb.html'));
});


/*
Listen to socket of client
*/
io.on('connection', (socket) => {
  socket.on("channel", (channel) => {
    realtimeDatabase.addSocket(socket, channel);
  });

  socket.on('disconnect', () => {
    realtimeDatabase.deleteSocket(socket);
  });
});


/*
  Listen for client requests
*/
server.listen(port, () => {
  console.log(`listening on *:${port}`);
});
