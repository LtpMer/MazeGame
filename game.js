const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const cols = 25;
const rows = 25;
const cellSize = canvas.width / cols;

let maze;
let player = null;
let win = null;
let keys = {};

let moveDelay = 6;
let moveCounter = 0;

let buildMode = false;
let drawMode = "draw"; // "draw" or "delete"
let typeMode = "wall"; // block type to draw or delete

const toggleBuildBtn = document.getElementById("toggleBuildBtn");
const buildControls = document.getElementById("buildControls");
const drawBtn = document.getElementById("drawBtn");
const deleteBtn = document.getElementById("deleteBtn");

const toggleTypesBtn = document.getElementById("toggleTypesBtn");
const typesControls = document.getElementById("typesControls");
const typeWallBtn = document.getElementById("typeWallBtn");
const typeDesignBtn = document.getElementById("typeDesignBtn");
const typeMovableBtn = document.getElementById("typeMovableBtn");
const typePlayerBtn = document.getElementById("typePlayerBtn");
const typeWinBtn = document.getElementById("typeWinBtn");

const mobileControls = document.getElementById("mobileControls");
const btnUp = document.getElementById("btnUp");
const btnDown = document.getElementById("btnDown");
const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");

function generateMaze(cols, rows) {
  const maze = Array.from({ length: cols }, () =>
    Array.from({ length: rows }, () => {
      const rnd = Math.random();
      if (rnd < 0.25) return 1; // wall (black)
      if (rnd < 0.35) return 2; // design (gray)
      if (rnd < 0.45) return 3; // movable (blue)
      return 0; // empty
    })
  );

  // Borders walls
  for (let x = 0; x < cols; x++) {
    maze[x][0] = 1;
    maze[x][rows - 1] = 1;
  }
  for (let y = 0; y < rows; y++) {
    maze[0][y] = 1;
    maze[cols - 1][y] = 1;
  }

  return maze;
}

function findRandomEmptyCell(maze) {
  let tries = 0;
  while (tries < 1000) {
    let x = Math.floor(Math.random() * cols);
    let y = Math.floor(Math.random() * rows);
    if (maze[x][y] === 0) {
      return { x, y };
    }
    tries++;
  }
  return { x: 1, y: 1 };
}

function initializeGame() {
  maze = generateMaze(cols, rows);

  player = findRandomEmptyCell(maze);
  do {
    win = findRandomEmptyCell(maze);
  } while (win.x === player.x && win.y === player.y);

  // Show mobile controls only if on mobile device (simple detection)
  if (/Mobi|Android/i.test(navigator.userAgent)) {
    mobileControls.style.display = "block";
  } else {
    mobileControls.style.display = "none";
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      switch (maze[x][y]) {
        case 1: ctx.fillStyle = "black"; break;
        case 2: ctx.fillStyle = "gray"; break;
        case 3: ctx.fillStyle = "blue"; break;
        default: ctx.fillStyle = "white";
      }
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  if (win) {
    ctx.fillStyle = "green";
    ctx.fillRect(win.x * cellSize, win.y * cellSize, cellSize, cellSize);
  }

  if (player) {
    ctx.fillStyle = "red";
    ctx.fillRect(player.x * cellSize, player.y * cellSize, cellSize, cellSize);
  }
}

function movePlayer() {
  if (buildMode || !player) return;

  if (moveCounter < moveDelay) {
    moveCounter++;
    return;
  }
  moveCounter = 0;

  let dx = 0, dy = 0;
  if (keys["arrowup"] || keys["w"]) dy = -1;
  else if (keys["arrowdown"] || keys["s"]) dy = 1;
  else if (keys["arrowleft"] || keys["a"]) dx = -1;
  else if (keys["arrowright"] || keys["d"]) dx = 1;

  if (dx === 0 && dy === 0) return;

  let newX = player.x + dx;
  let newY = player.y + dy;

  if (newX < 0 || newX >= cols || newY < 0 || newY >= rows) return;

  let nextCell = maze[newX][newY];

  if (nextCell === 0 || nextCell === 2) {
    player.x = newX;
    player.y = newY;
  } else if (nextCell === 3) {
    let pushX = newX + dx;
    let pushY = newY + dy;

    if (pushX < 0 || pushX >= cols || pushY < 0 || pushY >= rows) return;

    let pushCell = maze[pushX][pushY];

    if (pushCell === 0 || pushCell === 2) {
      maze[pushX][pushY] = 3;
      maze[newX][newY] = 0;
      player.x = newX;
      player.y = newY;
    }
  }

  if (win && player.x === win.x && player.y === win.y) {
    alert("You Win!");
    location.reload();
  }
}

function getMouseCell(evt) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((evt.clientX - rect.left) / cellSize);
  const y = Math.floor((evt.clientY - rect.top) / cellSize);
  return { x, y };
}

let isTouchDown = false;

