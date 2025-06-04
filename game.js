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

function generateMaze(cols, rows) {
  const maze = Array.from({ length: cols }, () =>
    Array.from({ length: rows }, () => {
      // Generate different blocks with probabilities
      const rnd = Math.random();
      if (rnd < 0.25) return 1; // wall (black)
      if (rnd < 0.35) return 2; // design (gray)
      if (rnd < 0.45) return 3; // movable (blue)
      return 0; // empty
    })
  );

  // Make borders walls to contain maze
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
  // fallback
  return { x: 1, y: 1 };
}

function initializeGame() {
  maze = generateMaze(cols, rows);

  // Set player and win to random empty cells
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

  // Draw win block if exists
  if (win) {
    ctx.fillStyle = "green";
    ctx.fillRect(win.x * cellSize, win.y * cellSize, cellSize, cellSize);
  }

  // Draw player block if exists
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

  if (drawMode === "draw") {
    if (typeMode === "player") {
      // Place player only on empty cells, remove old player
      if (maze[x][y] === 0) {
        player = { x, y };
      }
    } else if (typeMode === "win") {
      if (maze[x][y] === 0) {
        win = { x, y };
      }
    } else {
      // Place block types (wall, design, movable)
      maze[x][y] = getTypeValue(typeMode);
    }
  } else if (drawMode === "delete") {
    // Delete block or player/win if clicked
    if (typeMode === "player") {
      if (player && player.x === x && player.y === y) {
        player = null; // delete player
      }
    } else if (typeMode === "win") {
      if (win && win.x === x && win.y === y) {
        win = null; // delete win
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

initializeGame();

function loop() {
  movePlayer();
  draw();
  requestAnimationFrame(loop);
}

loop();
