// Create canvas and basic setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Player state
let player = {
  x: 100,
  y: 0,
  vx: 0,
  vy: 0,
  width: 30,
  height: 60,
  isJumping: false,
  score: 0,
};

// EM31 state
let em31 = {
  width: 200,
  height: 10,
  angle: 0,
  damage: 0,
  maxDamage: 100,
  balanceSpeed: 0.02
};

// Gravity and movement
const gravity = 0.8;
const jumpStrength = -15;

// Ground generation
const segmentWidth = 20;
const groundSegments = [];
function generateGround() {
  let baseHeight = 120;
  let smoothness = 0.15;
  let height = baseHeight;
  for (let i = 0; i < canvas.width / segmentWidth + 300; i++) {
    let variation = (Math.random() - 0.5) * 20;
    height += variation * smoothness;
    height = Math.max(50, Math.min(200, height));
    groundSegments.push(height);
  }
  }
  

function getGroundY(x) {
  const index = Math.floor(x / segmentWidth);
  return canvas.height - (groundSegments[index] || 100);
}

// Controls
const keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);
canvas.addEventListener("mousemove", e => {
  const centerY = canvas.height / 2;
  const deltaY = (e.clientY - centerY) / canvas.height;
  em31.angle += deltaY * 0.05 - 0.01;
});

// Game loop
function updatePlayer() {
  if (keys["KeyA"]) player.x -= 5;
  if (keys["KeyD"]) player.x += 5;
  if (keys["Space"] && !player.isJumping) {
    player.vy = jumpStrength;
    player.isJumping = true;
  }
  player.vy += gravity;
  player.y += player.vy;

  const groundY = getGroundY(player.x);
  if (player.y + player.height > groundY) {
    player.y = groundY - player.height;
    player.vy = 0;
    player.isJumping = false;
  }

  // EM31 damage logic
  const em31TipY = player.y + 30 + Math.sin(em31.angle) * 20;
  if (Math.abs(em31.angle) > 0.6 || em31TipY > groundY) {
    em31.damage += 0.3;
    if (em31.damage >= em31.maxDamage) {
      resetPlayer();
    }
  }
}

function resetPlayer() {
  player.x = 100;
  player.y = 0;
  player.vy = 0;
  player.isJumping = false;
  player.score = 0;
  em31.damage = 0;
  em31.angle = 0;
}

function drawGround(cameraX = 0) {
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  for (let i = 0; i < groundSegments.length; i++) {
    const x = i * segmentWidth - cameraX;
    const y = canvas.height - groundSegments[i];
    ctx.lineTo(x, y);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.closePath();
  ctx.fillStyle = "#4CAF50";
  ctx.fill();

  ctx.beginPath();
  for (let i = 0; i < groundSegments.length; i++) {
    const x = i * segmentWidth - cameraX;
    const y = canvas.height - groundSegments[i];
    ctx.lineTo(x, y);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.closePath();
  ctx.fillStyle = "#6D4C41";
  ctx.fill();
}


function drawPlayerWithCamera(cameraX) {
  const px = player.x - cameraX;
  ctx.fillStyle = "#37474F";
  ctx.fillRect(px, player.y, player.width, player.height);
  ctx.beginPath();
  ctx.arc(px + player.width / 2, player.y - 10, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#FFCCBC";
  ctx.fill();

  ctx.save();
  ctx.translate(px + player.width / 2, player.y + 30);
  ctx.rotate(em31.angle);
  ctx.fillStyle = "white";
  ctx.fillRect(-em31.width / 2, -em31.height / 2, em31.width, em31.height);
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = "black";
  ctx.font = "16px Arial";
  ctx.fillText("Damage: " + Math.floor(em31.damage), 10, 20);
  ctx.fillText("Score: " + player.score, 10, 40);
}

function gameLoop() {
  // Sky background
ctx.fillStyle = "#87CEEB";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Draw random clouds
for (let i = 0; i < 10; i++) {
  const cloudX = (i * 300 + frameCount * 0.2) % (canvas.width + 300) - 150;
  const cloudY = 50 + Math.sin(i) * 20;
  ctx.beginPath();
  ctx.arc(cloudX, cloudY, 30, 0, Math.PI * 2);
  ctx.arc(cloudX + 40, cloudY + 10, 25, 0, Math.PI * 2);
  ctx.arc(cloudX - 40, cloudY + 10, 25, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
}
ctx.clearRect(0, 0, canvas.width, canvas.height);
  updatePlayer();

  const cameraX = Math.max(0, player.x - canvas.width / 2);
  if (player.x < 50) player.x = 50; // prevent backtracking too far

  drawGround(cameraX);
  drawPlayerWithCamera(cameraX);
  drawHUD();
  frameCount++;
  requestAnimationFrame(gameLoop);
}

let frameCount = 0;
generateGround();
gameLoop();
