const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const admin = require("firebase-admin");
const serviceAccount = require("./weather-station.json");


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://weathercast-3d11e-default-rtdb.asia-southeast1.firebasedatabase.app"
});



const app = express();
const server = app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

// WebSocket server
const wss = new WebSocket.Server({ server });

const realtime_db = admin.database();
realtime_db.ref("Weather_Station_A/realtime").on("value", (snapshot) => {
  console.log("HIT 1")
  const data = snapshot.val();
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const message = {
        type: 'realtime',
        data
      }
      client.send(JSON.stringify(message));
    }
  });
});


wss.on('connection', (ws) => {
  realtime_db.ref("Weather_Station_A/realtime").get().then((snapshot) => {
    console.log("HIT 2")
    if (snapshot.exists()) {
      const data = snapshot.val();
      const message = {
        type: 'realtime',
        data
      }
      ws.send(JSON.stringify(message));
    }
  })
  ws.send(JSON.stringify({ type: 'history_perminutes', data: null }));
});


app.use(express.static(path.join(__dirname, 'assets')));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});