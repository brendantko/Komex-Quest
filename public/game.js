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
  jumpCount: 0,
  maxJumps: 2
};

// EM31 state
let em31 = {
  width: 200,
  height: 10,
  angle: 0,
  damage: 0,
  maxDamage: 100,
  balanceSpeed: 0.02,
  battery: 100,
  maxBattery: 100,
  scanning: false
};

// Gravity and movement
const gravity = 0.7;
const jumpStrength = -15;

// Ground generation
const segmentWidth = 20;
const groundSegments = [];
function generateGround() {
  let baseHeight = 120;
  let smoothness = 0.15;
  let height = baseHeight;
  for (let i = 0; i < 2000 / segmentWidth; i++) {
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
let jumpKeyHeld = false;
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);
canvas.addEventListener("mousemove", e => {
  const centerY = canvas.height / 2;
  const deltaY = (e.clientY - centerY) / canvas.height;
  em31.angle += deltaY * 0.05 - 0.01;
});

canvas.addEventListener("mousedown", () => {
  if (em31.battery > 0) em31.scanning = true;
});

canvas.addEventListener("mouseup", () => {
  em31.scanning = false;
});

// Game loop
function updatePlayer() {
  // Scan battery usage
  if (em31.scanning && em31.battery > 0) {
    em31.battery -= 0.5;
    if (em31.battery < 0) em31.battery = 0;
    scanObjects.forEach(obj => {
      if (!obj.found && Math.abs(obj.x - player.x) < 40) {
        obj.found = true;
        player.score += obj.points;
      }
    });
  } else {
    em31.scanning = false;
  }
  // Scan battery usage
  if (em31.scanning && em31.battery > 0) {
    em31.battery -= 0.5;
    if (em31.battery < 0) em31.battery = 0;
  } else {
    em31.scanning = false;
  }
  if (keys["KeyA"]) player.x -= 5;
  if (keys["KeyD"]) player.x += 5;
  if (keys["Space"] && player.jumpCount < player.maxJumps && !jumpKeyHeld) {
  player.vy = jumpStrength;
  player.jumpCount++;
  jumpKeyHeld = true;
  }

  player.vy += gravity;
  player.y += player.vy;

  const groundY = getGroundY(player.x);
  let onPlatform = false;

  skyPlatforms.forEach(p => {
    const isWithinX = player.x + player.width > p.x && player.x < p.x + p.width;
    const isFalling = player.vy >= 0;
    const isAbovePlatform = player.y + player.height <= p.y + player.vy;
    const willTouchPlatform = player.y + player.height + player.vy >= p.y;

    if (isWithinX && isFalling && isAbovePlatform && willTouchPlatform) {
      // Snap to platform
      player.y = p.y - player.height;
      player.vy = 0;
      player.isJumping = false;
      player.jumpCount = 0;
      onPlatform = true;
    }
  });

  if (!onPlatform && player.y + player.height > groundY) {
  player.y = groundY - player.height;
  player.vy = 0;
  player.isJumping = false;
  player.jumpCount = 0; // ✅ Reset double jump on ground contact
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



function drawSkyPlatforms(cameraX) {
  skyPlatforms.forEach(p => {
    const px = p.x - cameraX;
    const py = p.y;

    // Grass top
    ctx.fillStyle = "#4CAF50";
    ctx.fillRect(px, py, p.width, 6);

    // Dirt body
    ctx.fillStyle = "#8D6E63";
    ctx.fillRect(px, py + 6, p.width, p.height - 6);
  });
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

  if (em31.scanning) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
    ctx.beginPath();
    ctx.moveTo(px + player.width / 2, player.y + 30);
    ctx.lineTo(px + player.width / 2 - 40, player.y + 100);
    ctx.lineTo(px + player.width / 2 + 40, player.y + 100);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawHelicopter(cameraX) {
  const hx = helicopter.x - cameraX;
  const hy = getGroundY(helicopter.x) - helicopter.height - helicopter.offsetY;
  ctx.fillStyle = "#888";
  ctx.fillRect(hx, hy, helicopter.width, helicopter.height);

  // Draw rotors
  ctx.beginPath();
  ctx.arc(hx + helicopter.width / 2, hy - 10, 30, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hx + helicopter.width / 2 - 40, hy - 10);
  ctx.lineTo(hx + helicopter.width / 2 + 40, hy - 10);
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = "black";
  ctx.fillRect(hx + 10, hy + 10, 10, 10);
  ctx.fillRect(hx + 80, hy + 10, 10, 10);

  if (!playerInHelicopter && Math.abs(player.x - helicopter.x) < 60) {
    ctx.fillStyle = "black";
    ctx.font = "18px Arial";
    ctx.fillText("Press H to board", hx - 30, hy - 10);
  }

  if (helicopter.takingOff) {
    helicopter.offsetY += 3;
  }
}

function drawHUD() {
  ctx.fillStyle = "black";
  ctx.font = "16px Arial";
  ctx.fillText("Damage: " + Math.floor(em31.damage), 10, 20);
  ctx.fillText("Score: " + player.score, 10, 40);
  ctx.fillText("Battery: " + Math.floor(em31.battery), 10, 60);
}

function drawScanObjects(cameraX) {
  scanObjects.forEach(obj => {
    if (obj.found) {
      const ox = obj.x - cameraX;
      const oy = obj.y;
      ctx.fillStyle = obj.type === "rock" ? "#555" : "#ccc";
      if (obj.type === "skull") {
        ctx.beginPath();
        ctx.arc(ox, oy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "black";
        ctx.fillRect(ox - 2, oy - 2, 1, 1);
        ctx.fillRect(ox + 1, oy - 2, 1, 1);
      } else {
        ctx.beginPath();
        ctx.ellipse(ox, oy, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

function gameLoop() {
  // Sky background
ctx.fillStyle = "#aaaaaa";
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
// ctx.clearRect removed to preserve sky and clouds
  updatePlayer();

  const cameraX = Math.max(0, player.x - canvas.width / 2);
  if (player.x < 50) player.x = 50; // prevent backtracking too far

  drawGround(cameraX);

  drawSkyPlatforms(cameraX);

  if (!playerInHelicopter) drawPlayerWithCamera(cameraX);
  drawHelicopter(cameraX);
drawScanObjects(cameraX);
drawHUD();
  frameCount++;
  requestAnimationFrame(gameLoop);
}

let frameCount = 0;
let helicopter = {
  x: 1950,
  y: 0,
  width: 100,
  height: 40,
  takingOff: false,
  offsetY: 0
};

let playerInHelicopter = false;

// Sky Platforms
const skyPlatforms = [];

function generateSkyPlatforms() {
  const spacing = 400; // space between platforms
  const baseY = canvas.height / 2;

  for (let i = 0; i < 4; i++) {
    skyPlatforms.push({
      x: 300 + i * spacing,
      y: baseY - Math.random() * 100, // vary the height a bit
      width: 250, // wider platforms
      height: 20
    });
  }
}



window.addEventListener("keydown", e => {
  if (e.code === "KeyH" && Math.abs(player.x - helicopter.x) < 60) {
    playerInHelicopter = true;
    helicopter.takingOff = true;
    setTimeout(() => {
      resetPlayer();
      helicopter.takingOff = false;
      helicopter.offsetY = 0;
      playerInHelicopter = false;
    }, 1500);
  }
});

// Detect Key Release for Space (avoids jump spamming)
window.addEventListener("keyup", e => {
  keys[e.code] = false;
  if (e.code === "Space") jumpKeyHeld = false;
});


// Object definitions for scanning
const scanObjects = [];
for (let i = 100; i < 1900; i += Math.random() * 300 + 100) {
  scanObjects.push({
    x: i,
    y: getGroundY(i) + 10 + Math.random() * 30,
    found: false,
    type: Math.random() > 0.5 ? "rock" : "skull",
    points: Math.random() > 0.5 ? 100 : 500
  });
}

generateGround();
generateSkyPlatforms();
gameLoop();
