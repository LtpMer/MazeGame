// Your existing maze game variables and functions here
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const cols = 25;
const rows = 25;
const cellSize = canvas.width / cols;

const MOVE_DELAY = 6;
let moveCooldown = 0;

let keys = {};

const blockTypes = {
  wall: { color: "black", solid: true, movable: false },
  empty: { color: "white", solid: false, movable: false },
  player: { color: "red", solid: false, movable: false },
  win: { color: "green", solid: false, movable: false },
  movableBlock: { color: "blue", solid: true, movable: true },
  designBlock: { color: "gray", solid: false, movable: false },
};

let maze = [];
let player = { x: 1, y: 1 };
let win = { x: cols - 2, y: rows - 2 };

const usersList = document.getElementById("usersList");
const globalUsersList = document.getElementById("globalUsersList");
const loginMessage = document.getElementById("loginMessage");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");

const adminUsername = "admin";

let currentUser = null;

// LocalStorage user & stats management
if (!localStorage.getItem("users")) {
  const defaultUsers = {
    admin: "adminpass",
    user1: "password1",
  };
  localStorage.setItem("users", JSON.stringify(defaultUsers));
}
if (!localStorage.getItem("winStats")) {
  localStorage.setItem("winStats", JSON.stringify({}));
}

function loadUsers() {
  return JSON.parse(localStorage.getItem("users") || "{}");
}

function getWinStats() {
  return JSON.parse(localStorage.getItem("winStats") || "{}");
}

function saveWinStats(stats) {
  localStorage.setItem("winStats", JSON.stringify(stats));
}

function updateLeaderboard() {
  const users = loadUsers();
  const stats = getWinStats();
  usersList.innerHTML = "";

  if (!currentUser) {
    usersList.textContent = "Please login to see leaderboard.";
    return;
  }

  Object.entries(users).forEach(([user]) => {
    const div = document.createElement("div");
    div.textContent = `${user} — Wins: ${stats[user] || 0}`;
    if (user === adminUsername) div.classList.add("admin");
    usersList.appendChild(div);
  });
}

// Maze generation & drawing functions (unchanged)
function generateMaze() {
  maze = [];
  for (let x = 0; x < cols; x++) {
    maze[x] = [];
    for (let y = 0; y < rows; y++) {
      if (x === 0 || y === 0 || x === cols - 1 || y === rows - 1) {
        maze[x][y] = "wall";
      } else {
        maze[x][y] = Math.random() < 0.25 ? "wall" : "empty";
      }
    }
  }
  placeRandom("player");
  placeRandom("win");
}

function placeRandom(type) {
  while (true) {
    let x = Math.floor(Math.random() * cols);
    let y = Math.floor(Math.random() * rows);
    if (maze[x][y] === "empty") {
      if (type === "player") {
        player.x = x;
        player.y = y;
      } else if (type === "win") {
        win.x = x;
        win.y = y;
      }
      maze[x][y] = type;
      break;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      let type = maze[x][y];
      let color = blockTypes[type]?.color || "white";

      ctx.fillStyle = color;
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  ctx.fillStyle = blockTypes.player.color;
  ctx.fillRect(player.x * cellSize, player.y * cellSize, cellSize, cellSize);

  ctx.fillStyle = blockTypes.win.color;
  ctx.fillRect(win.x * cellSize, win.y * cellSize, cellSize, cellSize);
}

function canMoveTo(x, y) {
  if (x < 0 || x >= cols || y < 0 || y >= rows) return false;
  let block = maze[x][y];
  if (!blockTypes[block]) return true;
  return !blockTypes[block].solid;
}

function checkWin() {
  if (player.x === win.x && player.y === win.y) {
    alert("You Win!");

    if (currentUser) {
      let stats = getWinStats();
      stats[currentUser] = (stats[currentUser] || 0) + 1;
      saveWinStats(stats);

      // Update global leaderboard in Firebase
      db.ref('leaderboard/' + currentUser).transaction(currentWins => {
        return (currentWins || 0) + 1;
      }).then(() => {
        loadGlobalLeaderboard();
      });
    }

    generateMaze();
    draw();
    updateLeaderboard();
  }
}

function handleMovement() {
  if (moveCooldown > 0) {
    moveCooldown--;
    return;
  }

  let dx = 0, dy = 0;

  if ((keys["ArrowUp"] || keys["w"]) && !(keys["ArrowDown"] || keys["s"])) dy = -1;
  else if ((keys["ArrowDown"] || keys["s"]) && !(keys["ArrowUp"] || keys["w"])) dy = 1;

  if ((keys["ArrowLeft"] || keys["a"]) && !(keys["ArrowRight"] || keys["d"])) dx = -1;
  else if ((keys["ArrowRight"] || keys["d"]) && !(keys["ArrowLeft"] || keys["a"])) dx = 1;

  if (dx !== 0 && dy !== 0) dx = 0;

  if (dx !== 0 || dy !== 0) {
    let nx = player.x + dx;
    let ny = player.y + dy;

    if (canMoveTo(nx, ny)) {
      maze[player.x][player.y] = "empty";
      player.x = nx;
      player.y = ny;
      maze[player.x][player.y] = "player";

      moveCooldown = MOVE_DELAY;
      checkWin();
      draw();
    }
  }
}

document.addEventListener("keydown", e => { keys[e.key] = true; });
document.addEventListener("keyup", e => { keys[e.key] = false; });

// Firebase config — REPLACE with your own!
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function loadGlobalLeaderboard() {
  db.ref('leaderboard').orderByValue().limitToLast(10).once('value').then(snapshot => {
    const data = snapshot.val();
    if (!data) {
      globalUsersList.textContent = "No global data yet.";
      return;
    }
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
    globalUsersList.innerHTML = "";
    sorted.forEach(([user, wins]) => {
      const div = document.createElement("div");
      div.textContent = `${user} — Wins: ${wins}`;
      if (user === adminUsername) div.classList.add("admin");
      globalUsersList.appendChild(div);
    });
  });
}

function login(username, password) {
  const users = loadUsers();
  if (users[username] && users[username] === password) {
    currentUser = username;
    loginMessage.textContent = `Logged in as ${username}`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    usernameInput.style.display = "none";
    passwordInput.style.display = "none";
    updateLeaderboard();
    loadGlobalLeaderboard();
  } else {
    loginMessage.textContent = "Invalid username or password";
  }
}

function logout() {
  currentUser = null;
  loginMessage.textContent = "Logged out";
  loginBtn.style.display = "inline-block";
  logoutBtn.style.display = "none";
  usernameInput.style.display = "inline-block";
  passwordInput.style.display = "inline-block";
  updateLeaderboard();
  globalUsersList.textContent = "Login to see global leaderboard.";
}

loginBtn.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  if (username && password) login(username, password);
  else loginMessage.textContent = "Please enter username and password";
});

logoutBtn.addEventListener("click", () => { logout(); });

function loop() {
  handleMovement();
  requestAnimationFrame(loop);
}

// Init
generateMaze();
draw();
updateLeaderboard();
loadGlobalLeaderboard();
loop();
