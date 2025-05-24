// Create canvas and basic setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


// Load the Sprite Image with Error Handling
const walkImage = new Image();
walkImage.src = "assets/sprites/player_walk.png"; // Make sure this is saved in the correct folder

walkImage.onerror = () => {
  console.error("❌ Failed to load walking sprite sheet.");
};

// Animation Settings
const walkFrameCols = 2; // frames per row
const walkFrameRows = 2; // frames per column
const walkTotalFrames = 4;
let currentFrame = 0;
let frameTimer = 0;
const frameSpeed = 3;





// Player state
let player = {
  x: 100,
  y: 0,
  vx: 0,
  vy: 0,
  width: 40,
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
const gravity = 0.3;
const jumpStrength = -12;

// Ground generation
const segmentWidth = 20;
const groundSegments = [];
function generateGround() {
  for (let i = 0; i < canvas.width / segmentWidth + 100; i++) {
    groundSegments.push(80 + Math.sin(i * 0.5) * 30 + Math.random() * 20);
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

function drawGround() {
  ctx.fillStyle = "#4CAF50";
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  for (let i = 0; i < groundSegments.length; i++) {
    ctx.lineTo(i * segmentWidth, canvas.height - groundSegments[i]);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.closePath();
  ctx.fill();
}


function drawPlayer() {
  const isWalking = keys["KeyA"] || keys["KeyD"];
  const spriteImage = walkImage;


  const frameWidth = spriteImage.width / walkFrameCols;
  const frameHeight = spriteImage.height / walkFrameRows;

  // Update animation frame if walking
  if (isWalking) {
    frameTimer++;
    if (frameTimer >= frameSpeed) {
      currentFrame = (currentFrame + 1) % walkTotalFrames;
      frameTimer = 0;
    }
  } else {
    currentFrame = 0;
  }

  const col = currentFrame % walkFrameCols;
  const row = Math.floor(currentFrame / walkFrameCols);

  if (spriteImage.complete && spriteImage.naturalWidth > 0) {
    // Optional: flip for left movement
    const flip = keys["KeyA"] && !keys["KeyD"];

    ctx.save();
    if (flip) {
      ctx.translate(player.x + player.width, player.y);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(player.x, player.y);
    }

    ctx.drawImage(
      spriteImage,
      col * frameWidth, row * frameHeight,
      frameWidth, frameHeight,
      0, 0,
      player.width, player.height
    );
    ctx.restore();
  } else {
    ctx.fillStyle = "#37474F";
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }

  // Draw EM31 tool
  ctx.save();
  ctx.translate(player.x + player.width / 2, player.y + 30);
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updatePlayer();
  drawGround();
  drawPlayer();
  drawHUD();
  requestAnimationFrame(gameLoop);
}

//generateGround();
//gameLoop();

walkImage.onload = () => {
  generateGround();
  gameLoop();
};



