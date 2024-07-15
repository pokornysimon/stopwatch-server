const ws = new WebSocket('ws://localhost:3000');

// For differentiating groups
const urlParams = new URLSearchParams(window.location.search);
const groupName = urlParams.get('group');

// Generate random group
if (groupName === null) {
  function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
      (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
  }
  document.location.replace(location.href + "?group=" + uuidv4());
}

document.getElementById('groupName').value = groupName;
document.getElementById('aLink').href = location.href;
document.getElementById('aLink').innerHTML = location.href;

let teamName = '';
const buttons = document.getElementById('buttons');
const registerBtn = document.getElementById('registerBtn');
const resetBtn = document.getElementById('resetBtn');
const statsTable = document.getElementById('stats');

resetBtn.addEventListener('click', () => {
  if (confirm("Opravdu chcete všechno smazat?!")) {
    ws.send(JSON.stringify({ type: 'reset', group: groupName }));
  }
})

registerBtn.addEventListener('click', () => {
  teamName = document.getElementById('teamName').value;
  if (teamName) {
    ws.send(JSON.stringify({ type: 'register', team: teamName, group: groupName }));
    buttons.style.display = 'block';
  }
});

document.getElementById('redBtn').addEventListener('click', () => handleButtonClick('red'));
document.getElementById('blueBtn').addEventListener('click', () => handleButtonClick('blue'));
document.getElementById('yellowBtn').addEventListener('click', () => handleButtonClick('yellow'));
document.getElementById('greenBtn').addEventListener('click', () => handleButtonClick('green'));

function handleButtonClick(color) {
  console.log("Clicked `%s` button", color);
  ws.send(JSON.stringify({ type: 'toggle', team: teamName, stopwatch: color, group: groupName }));


}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'update') {
    if (data.groups[groupName]) {
      const teams = data.groups[groupName].teams;
      updateStats(teams);

      if (JSON.stringify(teams) === JSON.stringify({})) {
        buttons.style.display = "none";
      }
    }
  }
};

function translateLight(color) {
  switch (color) {
    case 'red':
      return "#f17676";
    case 'blue':
      return "#86a0f5";
    case 'yellow':
      return "#eceb91";
    case 'green':
      return "#9dfcaa";
  }
}

function updateStats(teams) {
  statsTable.innerHTML = '';
  for (let team in teams) {
    const row = document.createElement('tr');

    const teamCell = document.createElement('td');
    teamCell.textContent = team;
    row.appendChild(teamCell);
    ['red', 'blue', 'yellow', 'green'].forEach((color) => {
      const cell = document.createElement('td');
      cell.textContent = (teams[team][color]).toFixed(1) + ' s';

      cell.style.backgroundColor = translateLight(color);

      if (color === teams[team].running) {
        cell.style.fontWeight = "bolder";
      }

      row.appendChild(cell);
    });

    const colorCell = document.createElement('td');
    colorCell.style.backgroundColor = teams[team].running === null ? "white" : teams[team].running;
    row.appendChild(colorCell);

    statsTable.appendChild(row);

    // Update button styles
    document.getElementById('redBtn').style.backgroundColor = translateLight('red');
    document.getElementById('blueBtn').style.backgroundColor = translateLight('blue');
    document.getElementById('yellowBtn').style.backgroundColor = translateLight('yellow');
    document.getElementById('greenBtn').style.backgroundColor = translateLight('green');

    if (teamName !== '' && teams[teamName].running !== null) {
      document.getElementById(teams[teamName].running + 'Btn').style.backgroundColor = teams[teamName].running;
    }
  }
}
