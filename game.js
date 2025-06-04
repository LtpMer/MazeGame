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
let currentBuildAction = null;

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
    if (keys["ArrowDown"] || keys["s"]) dy = 1;
    if (keys["ArrowLeft"] || keys["a"]) dx = -1;
    if (keys["ArrowRight"] || keys["d"]) dx = 1;

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

document.addEventListener("keydown", (e) => {
    keys[e.key] = true;
});
document.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

canvas.addEventListener("click", (e) => {
    if (!buildMode || !currentBuildAction) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    if ((x === player.x && y === player.y) || (x === win.x && y === win.y)) return;

    if (currentBuildAction === "draw") {
        maze[x][y] = 1;
    } else if (currentBuildAction === "delete") {
        maze[x][y] = 0;
    }
});

document.getElementById("toggleBuild").onclick = () => {
    buildMode = !buildMode;
    document.getElementById("drawMode").style.display = buildMode ? "inline-block" : "none";
    document.getElementById("deleteMode").style.display = buildMode ? "inline-block" : "none";
    currentBuildAction = null;
};

document.getElementById("drawMode").onclick = () => {
    currentBuildAction = currentBuildAction === "draw" ? null : "draw";
};

document.getElementById("deleteMode").onclick = () => {
    currentBuildAction = currentBuildAction === "delete" ? null : "delete";
};

function loop() {
    movePlayer();
    draw();
    requestAnimationFrame(loop);
}

loop();
