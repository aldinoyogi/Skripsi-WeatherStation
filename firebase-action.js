const admin = require("firebase-admin");
const serviceAccount = require("./weather-skripsi.json");
const moment = require("moment");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://weather-station-telkom-default-rtdb.firebaseio.com"
});

admin.database.enableLogging(false);




class GetFirebaseRecord {

  /**
   * Initializes the instance of the GetFirebaseRecord class.
   *
   * This constructor initializes the instance variables of the class, including:
   * - `db`: the Firebase Realtime Database instance
   * - `sockets`: a Map to store socket connections
   * - `datetime_start_at`: the start time for the 30-minute window
   * - `datetime_now`: the current time
   * - `realtime_a`, `history_perminutes_a`, `history_average_b`: empty objects and arrays
   * - `realtime_b`, `history_perminutes_b`, `history_average_a`: empty objects and arrays
   * - `query_realtime_a`, `query_history_perminutes_a`, `query_history_average_a`: Firebase Realtime Database references for Weather Station A
   * - `query_realtime_b`, `query_history_perminutes_b`, `query_history_average_b`: Firebase Realtime Database references for Weather Station B
   *
   * @return {void}
   */
  constructor() {
    this.db = admin.database();
    this.sockets = new Map();

    this.datetime_start_at = moment().subtract(30, "minutes");
    this.datetime_now = moment();

    this.realtime_a = {};
    this.history_perminutes_a = [];
    this.history_average_b = [];

    this.realtime_b = {};
    this.history_perminutes_b = [];
    this.history_average_a = [];

    this.query_realtime_a = this.db.ref("Weather_Station_A/realtime");
    this.query_history_perminutes_a = this.db.ref("Weather_Station_A/history_perminutes");
    this.query_history_average_a = this.db.ref("Weather_Station_A/history_average");

    this.query_realtime_b = this.db.ref("Weather_Station_B/realtime");
    this.query_history_perminutes_b = this.db.ref("Weather_Station_B/history_perminutes");
    this.query_history_average_b = this.db.ref("Weather_Station_B/history_average");
  }


  /*
  Adds a socket to the Map with its channel. If the channel is "/a", 
  it emits "data" events to the socket with the realtime data and timeseries data 
  for Weather Station A. If the channel is "/b", it does the same for Weather Station B
  */
  addSocket = (socket, channel) => {
    this.sockets.set(socket.id, { socket, channel });

    if (channel == "/a") {
      socket.emit("data", { type: "realtime", data: { ...this.realtime_a, channel } });
      socket.emit("data", {
        type: "timeseries", data: {
          minutes: this.history_perminutes_a,
          averages: this.history_average_a,
          channel
        }
      });
    }

    if (channel == "/b") {
      socket.emit("data", { type: "realtime", data: { ...this.realtime_b, channel } });
      socket.emit("data", {
        type: "timeseries", data: {
          minutes: this.history_perminutes_b,
          averages: this.history_average_b,
          channel
        }
      });
    }
  }


  /*
  Removes the socket from the Map
  */
  deleteSocket = (socket) => {
    this.sockets.delete(socket.id);
  }


  /*
  Sets listeners to the Realtime Database Station A
  */
  setListenerRealtimeA = () => {
    this.query_realtime_a.on("value", (snapshot) => {
      if (snapshot.exists()) {
        this.realtime_a = snapshot.val();
        this.sockets.forEach(socket => {
          if (socket.channel == "/a") socket.socket.emit("data", { type: "realtime", data: { ...this.realtime_a, channel: socket.channel } });
        })
      }
    })
  }


  /*
  Sets listeners to the Realtime Database Station B
  */
  setListenerRealtimeB = () => {
    this.query_realtime_b.on("value", (snapshot) => {
      if (snapshot.exists()) {
        this.realtime_b = snapshot.val();
        this.sockets.forEach(socket => {
          if (socket.channel == "/b") socket.socket.emit("data", { type: "realtime", data: { ...this.realtime_b, channel: socket.channel } });
        })
      }
    })
  }


  /*
  Sets init data of History PerMinutes Database Station A
  */
  setInitiateHistoryPerMinutesA = () => {
    const date_start = this.datetime_start_at.format("YYYY-MM-DD");
    this.query_history_perminutes_a.limitToLast(30).once("value", (snapshot) => {
      if (snapshot.exists()) {
        const _data = snapshot.val();
        const data = Object.values(_data).filter(item => moment(`${item.date} ${item.time}`, "YYYY-MM-DD HH:mm:ss").isAfter(this.datetime_start_at))
        this.history_perminutes_a = data;
      }
    })
  }


