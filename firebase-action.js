const admin = require("firebase-admin");
const serviceAccount = require("./weather-skripsi.json");
const moment = require("moment");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://weather-station-telkom-default-rtdb.firebaseio.com"
});

admin.database.enableLogging(false);

class GetFirebaseRecord {

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


  addSocket = (socket, channel) => {
    this.sockets.set(socket.id, { socket, channel });

    if (channel == "/a") {
      socket.emit("data", { type: "realtime", data: this.realtime_a });
      socket.emit("data", {
        type: "timeseries", data: {
          minutes: this.history_perminutes_a,
          averages: this.history_average_a
        }
      });
    }

    if (channel == "/b") {
      socket.emit("data", { type: "realtime", data: this.realtime_b });
      socket.emit("data", {
        type: "timeseries", data: {
          minutes: this.history_perminutes_b,
          averages: this.history_average_b
        }
      });
    }
  }


  deleteSocket = (socket) => {
    this.sockets.delete(socket.id);
  }


  setListenerRealtimeA = () => {
    this.query_realtime_a.on("value", (snapshot) => {
      if (snapshot.exists()) {
        this.realtime_a = snapshot.val();
        this.sockets.forEach(socket => {
          if (socket.channel == "/a") socket.socket.emit("data", { type: "realtime", data: this.realtime_a });
        })
      }
    })
  }

  setListenerRealtimeB = () => {
    this.query_realtime_b.on("value", (snapshot) => {
      if (snapshot.exists()) {
        this.realtime_b = snapshot.val();
        this.sockets.forEach(socket => {
          if (socket.channel == "/b") socket.socket.emit("data", { type: "realtime", data: this.realtime_b });
        })
      }
    })
  }


  setInitiateHistoryPerMinutesA = () => {
    const date_start = this.datetime_start_at.format("YYYY-MM-DD");
    this.query_history_perminutes_a.orderByChild("date").startAt(date_start).limitToLast(30).once("value", (snapshot) => {
      if (snapshot.exists()) {
        const _data = snapshot.val();
        const data = Object.values(_data).filter(item => moment(`${item.date} ${item.time}`, "YYYY-MM-DD HH:mm:ss").isAfter(this.datetime_start_at))
        this.history_perminutes_a = data;
      }
    })
  }

  setListenHistoryPerMinutesA = () => {
    this.query_history_perminutes_a.limitToLast(1).on("child_added", (snapshot) => {
      if (snapshot.exists()) {
        const _data = snapshot.val();
        const date_start_at_now = moment().subtract(30, "minutes");
        this.history_perminutes_a.shift();
        this.history_perminutes_a.push(_data);
        this.history_perminutes_a = Object.values(this.history_perminutes_a).filter(item => moment(`${item.date} ${item.time}`, "YYYY-MM-DD HH:mm:ss").isAfter(date_start_at_now))
      }
    })
  }

  setInitiateHistoryAverageA = () => {
    const date_start = this.datetime_start_at.format("YYYY-MM-DD");
    this.query_history_average_a.orderByChild("date").startAt(date_start).limitToLast(30).once("value", (snapshot) => {
      if (snapshot.exists()) {
        const _data = snapshot.val();
        const data = Object.values(_data).filter(item => moment(`${item.date} ${item.time}`, "YYYY-MM-DD HH:mm:ss").isAfter(this.datetime_start_at))
        this.history_average_a = data;
      }
    })
  }

  setListenHistoryAverageA = () => {
    this.query_history_average_a.limitToLast(1).on("child_added", (snapshot) => {
      if (snapshot.exists()) {
        const _data = snapshot.val();
        const date_start_at_now = moment().subtract(30, "minutes");
        this.history_average_a.shift();
        this.history_average_a.push(_data);
        this.history_average_a = Object.values(this.history_average_a).filter(item => moment(`${item.date} ${item.time}`, "YYYY-MM-DD HH:mm:ss").isAfter(date_start_at_now))
      }
    })
  }

  setInitiateHistoryPerMinutesB = () => {
    const date_start = this.datetime_start_at.format("YYYY-MM-DD");
    this.query_history_perminutes_b.orderByChild("date").startAt(date_start).limitToLast(30).once("value", (snapshot) => {
      if (snapshot.exists()) {
        const _data = snapshot.val();
        const data = Object.values(_data).filter(item => moment(`${item.date} ${item.time}`, "YYYY-MM-DD HH:mm:ss").isAfter(this.datetime_start_at))
        this.history_perminutes_b = data;
      }
    })
  }

  setListenHistoryPerMinutesB = () => {
    this.query_history_perminutes_b.limitToLast(1).on("child_added", (snapshot) => {
      if (snapshot.exists()) {
        const _data = snapshot.val();
        const date_start_at_now = moment().subtract(30, "minutes");
        this.history_perminutes_b.shift();
        this.history_perminutes_b.push(_data);
        this.history_perminutes_b = Object.values(this.history_perminutes_b).filter(item => moment(`${item.date} ${item.time}`, "YYYY-MM-DD HH:mm:ss").isAfter(date_start_at_now))
      }
    })
  }

  setInitiateHistoryAverageB = () => {
    const date_start = this.datetime_start_at.format("YYYY-MM-DD");
    this.query_history_average_b.orderByChild("date").startAt(date_start).limitToLast(30).once("value", (snapshot) => {
      if (snapshot.exists()) {
        const _data = snapshot.val();
        const data = Object.values(_data).filter(item => moment(`${item.date} ${item.time}`, "YYYY-MM-DD HH:mm:ss").isAfter(this.datetime_start_at))
        this.history_average_b = data;
      }
    })
  }

  setListenHistoryAverageB = () => {
    this.query_history_perminutes_b.limitToLast(1).on("child_added", (snapshot) => {
      if (snapshot.exists()) {
        const _data = snapshot.val();
        const date_start_at_now = moment().subtract(30, "minutes");
        this.history_average_b.shift();
        this.history_average_b.push(_data);
        this.history_average_b = Object.values(this.history_average_b).filter(item => moment(`${item.date} ${item.time}`, "YYYY-MM-DD HH:mm:ss").isAfter(date_start_at_now))
      }
    })
  }

}

module.exports = { GetFirebaseRecord }