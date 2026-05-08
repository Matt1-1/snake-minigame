const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const usernameInput = document.getElementById("usernameInput");
const playerNameDisplay = document.getElementById("playerName");
const scoreDisplay = document.getElementById("score");
const bestScoreDisplay = document.getElementById("bestScore");
const playerRankDisplay = document.getElementById("playerRank");
const pauseBtn = document.getElementById("pauseBtn");
const resetScoresBtn = document.getElementById("resetScoresBtn");

const GRID = 20;
const COLS = canvas.width / GRID;   // 20
const ROWS = canvas.height / GRID;  // 20

let currentPlayer = "";
let gameStarted = false;
let paused = false;
let gameLoopInterval = null;

let snake, dx, dy, nextDx, nextDy, food, score;

let leaderboard = JSON.parse(localStorage.getItem("snakeLeaderboard") || "{}");

// ─── Init / Reset ────────────────────────────────────────────────
function initGame() {
  snake  = [{ x: 10, y: 10 }];
  dx     = 1;  dy     = 0;
  nextDx = 1;  nextDy = 0;
  score  = 0;
  scoreDisplay.textContent = 0;
  placeFood();
}

function placeFood() {
  do {
    food = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS)
    };
  } while (snake.some(p => p.x === food.x && p.y === food.y));
}

// ─── Game Over ───────────────────────────────────────────────────
function gameOver() {
  gameStarted = false;
  clearInterval(gameLoopInterval);

  // Save best score
  if (currentPlayer) {
    const prev = leaderboard[currentPlayer] || 0;
    if (score > prev) leaderboard[currentPlayer] = score;
    localStorage.setItem("snakeLeaderboard", JSON.stringify(leaderboard));
    updateLeaderboardUI();
    updatePlayerStats();
  }

  // Show game over on canvas
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.font = "bold 32px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = "18px Arial";
  ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 + 24);
  ctx.font = "14px Arial";
  ctx.fillStyle = "#aaa";
  ctx.fillText("Press ENTER to play again", canvas.width / 2, canvas.height / 2 + 52);

  // Re-enable input for new game
  usernameInput.disabled = false;
  usernameInput.value = currentPlayer;
}

// ─── Update ──────────────────────────────────────────────────────
function update() {
  // Apply buffered direction
  dx = nextDx;
  dy = nextDy;

  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Wall collision ← THIS is the fix (grid units, not pixels)
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    gameOver();
    return;
  }

  // Self collision
  if (snake.some(p => p.x === head.x && p.y === head.y)) {
    gameOver();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreDisplay.textContent = score;
    placeFood();
  } else {
    snake.pop();
  }
}

// ─── Draw ────────────────────────────────────────────────────────
function draw() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Food
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(
    food.x * GRID + GRID / 2,
    food.y * GRID + GRID / 2,
    GRID / 2 - 1, 0, Math.PI * 2
  );
  ctx.fill();

  // Snake
  snake.forEach((part, i) => {
    ctx.fillStyle = i === 0 ? "lime" : "#22c55e";
    ctx.fillRect(part.x * GRID + 1, part.y * GRID + 1, GRID - 2, GRID - 2);
  });
}

function loop() {
  if (!paused) update();
  draw();
}

// ─── Input: keyboard ─────────────────────────────────────────────
document.addEventListener("keydown", e => {
  // Start / restart on Enter
  if (e.key === "Enter" && !gameStarted && currentPlayer) {
    startGame();
    return;
  }

  if (!gameStarted) return;

  // Buffer next direction (prevent 180° reversal)
  switch (e.key) {
    case "ArrowUp":    case "w": case "W": if (dy ===  0) { nextDx = 0; nextDy = -1; } break;
    case "ArrowDown":  case "s": case "S": if (dy ===  0) { nextDx = 0; nextDy =  1; } break;
    case "ArrowLeft":  case "a": case "A": if (dx ===  0) { nextDx = -1; nextDy = 0; } break;
    case "ArrowRight": case "d": case "D": if (dx ===  0) { nextDx =  1; nextDy = 0; } break;
  }
});

// ─── Input: username ─────────────────────────────────────────────
usernameInput.addEventListener("keydown", e => {
  if (e.key !== "Enter") return;

  const name = usernameInput.value.trim();
  if (!name) { alert("Please enter a username"); return; }

  currentPlayer = name;
  playerNameDisplay.textContent = currentPlayer;
  usernameInput.disabled = true;

  startGame();
});

function startGame() {
  if (gameLoopInterval) clearInterval(gameLoopInterval);
  initGame();
  gameStarted = true;
  paused = false;
  pauseBtn.textContent = "Pause";
  gameLoopInterval = setInterval(loop, 100);
}

// ─── Pause ───────────────────────────────────────────────────────
pauseBtn.addEventListener("click", () => {
  if (!gameStarted) return;
  paused = !paused;
  pauseBtn.textContent = paused ? "Resume" : "Pause";
});

// ─── Reset scores ────────────────────────────────────────────────
resetScoresBtn.addEventListener("click", () => {
  if (!confirm("Reset all scores?")) return;
  leaderboard = {};
  localStorage.removeItem("snakeLeaderboard");
  updateLeaderboardUI();
  updatePlayerStats();
});

// ─── Leaderboard UI ──────────────────────────────────────────────
function updateLeaderboardUI() {
  const list = document.getElementById("leaderboardList");
  const sorted = Object.entries(leaderboard)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  list.innerHTML = sorted.map(([name, sc], i) =>
    `<li style="padding:4px 0; ${i===0?'color:gold;font-weight:bold':''}">${name}: ${sc}</li>`
  ).join("") || "<li style='color:#666'>No scores yet</li>";
}

function updatePlayerStats() {
  if (!currentPlayer) return;
  const best = leaderboard[currentPlayer] || 0;
  bestScoreDisplay.textContent = best;

  const sorted = Object.entries(leaderboard).sort((a, b) => b[1] - a[1]);
  const rank = sorted.findIndex(([name]) => name === currentPlayer) + 1;
  playerRankDisplay.textContent = rank > 0 ? "#" + rank : "---";
}

// ─── Init draw ───────────────────────────────────────────────────
initGame();
draw();
updateLeaderboardUI();
