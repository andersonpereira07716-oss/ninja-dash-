const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Configurações do Ninja (Jogador)
const ninja = {
  x: 50,
  y: 200,
  width: 40,
  height: 40,
  color: "#ff3e3e",
  vy: 0,
  gravity: 0.6,
  jumpStrength: -12,
  isGrounded: false
};

// Listas para gerir obstáculos/inimigos e estado do jogo
let obstacles = [];
let frameCount = 0;
let score = 0;
let gameOver = false;

// Evento de Salto (Teclado ou Toque na Ecrã)
function jump() {
  if (ninja.isGrounded && !gameOver) {
    ninja.vy = ninja.jumpStrength;
    ninja.isGrounded = false;
  } else if (gameOver) {
    restartGame();
  }
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") jump();
});
canvas.addEventListener("touchstart", jump);

// Função para gerar novos Obstáculos / Inimigos
function spawnObstacle() {
  // Cria um obstáculo a cada 90 frames (~1.5 segundos)
  if (frameCount % 90 === 0) {
    const isEnemy = Math.random() > 0.5; // 50% de hipótese de ser inimigo
    
    obstacles.push({
      x: canvas.width,
      y: isEnemy ? 180 : 220, // Inimigo voador/alto ou obstáculo no chão
      width: isEnemy ? 35 : 30,
      height: isEnemy ? 35 : 40,
      speed: 5 + Math.floor(score / 100), // Aumenta a velocidade com a pontuação
      type: isEnemy ? "enemy" : "obstacle",
      color: isEnemy ? "#a855f7" : "#eab308"
    });
  }
}

// Atualização da Lógica do Jogo
function update() {
  if (gameOver) return;

  frameCount++;
  score++; // Aumenta a pontuação ao longo do tempo

  // Aplicar gravidade ao Ninja
  ninja.vy += ninja.gravity;
  ninja.y += ninja.vy;

  // Deteção de chão (Chão na posição y = 220)
  if (ninja.y >= 220) {
    ninja.y = 220;
    ninja.vy = 0;
    ninja.isGrounded = true;
  }

  // Gerar e Mover Obstáculos
  spawnObstacle();

  for (let i = obstacles.length - 1; i >= 0; i--) {
    let obs = obstacles[i];
    obs.x -= obs.speed;

    // Deteção de Colisão (AABB - Axis-Aligned Bounding Box)
    if (
      ninja.x < obs.x + obs.width &&
      ninja.x + ninja.width > obs.x &&
      ninja.y < obs.y + obs.height &&
      ninja.y + ninja.height > obs.y
    ) {
      gameOver = true;
    }

    // Remover obstáculos que saíram da ecrã
    if (obs.x + obs.width < 0) {
      obstacles.splice(i, 1);
    }
  }
}

// Desenhar Elementos na Ecrã
function draw() {
  // Limpar Ecrã
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Desenhar Chão
  ctx.fillStyle = "#334155";
  ctx.fillRect(0, 260, canvas.width, 40);

  // Desenhar Ninja
  ctx.fillStyle = ninja.color;
  ctx.fillRect(ninja.x, ninja.y, ninja.width, ninja.height);

  // Desenhar Obstáculos e Inimigos
  obstacles.forEach((obs) => {
    ctx.fillStyle = obs.color;
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
  });

  // Desenhar Pontuação
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Arial";
  ctx.fillText(`Pontuação: ${score}`, 20, 35);

  // Ecrã de Game Over
  if (gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "18px Arial";
    ctx.fillText("Toque ou prima Espaço para Reiniciar", canvas.width / 2, canvas.height / 2 + 30);
    ctx.textAlign = "left";
  }
}

// Reiniciar Jogo
function restartGame() {
  obstacles = [];
  score = 0;
  frameCount = 0;
  ninja.y = 220;
  ninja.vy = 0;
  gameOver = false;
  gameLoop();
}

// Loop Principal
function gameLoop() {
  update();
  draw();
  if (!gameOver) {
    requestAnimationFrame(gameLoop);
  }
}

gameLoop();