  /*
  Sets listeners to the History PerMinutes Database Station A
  */
  setListenerHistoryPerMinutesA = () => {
    this.query_history_perminutes_a.limitToLast(1).on("child_added", (snapshot) => {
      if (snapshot.exists()) {
        const _data = snapshot.val();
        const date_start_at_now = moment().subtract(30, "minutes");
        if (this.history_perminutes_a.length > 30) {
          this.history_perminutes_a.shift();
        }
        this.history_perminutes_a.push(_data);
        this.history_perminutes_a = Object.values(this.history_perminutes_a).filter(item => moment(`${item.date} ${item.time}`, "YYYY-MM-DD HH:mm:ss").isAfter(date_start_at_now))
        this.sockets.forEach(socket => {
          if (socket.channel == "/a") socket.socket.emit("data", {
            type: "timeseries", data: {
              minutes: this.history_perminutes_a,
              channel: socket.channel
            }
          });
        })

      }
    })
  }


  /*
  Sets init data of History Average Database Station A
  */
  setInitiateHistoryAverageA = () => {
    const date_start = this.datetime_start_at.format("YYYY-MM-DD");
    this.query_history_average_a.limitToLast(30).once("value", (snapshot) => {
      if (snapshot.exists()) {
        const _data = snapshot.val();
        const data = Object.values(_data).filter(item => moment(`${item.date} ${item.time}`, "YYYY-MM-DD HH:mm:ss").isAfter(this.datetime_start_at))
        this.history_average_a = data;
      }
    })
  }


  /*
  Sets listeners to the History Average Database Station A
  */
  setListenerHistoryAverageA = () => {
    this.query_history_average_a.limitToLast(1).on("child_added", (snapshot) => {
      if (snapshot.exists()) {
        const _data = snapshot.val();
        const date_start_at_now = moment().subtract(30, "minutes");
        if (this.history_average_a.length > 30) {
          this.history_average_a.shift();
        }
        this.history_average_a.push(_data);
        this.history_average_a = Object.values(this.history_average_a).filter(item => moment(`${item.date} ${item.time}`, "YYYY-MM-DD HH:mm:ss").isAfter(date_start_at_now))

        this.sockets.forEach(socket => {
          if (socket.channel == "/a") socket.socket.emit("data", {
            type: "timeseries", data: {
              averages: this.history_average_a,
              channel: socket.channel
            }
          });
        })
      }
    })
  }


  /*
  Sets init data of History PerMinutes Database Station B
  */
  setInitiateHistoryPerMinutesB = () => {
    const date_start = this.datetime_start_at.format("YYYY-MM-DD");
    this.query_history_perminutes_b.limitToLast(30).once("value", (snapshot) => {
      if (snapshot.exists()) {
        const _data = snapshot.val();
        const data = Object.values(_data).filter(item => moment(`${item.date} ${item.time}`, "YYYY-MM-DD HH:mm:ss").isAfter(this.datetime_start_at))
        this.history_perminutes_b = data;
      }
    })
  }


  /*
  Sets listeners to the History PerMinutes Database Station B
  */
  setListenerHistoryPerMinutesB = () => {
    this.query_history_perminutes_b.limitToLast(1).on("child_added", (snapshot) => {
      if (snapshot.exists()) {
        const _data = snapshot.val();
        const date_start_at_now = moment().subtract(30, "minutes");
        if (this.history_perminutes_b.length > 30) {
          this.history_perminutes_b.shift();
        }
        this.history_perminutes_b.push(_data);
        this.history_perminutes_b = Object.values(this.history_perminutes_b).filter(item => moment(`${item.date} ${item.time}`, "YYYY-MM-DD HH:mm:ss").isAfter(date_start_at_now))

        this.sockets.forEach(socket => {
          if (socket.channel == "/b") socket.socket.emit("data", {
            type: "timeseries", data: {
              minutes: this.history_perminutes_b,
              channel: socket.channel
            }
          });
        })
      }
    })
  }


  /*
  Sets init data of History Average Database Station B
  */
  setInitiateHistoryAverageB = () => {
    const date_start = this.datetime_start_at.format("YYYY-MM-DD");
    this.query_history_average_b.limitToLast(30).once("value", (snapshot) => {
      if (snapshot.exists()) {
        const _data = snapshot.val();
        const data = Object.values(_data).filter(item => moment(`${item.date} ${item.time}`, "YYYY-MM-DD HH:mm:ss").isAfter(this.datetime_start_at))
        this.history_average_b = data;
      }
    })
  }


  /*
  Sets listeners to the History Average Database Station B
  */
  setListenerHistoryAverageB = () => {
    this.query_history_average_b.limitToLast(1).on("child_added", (snapshot) => {
      if (snapshot.exists()) {
        const _data = snapshot.val();
        const date_start_at_now = moment().subtract(30, "minutes");
        if (this.history_average_b.length > 30) {
          this.history_average_b.shift();
        }
        this.history_average_b.push(_data);
        this.history_average_b = Object.values(this.history_average_b).filter(item => moment(`${item.date} ${item.time}`, "YYYY-MM-DD HH:mm:ss").isAfter(date_start_at_now))

        this.sockets.forEach(socket => {
          if (socket.channel == "/b") socket.socket.emit("data", {
            type: "timeseries", data: {
              averages: this.history_average_b,
              channel: socket.channel
            }
          });
        });
      }
    })
  }

}

module.exports = { GetFirebaseRecord }