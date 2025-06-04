function handleMovement() {
  if (moveCooldown > 0) return;

  // Determine movement deltas
  let dx = 0;
  let dy = 0;

  if ((keys["ArrowUp"] || keys["w"]) && !(keys["ArrowDown"] || keys["s"])) dy = -1;
  else if ((keys["ArrowDown"] || keys["s"]) && !(keys["ArrowUp"] || keys["w"])) dy = 1;

  if ((keys["ArrowLeft"] || keys["a"]) && !(keys["ArrowRight"] || keys["d"])) dx = -1;
  else if ((keys["ArrowRight"] || keys["d"]) && !(keys["ArrowLeft"] || keys["a"])) dx = 1;

  if (dx !== 0 && dy !== 0) {
    // Diagonal move, ignore collisions so player can go through blocks diagonally
    let nx = player.x + dx;
    let ny = player.y + dy;

    // Keep player within bounds
    if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
      player.x = nx;
      player.y = ny;
      moveCooldown = MOVE_DELAY;
      checkWin();
      draw();
    }
  } else if (dx !== 0 || dy !== 0) {
    // Single axis move: check collision normally
    let nx = player.x + dx;
    let ny = player.y + dy;
    if (canMoveTo(nx, ny)) {
      player.x = nx;
      player.y = ny;
      moveCooldown = MOVE_DELAY;
      checkWin();
      draw();
    }
  }
}
