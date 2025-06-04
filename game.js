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

// Initialize maze with some walls and empty spaces
function generateMaze() {
  maze = [];
  for (let x = 0; x < cols; x++) {
    maze[x] = [];
    for (let y = 0; y < rows; y++) {
      // Borders as walls
      if (x === 0 || y === 0 || x === cols - 1 || y === rows - 1) {
        maze[x][y] = "wall";
      } else {
        // Randomly generate walls or empty spaces
        maze[x][y] = Math.random() < 0.25 ? "wall" : "empty";
      }
    }
  }

  // Place player and win on empty spots
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

  // Player
  ctx.fillStyle = blockTypes.player.color;
  ctx.fillRect(player.x * cellSize, player.y * cellSize, cellSize, cellSize);

  // Win
  ctx.fillStyle = blockTypes.win.color;
  ctx.fillRect(win.x * cellSize, win.y * cellSize, cellSize, cellSize);
}

function canMoveTo(x, y) {
  if (x < 0 || x >= cols || y < 0 || y >= rows) return false;
  let block = maze[x][y];
  if (!blockTypes[block]) return true; // treat unknown as empty
  return !blockTypes[block].solid;
}

function checkWin() {
  if (player.x === win.x && player.y === win.y) {
    alert("You Win!");
    generateMaze();
    draw();
  }
}

function handleMovement() {
  if (moveCooldown > 0) return;

  let dx = 0, dy = 0;

  if ((keys["ArrowUp"] || keys["w"]) && !(keys["ArrowDown"] || keys["s"])) dy = -1;
  else if ((keys["ArrowDown"] || keys["s"]) && !(keys["ArrowUp"] || keys["w"])) dy = 1;

  if ((keys["ArrowLeft"] || keys["a"]) && !(keys["ArrowRight"] || keys["d"])) dx = -1;
  else if ((keys["ArrowRight"] || keys["d"]) && !(keys["ArrowLeft"] || keys["a"])) dx = 1;

  if (dx !== 0 && dy !== 0) {
    // Diagonal movement - ignore collisions, allow going through blocks
    let nx = player.x + dx;
    let ny = player.y + dy;

    if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
      // Update maze tiles for player movement
      maze[player.x][player.y] = "empty";
      player.x = nx;
      player.y = ny;
      maze[player.x][player.y] = "player";

      moveCooldown = MOVE_DELAY;
      checkWin();
      draw();
    }
  } else if (dx !== 0 || dy !== 0) {
    // Single direction move - check collision
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

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

function loop() {
  handleMovement();
  requestAnimationFrame(loop);
}

generateMaze();
draw();
loop();
