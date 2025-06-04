const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const cols = 25;
const rows = 25;
const cellSize = canvas.width / cols;

let maze = generateMaze(cols, rows);
let player = { x: 1, y: 1 };
let win = { x: cols - 2, y: rows - 2 };
let keys = {};

let moveDelay = 6;
let moveCounter = 0;

let buildMode = false;
let drawMode = "draw"; // "draw" or "delete"

const toggleBuildBtn = document.getElementById("toggleBuildBtn");
const buildControls = document.getElementById("buildControls");
const drawBtn = document.getElementById("drawBtn");
const deleteBtn = document.getElementById("deleteBtn");

function generateMaze(cols, rows) {
  // Simple random walls with start and win clear
  const maze = Array.from({ length: cols }, () =>
    Array.from({ length: rows }, () => (Math.random() < 0.3 ? 1 : 0))
  );
  maze[1][1] = 0;
  maze[cols - 2][rows - 2] = 0;
  return maze;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      ctx.fillStyle = maze[x][y] === 1 ? "black" : "white";
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  // Win pad
  ctx.fillStyle = "green";
  ctx.fillRect(win.x * cellSize, win.y * cellSize, cellSize, cellSize);

  // Player
  ctx.fillStyle = "red";
  ctx.fillRect(player.x * cellSize, player.y * cellSize, cellSize, cellSize);
}

function movePlayer() {
  if (buildMode) return;

  if (moveCounter < moveDelay) {
    moveCounter++;
    return;
  }
  moveCounter = 0;

  let dx = 0, dy = 0;
  if (keys["ArrowUp"] || keys["w"]) {
    dy = -1;
  } else if (keys["ArrowDown"] || keys["s"]) {
    dy = 1;
  } else if (keys["ArrowLeft"] || keys["a"]) {
    dx = -1;
  } else if (keys["ArrowRight"] || keys["d"]) {
    dx = 1;
  }

  let newX = player.x + dx;
  let newY = player.y + dy;

  if (
    newX >= 0 && newX < cols &&
    newY >= 0 && newY < rows &&
    maze[newX][newY] === 0
  ) {
    player.x = newX;
    player.y = newY;
  }

  if (player.x === win.x && player.y === win.y) {
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

canvas.addEventListener("click", (e) => {
  if (!buildMode) return;
  const { x, y } = getMouseCell(e);
  if (x < 0 || x >= cols || y < 0 || y >= rows) return;

  // Prevent player or win from being blocked
  if ((x === player.x && y === player.y) || (x === win.x && y === win.y)) return;

  if (drawMode === "draw") {
    maze[x][y] = 1;
  } else if (drawMode === "delete") {
    maze[x][y] = 0;
  }
});

toggleBuildBtn.addEventListener("click", () => {
  buildMode = !buildMode;
  buildControls.style.display = buildMode ? "block" : "none";
});

drawBtn.addEventListener("click", () => {
  drawMode = "draw";
  drawBtn.style.backgroundColor = "lightgreen";
  deleteBtn.style.backgroundColor = "";
});

deleteBtn.addEventListener("click", () => {
  drawMode = "delete";
  deleteBtn.style.backgroundColor = "lightcoral";
  drawBtn.style.backgroundColor = "";
});

document.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();  // prevent scrolling
  }
  keys[e.key] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Set initial button colors and hide build controls
drawBtn.style.backgroundColor = "lightgreen";
deleteBtn.style.backgroundColor = "";
buildControls.style.display = "none";

// Focus canvas to enable keyboard controls immediately
canvas.focus();

function loop() {
  movePlayer();
  draw();
  requestAnimationFrame(loop);
}

loop();
