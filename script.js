const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 300;
let groundY = 220;

let rider = {
  x: 50,
  y: groundY,
  width: 60,
  height: 40,
  vy: 0,
  jumping: false
};

let fireParticles = [];
let obstacles = [];
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let worldHighScore = 0;
let speed = 0;
let gameOver = false;
let gameStarted = false;
let isPaused = false;
let obstacleSpeed = 4;

// ⏱️ Running time tracking
let startTime = null;
let elapsedTime = 0;

function jump(event) {
  event?.preventDefault?.();
  if (!rider.jumping && gameStarted && !isPaused) {
    rider.vy = -18;
    rider.jumping = true;
    speed = Math.max(0, speed - 7);
    addFire();
  }
}

// Controls
window.addEventListener("touchstart", jump);
window.addEventListener("mousedown", jump);
document.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowUp") jump();
});

function addFire() {
  for (let i = 0; i < 5; i++) {
    fireParticles.push({
      x: rider.x,
      y: rider.y + 30,
      size: Math.random() * 5 + 3,
      vy: Math.random() * -2,
      alpha: 1
    });
  }
}

function drawFire() {
  for (let p of fireParticles) {
    ctx.fillStyle = `rgba(255, 69, 0, ${p.alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    p.x -= 2;
    p.y += p.vy;
    p.alpha -= 0.03;
  }
  fireParticles = fireParticles.filter(p => p.alpha > 0);
}

function spawnObstacle() {
  if ((score < 2000 && obstacles.length >= 1) || (score >= 2000 && obstacles.length >= 2)) return;

  let last = obstacles[obstacles.length - 1];
  if (last && canvas.width - last.x < 250) return;

  let type = Math.random() > 0.5 ? 'car' : 'stone';
  let width = type === 'car' ? 70 : 40;

  obstacles.push({ x: canvas.width + 50, y: 240, width, height: 30, type });
}

function drawRider() {
  ctx.fillStyle = "#333";
  ctx.fillRect(rider.x, rider.y, rider.width, rider.height);
}

function drawObstacle(obs) {
  ctx.fillStyle = obs.type === 'car' ? "blue" : "gray";
  ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
}

function checkCollision(obs) {
  return (
    rider.x < obs.x + obs.width &&
    rider.x + rider.width > obs.x &&
    rider.y < obs.y + obs.height &&
    rider.y + rider.height > obs.y
  );
}

function restartGame() {
  obstacles = [];
  fireParticles = [];
  score = 0;
  speed = 0;
  obstacleSpeed = 4;
  rider.y = groundY;
  rider.vy = 0;
  rider.jumping = false;
  gameOver = false;
  gameStarted = true;
  isPaused = false;

  startTime = Date.now(); // Start time set
  elapsedTime = 0;

  document.getElementById("game-over").style.display = "none";
  document.getElementById("pause-button").innerText = "⏸ Pause";

  requestAnimationFrame(update);
}

function togglePause() {
  if (!gameStarted || gameOver) return;

  isPaused = !isPaused;
  document.getElementById("pause-button").innerText = isPaused ? "▶ Resume" : "⏸ Pause";

  // resume game loop if unpaused
  if (!isPaused) {
    startTime = Date.now() - elapsedTime * 1000; // resume from where it paused
    requestAnimationFrame(update);
  }
}

function update() {
  if (gameOver || !gameStarted || isPaused) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Physics
  rider.vy += 0.7;
  rider.y += rider.vy;

  if (rider.y < 2) {
    rider.y = 2;
    rider.vy = 0;
  }

  if (rider.y >= groundY) {
    rider.y = groundY;
    rider.vy = 0;
    rider.jumping = false;
  }

  drawRider();
  drawFire();
  spawnObstacle();

  for (let i = 0; i < obstacles.length; i++) {
    let obs = obstacles[i];
    obs.x -= obstacleSpeed;
    drawObstacle(obs);

    if (checkCollision(obs)) {
      gameOver = true;
      gameStarted = false;
      document.getElementById("game-over").style.display = "block";
      if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore);
      }
      return;
    }
  }

  obstacles = obstacles.filter(obs => obs.x + obs.width > 0);

  if (score % 500 === 0 && obstacleSpeed < 8) {
    obstacleSpeed += 0.1;
  }

  score++;
  if (speed < 777) speed++;

  // ⏱️ Update time display
  elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  let minutes = String(Math.floor(elapsedTime / 60)).padStart(2, '0');
  let seconds = String(elapsedTime % 60).padStart(2, '0');

  document.getElementById("score").innerText = "Score: " + score;
  document.getElementById("high-score").innerText = "High: " + highScore;
  document.getElementById("speed").innerText = "Speed: " + speed;
  document.getElementById("time").innerText = "Time: " + minutes + ":" + seconds;

  requestAnimationFrame(update);
}
