const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const cols = 25;
const rows = 25;
const cellSize = canvas.width / cols;

let maze;
let player;
let win;
let keys = {};

let moveDelay = 6;
let moveCounter = 0;

let buildMode = false;
let drawMode = "draw"; // "draw" or "delete"
let typeMode = "wall"; // default building block type

const toggleBuildBtn = document.getElementById("toggleBuildBtn");
const buildControls = document.getElementById("buildControls");
const drawBtn = document.getElementById("drawBtn");
const deleteBtn = document.getElementById("deleteBtn");

const toggleTypesBtn = document.getElementById("toggleTypesBtn");
const typesControls = document.getElementById("typesControls");
const typeWallBtn = document.getElementById("typeWallBtn");
const typeDesignBtn = document.getElementById("typeDesignBtn");
const typePlayerBtn = document.getElementById("typePlayerBtn");
const typeWinBtn = document.getElementById("typeWinBtn");
const typeMovableBtn = document.getElementById("typeMovableBtn");

function generateMaze(cols, rows) {
  const maze = Array.from({ length: cols }, () =>
    Array.from({ length: rows }, () => (Math.random() < 0.3 ? 1 : 0))
  );

  // Make sure borders are walls to contain maze
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
  // fallback default
  return { x: 1, y: 1 };
}

function initializeGame() {
  maze = generateMaze(cols, rows);

  // Random player and win positions on empty cells (not overlapping)
  player = findRandomEmptyCell(maze);
  do {
    win = findRandomEmptyCell(maze);
  } while (win.x === player.x && win.y === player.y);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      switch (maze[x][y]) {
        case 1: ctx.fillStyle = "black"; break;       // wall
        case 2: ctx.fillStyle = "gray"; break;        // design block
        case 3: ctx.fillStyle = "blue"; break;        // movable block
        default: ctx.fillStyle = "white";              // empty
      }
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  // Draw win block (green)
  ctx.fillStyle = "green";
  ctx.fillRect(win.x * cellSize, win.y * cellSize, cellSize, cellSize);

  // Draw player block (red)
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
    // empty or design block, move freely
    player.x = newX;
    player.y = newY;
  } else if (nextCell === 3) {
    // Movable block, try to push
    let pushX = newX + dx;
    let pushY = newY + dy;

    if (pushX < 0 || pushX >= cols || pushY < 0 || pushY >= rows) return;

    let pushCell = maze[pushX][pushY];

    // Can push if pushCell empty(0) or design block(2)
    if (pushCell === 0 || pushCell === 2) {
      // Move block
      maze[pushX][pushY] = 3;
      maze[newX][newY] = 0;
      // Move player
      player.x = newX;
      player.y = newY;
    }
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

let isMouseDown = false;

canvas.addEventListener("mousedown", (e) => {
  if (!buildMode) return;
  isMouseDown = true;
  handleCanvasAction(e);
});

canvas.addEventListener("mouseup", () => {
  isMouseDown = false;
});

canvas.addEventListener("mouseleave", () => {
  isMouseDown = false;
});

canvas.addEventListener("mousemove", (e) => {
  if (!buildMode) return;
  if (!isMouseDown) return;
  handleCanvasAction(e);
});

function handleCanvasAction(e) {
  const { x, y } = getMouseCell(e);

  if (x < 0 || x >= cols || y < 0 || y >= rows) return;

  // Player and Win can only be placed on empty cells (0)
  if ((typeMode === "player" || typeMode === "win") && maze[x][y] !== 0) {
    return;
  }

  if (drawMode === "draw") {
    if (typeMode === "player") {
      player.x = x;
      player.y = y;
    } else if (typeMode === "win") {
      win.x = x;
      win.y = y;
    } else {
      maze[x][y] = getTypeValue(typeMode);
    }
  } else if (drawMode === "delete") {
    // If deleting player or win, reset their positions to defaults
    if (typeMode === "player") {
      if (player.x === x && player.y === y) {
        // Reset player pos randomly to avoid stuck
        player = findRandomEmptyCell(maze);
      }
    } else if (typeMode === "win") {
      if (win.x === x && win.y === y) {
        win = findRandomEmptyCell(maze);
      }
    } else {
      maze[x][y] = 0;
    }
  }
}

function getTypeValue(type) {
  switch (type) {
    case "wall": return 1;
    case "design": return 2;
    case "movable": return 3;
    default: return 0;
  }
}

toggleBuildBtn.addEventListener("click", () => {
  buildMode = !buildMode;
  buildControls.style.display = buildMode ? "block" : "none";
  typesControls.style.display = "none";
  toggleTypesBtn.textContent = "Toggle Types";

  drawMode = "draw";
  drawBtn.classList.add("active");
  deleteBtn.classList.remove("active");
});

drawBtn.addEventListener("click", () => {
  drawMode = "draw";
  drawBtn.classList.add("active");
  deleteBtn.classList.remove("active");
});

deleteBtn.addEventListener("click", () => {
  drawMode = "delete";
  deleteBtn.classList.add("active");
  drawBtn.classList.remove("active");
});

toggleTypesBtn.addEventListener("click", () => {
  if (typesControls.style.display === "block") {
    typesControls.style.display = "none";
    toggleTypesBtn.textContent = "Toggle Types";
  } else {
    typesControls.style.display = "block";
    toggleTypesBtn.textContent = "Hide Types";
  }
});

function selectType(button, type) {
  typeMode = type;
  [typeWallBtn, typeDesignBtn, typeMovableBtn, typePlayerBtn, typeWinBtn].forEach(btn => btn.classList.remove("active"));
  button.classList.add("active");
}

typeWallBtn.addEventListener("click", () => selectType(typeWallBtn, "wall"));
typeDesignBtn.addEventListener("click", () => selectType(typeDesignBtn, "design"));
typeMovableBtn.addEventListener("click", () => selectType(typeMovableBtn, "movable"));
typePlayerBtn.addEventListener("click", () => selectType(typePlayerBtn, "player"));
typeWinBtn.addEventListener("click", () => selectType(typeWinBtn, "win"));

selectType(typeWallBtn, "wall");

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});
window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Initialize player and win positions randomly on maze start
initializeGame();

function loop() {
  movePlayer();
  draw();
  requestAnimationFrame(loop);
}

loop();
