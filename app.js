const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let snake = [{ x: 200, y: 200 }];
let dx = 20;
let dy = 0;
let food = { x: 100, y: 100 };
let score = 0;

let paused = false;

function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "lime";
  snake.forEach(part => ctx.fillRect(part.x, part.y, 20, 20));

  ctx.fillStyle = "red";
  ctx.fillRect(food.x, food.y, 20, 20);
}

function update() {
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Wall collision
  if (
    head.x < 0 || head.y < 0 ||
    head.x >= canvas.width || head.y >= canvas.height
  ) {
    resetGame();
    return;
  }

  // Self collision
  if (snake.some(part => part.x === head.x && part.y === head.y)) {
    resetGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    document.getElementById("score").textContent = score;
    food.x = Math.floor(Math.random() * 20) * 20;
    food.y = Math.floor(Math.random() * 20) * 20;
  } else {
    snake.pop();
  }
}

function resetGame() {
  snake = [{ x: 200, y: 200 }];
  dx = 20;
  dy = 0;
  score = 0;
  document.getElementById("score").textContent = score;
}

document.addEventListener("keydown", e => {
  switch (e.key) {
    case "ArrowUp": if (dy === 0) { dx = 0; dy = -20; } break;
    case "ArrowDown": if (dy === 0) { dx = 0; dy = 20; } break;
    case "ArrowLeft": if (dx === 0) { dx = -20; dy = 0; } break;
    case "ArrowRight": if (dx === 0) { dx = 20; dy = 0; } break;
  }
});

function loop() {
  if (!paused) {
    update();
  }
  draw();
}

setInterval(loop, 100);

const pauseBtn = document.getElementById("pauseBtn");

pauseBtn.addEventListener("click", () => {
  paused = !paused;

  if (paused) {
    pauseBtn.textContent = "Resume";
  } else {
    pauseBtn.textContent = "Pause";
  }
});
