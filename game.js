<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Maze Game with Login and Saves</title>
<style>
  canvas { border: 1px solid black; background: #eee; }
  #usersList div.admin, #globalUsersList div.admin { color: red; font-weight: bold; }
  #adminPanel { margin-top: 10px; border: 1px solid #ccc; padding: 5px; display:none; }
  button { margin: 2px; }
</style>
</head>
<body>

<h2>Maze Game</h2>

<div>
  <input id="usernameInput" placeholder="Username" />
  <input id="passwordInput" placeholder="Password" type="password" />
  <button id="loginBtn">Login</button>
  <button id="logoutBtn" style="display:none;">Logout</button>
  <div id="loginMessage"></div>
</div>

<canvas id="gameCanvas" width="500" height="500"></canvas>

<div>
  <button id="clearBtn">Clear / Reset Maze</button>
</div>

<h3>Save Slots</h3>
<div id="saveSlots">
  <div>
    Slot 1: 
    <button class="saveBtn" data-slot="1">Save</button>
    <button class="loadBtn" data-slot="1">Load</button>
    <button class="deleteBtn" data-slot="1">Delete</button>
  </div>
  <div>
    Slot 2: 
    <button class="saveBtn" data-slot="2">Save</button>
    <button class="loadBtn" data-slot="2">Load</button>
    <button class="deleteBtn" data-slot="2">Delete</button>
  </div>
  <div>
    Slot 3: 
    <button class="saveBtn" data-slot="3">Save</button>
    <button class="loadBtn" data-slot="3">Load</button>
    <button class="deleteBtn" data-slot="3">Delete</button>
  </div>
</div>

<h3>Local Leaderboard (Your Wins)</h3>
<div id="usersList">Login to see leaderboard.</div>

<h3>Global Leaderboard (Firebase)</h3>
<div id="globalUsersList">Login to see global leaderboard.</div>

<div id="adminPanel">
  <h3>Admin Panel - All Users and Passwords</h3>
  <pre id="allUsersPre"></pre>
</div>

<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js"></script>
<script>
(() => {
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
  const clearBtn = document.getElementById("clearBtn");
  const adminPanel = document.getElementById("adminPanel");
  const allUsersPre = document.getElementById("allUsersPre");

  const adminUsername = "admin";

  let currentUser = null;

  // LocalStorage user management and initial data
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

  // Load users from localStorage
  function loadUsers() {
    return JSON.parse(localStorage.getItem("users") || "{}");
  }
  // Save users to localStorage
  function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
  }

  // Load win stats from localStorage
  function loadWinStats() {
    return JSON.parse(localStorage.getItem("winStats") || "{}");
  }
  // Save win stats to localStorage
  function saveWinStats(stats) {
    localStorage.setItem("winStats", JSON.stringify(stats));
  }

  // Save/load maze state and player pos for save slots
  function saveGame(slot) {
    if (!currentUser) {
      alert("Login first to save your game!");
      return;
    }
    const saveData = {
      maze,
      player,
      win,
    };
    localStorage.setItem(`save_${currentUser}_slot${slot}`, JSON.stringify(saveData));
    alert(`Game saved to slot ${slot}`);
  }
  function loadGame(slot) {
    if (!currentUser) {
      alert("Login first to load your game!");
      return;
    }
    const saved = localStorage.getItem(`save_${currentUser}_slot${slot}`);
    if (!saved) {
      alert(`No saved game found in slot ${slot}`);
      return;
    }
    try {
      const data = JSON.parse(saved);
      maze = data.maze;
      player = data.player;
      win = data.win;
      draw();
      alert(`Game loaded from slot ${slot}`);
    } catch (e) {
      alert("Failed to load save data.");
    }
  }
  function deleteSave(slot) {
    if (!currentUser) {
      alert("Login first to delete saves!");
      return;
    }
    localStorage.removeItem(`save_${currentUser}_slot${slot}`);
    alert(`Deleted save slot ${slot}`);
  }

  // Generate maze with walls on edges and some random walls inside
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
  // Place player or win in random empty cell
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
  // Draw the maze on canvas
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
    // Draw player & win on top
    ctx.fillStyle = blockTypes.player.color;
    ctx.fillRect(player.x * cellSize, player.y * cellSize, cellSize, cellSize);
    ctx.fillStyle = blockTypes.win.color;
    ctx.fillRect(win.x * cellSize, win.y * cellSize, cellSize, cellSize);
  }
  // Check if player can move to given position
  function canMoveTo(x, y) {
    if (x < 0 || x >= cols || y < 0 || y >= rows) return false;
    let block = maze[x][y];
    if (!blockTypes[block]) return true;
    return !blockTypes[block].solid;
  }
  // Check if player won and update stats/leaderboard
  function checkWin() {
    if (player.x === win.x && player.y === win.y) {
      alert("You Win!");

      if (currentUser) {
        // Update local win stats
        const stats = loadWinStats();
        stats[currentUser] = (stats[currentUser] || 0) + 1;
        saveWinStats(stats);
        updateLeaderboard();

        // Update Firebase global leaderboard
        db.ref('leaderboard/' + currentUser).transaction(currentWins => {
          return (currentWins || 0) + 1;
        }).then(() => {
          loadGlobalLeaderboard();
        });
      }

      generateMaze();
      draw();
    }
  }
  // Handle player movement with cooldown
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

    if (dx !== 0 && dy !== 0) dx = 0; // no diagonal movement

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

  // Update local leaderboard UI from localStorage stats
  function updateLeaderboard() {
    if (!currentUser) {
      usersList.textContent = "Please login to see leaderboard.";
      return;
    }
    const stats = loadWinStats();
    usersList.innerHTML = "";

    // Sort users by wins descending
    const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
    sorted.forEach(([user, wins]) => {
      const div = document.createElement("div");
      div.textContent = `${user} — Wins: ${wins}`;
      if (user === adminUsername) div.classList.add("admin");
      usersList.appendChild(div);
    });
  }

  // Load and display global leaderboard from Firebase
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

  // Login function
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
      adminPanel.style.display = (username === adminUsername) ? "block" : "none";
      if (username === adminUsername) {
        showAllUsers();
      } else {
        allUsersPre.textContent = "";
      }
    } else {
      loginMessage.textContent = "Invalid username or password";
    }
  }
  // Logout function
  function logout() {
    currentUser = null;
    loginMessage.textContent = "Logged out";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    usernameInput.style.display = "inline-block";
    passwordInput.style.display = "inline-block";
    usersList.textContent = "Login to see leaderboard.";
    globalUsersList.textContent = "Login to see global leaderboard.";
    adminPanel.style.display = "none";
    allUsersPre.textContent = "";
  }

  // Show all users and passwords in admin panel
  function showAllUsers() {
    const users = loadUsers();
    let text = "";
    Object.entries(users).forEach(([user, pass]) => {
      text += `${user}: ${pass}\n`;
    });
    allUsersPre.textContent = text;
  }

  // Button event handlers for login/logout
  loginBtn.addEventListener("click", () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (username && password) login(username, password);
    else loginMessage.textContent = "Please enter username and password";
  });
  logoutBtn.addEventListener("click", () => {
    logout();
  });

  // Clear/reset button handler - generates new maze
  clearBtn.addEventListener("click", () => {
    generateMaze();
    draw();
  });

  // Save/load/delete buttons for slots
  document.querySelectorAll(".saveBtn").forEach(btn => {
    btn.addEventListener("click", () => saveGame(btn.dataset.slot));
  });
  document.querySelectorAll(".loadBtn").forEach(btn => {
    btn.addEventListener("click", () => loadGame(btn.dataset.slot));
  });
  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", () => deleteSave(btn.dataset.slot));
  });

  // Main game loop
  function loop() {
    handleMovement();
    requestAnimationFrame(loop);
  }

  // Initial setup
  generateMaze();
  draw();
  updateLeaderboard();
  loadGlobalLeaderboard();
  loop();

})();
</script>

</body>
</html>
