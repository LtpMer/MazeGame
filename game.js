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
const buildButton = document.getElementById("toggleBuildMode");

buildButton.addEventListener("click", () => {
  buildMode = !buildMode;
  buildButton.textContent = buildMode ? "Exit Build Mode" : "Toggle Build Mode";
});

canvas.addEventListener("click", (e) => {
  if (!buildMode) return;

  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / cellSize);
  const y = Math.floor((e.clientY - rect.top) / cellSize);

  if ((x === player.x && y === player.y) || (x === win.x && y === win.y)) return;

  maze[x][y] = maze[x][y] === 1 ? 0 : 1; // Toggle wall
});

function generateMaze(cols, rows) {
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
  if (moveCounter < moveDelay) {
    moveCounter++;
    return;
  }
  moveCounter = 0;

  let dx = 0, dy = 0;
  if (keys["ArrowUp"] || keys["w"]) dy = -1;
  if (keys["ArrowDown"] |
