const express = require('express');
const WebSocket = require('ws');

const app = express();
const port = 3000;

app.use(express.static('public'));

const server = app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});

const wss = new WebSocket.Server({ server });

let groups = {};



wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    const { type, team, stopwatch, group } = data;
    console.log("---------------------------------------------------------")
    console.log("Message arrived {group: `%s`, type: `%s`, team: `%s`, stopwatch: `%s`}", group, type, team, stopwatch);

    switch (type) {
      case 'register':
        // Verify group exists
        if (!groups[group]) {
          groups[group] = { teams: {} };
          console.log("New group registered: %s", group);
        }

        if (!groups[group].teams[team]) {
          groups[group].teams[team] = { red: 0, blue: 0, yellow: 0, green: 0, running: null };
          console.log("New team registered: `%s` in group `%s`", team, group)
        }
        broadcastTeams();
        break;

      case 'toggle':
        console.log("Toggleling '%s' stopwatch for `%s` team in group `%s`", stopwatch, team, group);

        if (groups[group].teams[team].running === stopwatch) {
          // Toggle -> stop
          groups[group].teams[team].running = null;
        } else {
          // Switch to different stopwatch
          groups[group].teams[team].running = stopwatch;
        }
        break;

      case 'reset':
        console.log("Reseting everything!");
        groups[group].teams = {};
    }

    Object.keys(groups).forEach((group) => {
      Object.keys(groups[group].teams).forEach((team) => {
        console.log("Data for group %s, team %s: ", group, team, groups[group].teams[team]);
      })
    })
  });
});

setInterval(() => {
  broadcastTeams();
}, 100);

setInterval(() => {
  updateStopwatch();
}, 200);

function updateStopwatch() {
  Object.keys(groups).forEach((group) => {
    Object.keys(groups[group].teams).forEach((team) => {
      if (groups[group].teams[team].running !== null) {
        groups[group].teams[team][groups[group].teams[team].running] += 0.2;
      }
    });
  })
}

function broadcastTeams() {
  const data = JSON.stringify({ type: 'update', groups });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}