function handleCanvasAction(e) {
  e.preventDefault();
  let clientX, clientY;
  if (e.touches) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((clientX - rect.left) / cellSize);
  const y = Math.floor((clientY - rect.top) / cellSize);
  if (x < 0 || x >= cols || y < 0 || y >= rows) return;

  if (drawMode === "draw") {
    if (typeMode === "player") {
      if (maze[x][y] === 0) {
        player = { x, y };
      }
    } else if (typeMode === "win") {
      if (maze[x][y] === 0) {
        win = { x, y };
      }
    } else {
      maze[x][y] = getTypeValue(typeMode);
    }
  } else if (drawMode === "delete") {
    if (typeMode === "player") {
      if (player && player.x === x && player.y === y) {
        player = null;
      }
    } else if (typeMode === "win") {
      if (win && win.x === x && win.y === y) {
        win = null;
      }
    } else {
      maze[x][y] = 0;
    }
  }
}

canvas.addEventListener("mousedown", (e) => {
  if (!buildMode) return;
  isTouchDown = true;
  handleCanvasAction(e);
});
canvas.addEventListener("mouseup", () => (isTouchDown = false));
canvas.addEventListener("mousemove", (e) => {
  if (!buildMode) return;
  if (!isTouchDown) return;
  handleCanvasAction(e);
});

canvas.addEventListener("touchstart", (e) => {
  if (!buildMode) return;
  isTouchDown = true;
  handleCanvasAction(e);
});
canvas.addEventListener("touchmove", (e) => {
  if (!buildMode) return;
  if (!isTouchDown) return;
  handleCanvasAction(e);
});
canvas.addEventListener("touchend", () => (isTouchDown = false));

function getTypeValue(type) {
  switch (type) {
    case "wall": return 1;
    case "design": return 2;
    case "movable": return 3;
    default: return 0;
  }
}

// Keyboard controls
window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});
window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Build mode toggle
toggleBuildBtn.onclick = () => {
  buildMode = !buildMode;
  buildControls.style.display = buildMode ? "block" : "none";
  toggleBuildBtn.textContent = buildMode ? "Exit Build Mode" : "Toggle Build Mode";
};

// Draw/Delete toggle
drawBtn.onclick = () => {
  drawMode = "draw";
  drawBtn.classList.add("active");
  deleteBtn.classList.remove("active");
};
deleteBtn.onclick = () => {
  drawMode = "delete";
  deleteBtn.classList.add("active");
  drawBtn.classList.remove("active");
};

// Show/hide types
toggleTypesBtn.onclick = () => {
  if (typesControls.style.display === "block") {
    typesControls.style.display = "none";
  } else {
    typesControls.style.display = "block";
  }
};

// Type buttons logic
function setTypeMode(newType) {
  typeMode = newType;
  typeWallBtn.classList.remove("active");
  typeDesignBtn.classList.remove("active");
  typeMovableBtn.classList.remove("active");
  typePlayerBtn.classList.remove("active");
  typeWinBtn.classList.remove("active");

  if (newType === "wall") typeWallBtn.classList.add("active");
  else if (newType === "design") typeDesignBtn.classList.add("active");
  else if (newType === "movable") typeMovableBtn.classList.add("active");
  else if (newType === "player") typePlayerBtn.classList.add("active");
  else if (newType === "win") typeWinBtn.classList.add("active");
}

typeWallBtn.onclick = () => setTypeMode("wall");
typeDesignBtn.onclick = () => setTypeMode("design");
typeMovableBtn.onclick = () => setTypeMode("movable");
typePlayerBtn.onclick = () => setTypeMode("player");
typeWinBtn.onclick = () => setTypeMode("win");

// Mobile joystick buttons
btnUp.addEventListener("touchstart", () => (keys["w"] = true));
btnUp.addEventListener("touchend", () => (keys["w"] = false));
btnDown.addEventListener("touchstart", () => (keys["s"] = true));
btnDown.addEventListener("touchend", () => (keys["s"] = false));
btnLeft.addEventListener("touchstart", () => (keys["a"] = true));
btnLeft.addEventListener("touchend", () => (keys["a"] = false));
btnRight.addEventListener("touchstart", () => (keys["d"] = true));
btnRight.addEventListener("touchend", () => (keys["d"] = false));

// Also support mouse click for mobile buttons (desktop)
btnUp.addEventListener("mousedown", () => (keys["w"] = true));
btnUp.addEventListener("mouseup", () => (keys["w"] = false));
btnDown.addEventListener("mousedown", () => (keys["s"] = true));
btnDown.addEventListener("mouseup", () => (keys["s"] = false));
btnLeft.addEventListener("mousedown", () => (keys["a"] = true));
btnLeft.addEventListener("mouseup", () => (keys["a"] = false));
btnRight.addEventListener("mousedown", () => (keys["d"] = true));
btnRight.addEventListener("mouseup", () => (keys["d"] = false));

// Main game loop
function gameLoop() {
  movePlayer();
  draw();
  requestAnimationFrame(gameLoop);
}

initializeGame();
gameLoop();
