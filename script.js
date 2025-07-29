const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 300;

let groundY = 250; // road height
let riderOffset = -11; // 🔹 distance from road

const bikeImg = new Image();
bikeImg.src = "images/bike.png";

const carImg = new Image();
carImg.src = "assets/car.png";

const stoneImg = new Image();
stoneImg.src = "images/box.png";

// ⬇️ DOM references for media control
const bgVideo = document.getElementById("bg-video");
const startImage = document.getElementById("start-image");
const bgMusic = document.getElementById("bg-music"); // Optional: if you have <audio id="bg-music">

let rider = {
  x: 40,
  y: groundY - 70 - riderOffset,
  width: 70,
  height: 70,
  vy: 1,
  jumping: false
};

let fireParticles = [];
let obstacles = [];
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let speed = 0;
let gameOver = false;
let gameStarted = false;
let isPaused = false;
let obstacleSpeed = 5;
let startTime = null;
let elapsedTime = 0;
let gravityUp = 0.2;
let gravityDown = 0.2;

function jump(event) {
  event?.preventDefault?.();
  if (!rider.jumping && gameStarted && !isPaused) {
    rider.vy = -18;
    rider.jumping = true;
    speed = Math.max(0, speed - 190);
    addFire();
  }
}

window.addEventListener("touchstart", jump);
window.addEventListener("mousedown", jump);
document.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowUp") jump();
});

function addFire() {
  for (let i = 0; i < 5; i++) {
    fireParticles.push({
      x: rider.x,
      y: rider.y + 20,
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
  if ((score < 7777 && obstacles.length >= 1) || (score >= 7777 && obstacles.length >= 2)) return;
  let last = obstacles[obstacles.length - 1];
  if (last && canvas.width - last.x < 515) return;

  let type = Math.random() > 1 ? "car" : "stone";
  let width = 55;

  obstacles.push({
    x: canvas.width + 10,
    y: groundY - 30,
    width,
    height: 50,
    type
  });
}

function drawRoad() {
  ctx.fillStyle = "#1d1e1f";
  ctx.fillRect(0, groundY, canvas.width, 50);
}

function drawRider() {
  ctx.drawImage(bikeImg, rider.x, rider.y, rider.width, rider.height);
}

function drawObstacle(obs) {
  if (obs.type === "car") {
    ctx.drawImage(carImg, obs.x, obs.y, obs.width, obs.height);
  } else {
    ctx.drawImage(stoneImg, obs.x, obs.y, obs.width, obs.height);
  }
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
  // 🔹 Show game screen
  startImage.style.display = "none";
  bgVideo.style.display = "block";
  bgVideo.play();

  if (bgMusic) {
    bgMusic.currentTime = 0;
    bgMusic.play();
  }

  obstacles = [];
  fireParticles = [];
  score = 0;
  speed = 0;
  obstacleSpeed = 4;
  rider.y = groundY - rider.height - riderOffset;
  rider.vy = 0;
  rider.jumping = false;
  gameOver = false;
  gameStarted = true;
  isPaused = false;
  startTime = Date.now();
  elapsedTime = 0;

  document.getElementById("game-over").style.display = "none";
  document.getElementById("pause-button").innerText = "⏸ Pause";

  requestAnimationFrame(update);
}

function togglePause() {
  if (!gameStarted || gameOver) return;
  isPaused = !isPaused;

  document.getElementById("pause-button").innerText = isPaused ? "▶ Resume" : "⏸ Pause";

  if (bgMusic) isPaused ? bgMusic.pause() : bgMusic.play();
  if (bgVideo) isPaused ? bgVideo.pause() : bgVideo.play();

  if (!isPaused) {
    startTime = Date.now() - elapsedTime * 1000;
    requestAnimationFrame(update);
  }
}

function update() {
  if (gameOver || !gameStarted || isPaused) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRoad();

  if (rider.vy < 1) {
    rider.vy += gravityUp;
  } else {
    rider.vy += gravityDown;
  }

  rider.y += rider.vy;

  if (rider.y < 1) {
    rider.y = 1;
    rider.vy = 0;
  }

  if (rider.y >= groundY - rider.height - riderOffset) {
    rider.y = groundY - rider.height - riderOffset;
    rider.vy = 0.2;
    rider.jumping = false;
  }

  drawRider();
  drawFire();
  spawnObstacle();

  for (let obs of obstacles) {
    obs.x -= obstacleSpeed;
    drawObstacle(obs);

    if (checkCollision(obs)) {
      gameOver = true;
      gameStarted = false;
      document.getElementById("game-over").style.display = "block";
      if (bgMusic) bgMusic.pause();
      if (bgVideo) bgVideo.pause();

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

  elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  let minutes = String(Math.floor(elapsedTime / 60)).padStart(2, "0");
  let seconds = String(elapsedTime % 60).padStart(2, "0");

  document.getElementById("score").innerText = "Score: " + score;
  document.getElementById("high-score").innerText = "Hi: " + highScore;
  document.getElementById("speed").innerText = "Speed: " + speed;
  document.getElementById("time").innerText = "Time: " + minutes + ":" + seconds;

  requestAnimationFrame(update);
}

function toggleAccordion(header) {
  const content = header.nextElementSibling;
  const arrow = header.querySelector('.arrow');
  content.classList.toggle('active');
  arrow.textContent = content.classList.contains('active') ? '▲' : '▼';
}
