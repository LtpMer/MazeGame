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
let typeMode = "wall"; // default type for building

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
  // 0 = empty, 1 = wall, 2 = design block, 3 = movable block
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
      switch (maze[x][y]) {
        case 1: ctx.fillStyle = "black"; break;       // wall
        case 2: ctx.fillStyle = "gray"; break;        // design block
        case 3: ctx.fillStyle = "blue"; break;        // movable block
        default: ctx.fillStyle = "white";              // empty
      }
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
  if (buildMode || typeMode !== null) return;

  if (moveCounter < moveDelay) {
    moveCounter++;
    return;
  }
  moveCounter = 0;

  let dx = 0, dy = 0;
  if (keys["ArrowUp"] || keys["w"]) dy = -1;
  else if (keys["ArrowDown"] || keys["s"]) dy = 1;
  else if (keys["ArrowLeft"] || keys["a"]) dx = -1;
  else if (keys["ArrowRight"] || keys["d"]) dx = 1;

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
    // else cannot move/push
  }
  // else (wall = 1) cannot move

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
  if (!buildMode || !isMouseDown) return;
  handleCanvasAction(e);
});

function handleCanvasAction(e) {
  const { x, y } = getMouseCell(e);
  if (x < 0 || x >= cols || y < 0 || y >= rows) return;

  if (typeMode === "wall") {
    if ((x === player.x && y === player.y) || (x === win.x && y === win.y)) return;
    if (drawMode === "draw") {
      maze[x][y] = 1;
    } else if (drawMode === "delete") {
      maze[x][y] = 0;
    }
  } else if (typeMode === "design") {
    if ((x === player.x && y === player.y) || (x === win.x && y === win.y)) return;
    if (drawMode === "draw") {
      maze[x][y] = 2;
    } else if (drawMode === "delete") {
      maze[x][y] = 0;
    }
  } else if (typeMode === "player") {
    if (maze[x][y] !== 1 && maze[x][y] !== 3 && !(x === win.x && y === win.y)) {
      // Cannot place player on wall or movable block or win spot
      player.x = x;
      player.y = y;
    }
  } else if (typeMode === "win") {
    if (maze[x][y] !== 1 && maze[x][y] !== 3 && !(x === player.x && y === player.y)) {
      // Cannot place win on wall or movable block or player
      win.x = x;
      win.y = y;
    }
  } else if (typeMode === "movable") {
    if ((x === player.x && y === player.y) || (x === win.x && y === win.y)) return;
    if (drawMode === "draw") {
      // Only place movable block if not wall or movable block already
      if (maze[x][y] === 0 || maze[x][y] === 2) {
        maze[x][y] = 3;
      }
    } else if (drawMode === "delete") {
      if (maze[x][y] === 3) {
        maze[x][y] = 0;
      }
    }
  }
}

// Build mode toggle
toggleBuildBtn.addEventListener("click", () => {
  buildMode = !buildMode;
  buildControls.style.display = buildMode ? "block" : "none";
  typesControls.style.display = "none"; // hide types initially
  toggleTypesBtn.textContent = "Toggle Types";

  // Reset draw/delete button
  drawMode = "draw";
  drawBtn.classList.add("active");
  deleteBtn.classList.remove("active");
});

// Draw / Delete toggle buttons
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

// Toggle Types UI
toggleTypesBtn.addEventListener("click", () => {
  if (typesControls.style.display === "block") {
    typesControls.style.display = "none";
    toggleTypesBtn.textContent = "Toggle Types";
  } else {
    typesControls.style.display = "block";
    toggleTypesBtn.textContent = "Hide Types";
  }
});

// Type buttons select
function selectType(typeBtn, type) {
  typeMode = type;
  // Remove active from all type buttons
  [typeWallBtn, typeDesignBtn, typeMovableBtn, typePlayerBtn, typeWinBtn].forEach(btn =>
    btn.classList.remove("active")
  );
  typeBtn.classList.add("active");
}

// Initialize type buttons with click handlers
typeWallBtn.addEventListener("click", () => selectType(typeWallBtn, "wall"));
typeDesignBtn.addEventListener("click", () => selectType(typeDesignBtn, "design"));
typeMovableBtn.addEventListener("click", () => selectType(typeMovableBtn, "movable"));
typePlayerBtn.addEventListener("click", () => selectType(typePlayerBtn, "player"));
typeWinBtn.addEventListener("click", () => selectType(typeWinBtn, "win"));

// Initial active type
selectType(typeWallBtn, "wall");

// Keyboard control for player movement
window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
});
window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

// Main loop
function loop() {
  movePlayer();
  draw();
  requestAnimationFrame(loop);
}

loop();
