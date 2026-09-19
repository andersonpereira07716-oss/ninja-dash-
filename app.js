// ==========================================
// GAME STATE
// ==========================================

const game = {
  running: false,
  paused: false,
  score: 0,
  coins: 0,
  speed: 4,
  lastTime: 0,
  obstacleTimer: 0,
  coinTimer: 0,
  difficultyTimer: 0
};

const player = {
  x: 60,
  y: 0,
  width: 42,
  height: 55,
  velocityY: 0,
  gravity: 0.7,
  jumpPower: -13,
  jumps: 0,
  maxJumps: 2
};

let obstacles = [];
let collectibleCoins = [];


// ==========================================
// STORAGE
// ==========================================

const defaultData = {
  highScore: 0,
  coins: 0,
  selectedCharacter: "ninja",
  unlockedCharacters: ["ninja"],
  soundEnabled: true,
  vibrationEnabled: true
};

let saveData = { ...defaultData };

function loadGame() {
  const saved = localStorage.getItem("ninjaDashSave");

  if (saved) {
    try {
      saveData = {
        ...defaultData,
        ...JSON.parse(saved)
      };
    } catch {
      saveData = { ...defaultData };
    }
  }

  updateAllUI();
}

function saveGame() {
  localStorage.setItem(
    "ninjaDashSave",
    JSON.stringify(saveData)
  );

  updateAllUI();
}

function resetGameData() {
  localStorage.removeItem("ninjaDashSave");
  saveData = { ...defaultData };
  updateAllUI();
}


// ==========================================
// SCREENS
// ==========================================

const screens = document.querySelectorAll(".screen");

function showScreen(screenId) {
  screens.forEach(screen => {
    screen.classList.remove("active");
  });

  const screen = document.getElementById(screenId);

  if (screen) {
    screen.classList.add("active");
  }
}

function updateAllUI() {
  document.getElementById("menuHighScore").textContent =
    saveData.highScore;

  document.getElementById("gameHighScore").textContent =
    saveData.highScore;

  document.getElementById("characterCoins").textContent =
    saveData.coins;

  document.getElementById("shopCoins").textContent =
    saveData.coins;

  document.getElementById("soundToggle").textContent =
    saveData.soundEnabled ? "ON" : "OFF";

  document.getElementById("vibrationToggle").textContent =
    saveData.vibrationEnabled ? "ON" : "OFF";
}


// ==========================================
// CANVAS
// ==========================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  player.x = Math.max(
    35,
    canvas.width * 0.12
  );

  if (player.y === 0) {
    player.y = groundY() - player.height;
  }
}

function groundY() {
  return canvas.height * 0.70;
}

window.addEventListener("resize", resizeCanvas);


// ==========================================
// PLAYER
// ==========================================

function resetPlayer() {
  player.y = groundY() - player.height;
  player.velocityY = 0;
  player.jumps = 0;
}

function jump() {
  if (!game.running || game.paused) return;

  if (player.jumps < player.maxJumps) {

    player.velocityY = player.jumpPower;
    player.jumps++;

    vibrate(30);
  }
}

function updatePlayer(delta) {

  player.velocityY += player.gravity * delta;
  player.y += player.velocityY * delta;

  const floor = groundY() - player.height;

  if (player.y >= floor) {
    player.y = floor;
    player.velocityY = 0;
    player.jumps = 0;
  }
}


// ==========================================
// OBSTACLES
// ==========================================

function createObstacle() {

  const height = 35 + Math.random() * 35;
  const width = 25 + Math.random() * 25;

  obstacles.push({
    x: canvas.width + 30,
    y: groundY() - height,
    width,
    height
  });
}

function updateObstacles(delta) {

  obstacles.forEach(obstacle => {
    obstacle.x -= game.speed * delta;
  });

  obstacles = obstacles.filter(
    obstacle => obstacle.x + obstacle.width > 0
  );

  game.obstacleTimer += delta;

  const spawnTime = Math.max(
    55,
    110 - game.speed * 8
  );

  if (game.obstacleTimer > spawnTime) {
    createObstacle();
    game.obstacleTimer = 0;
  }
}


// ==========================================
// COINS
// ==========================================

function createCoin() {

  collectibleCoins.push({
    x: canvas.width + 30,
    y: groundY() - 80 - Math.random() * 120,
    radius: 10
  });
}

function updateCoins(delta) {

  collectibleCoins.forEach(coin => {
    coin.x -= game.speed * delta;
  });

  collectibleCoins =
    collectibleCoins.filter(
      coin => coin.x + coin.radius > 0
    );

  game.coinTimer += delta;

  if (game.coinTimer > 80) {
    createCoin();
    game.coinTimer = 0;
  }
}


// ==========================================
// COLLISION
// ==========================================

function collision(a, b) {

  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function coinCollision(coin) {

  const closestX = Math.max(
    player.x,
    Math.min(
      coin.x,
      player.x + player.width
    )
  );

  const closestY = Math.max(
    player.y,
    Math.min(
      coin.y,
      player.y + player.height
    )
  );

  const distanceX = coin.x - closestX;
  const distanceY = coin.y - closestY;

  return (
    distanceX * distanceX +
    distanceY * distanceY
  ) < coin.radius * coin.radius;
}


// ==========================================
// GAME LOGIC
// ==========================================

function checkCollisions() {

  for (const obstacle of obstacles) {

    if (collision(player, obstacle)) {
      endGame();
      return;
    }
  }

  collectibleCoins =
    collectibleCoins.filter(coin => {

      if (coinCollision(coin)) {

        game.coins++;
        game.score += 10;

        vibrate(20);

        return false;
      }

      return true;
    });
}

function updateScore(delta) {

  game.score += 0.08 * delta;

  document.getElementById("scoreDisplay").textContent =
    Math.floor(game.score);

  document.getElementById("gameCoinsDisplay").textContent =
    game.coins;

  if (game.score > saveData.highScore) {

    document.getElementById("gameHighScore").textContent =
      Math.floor(game.score);
  }
}

function increaseDifficulty(delta) {

  game.difficultyTimer += delta;

  if (game.difficultyTimer > 500) {

    game.speed += 0.5;
    game.difficultyTimer = 0;
  }
}


// ==========================================
// DRAW
// ==========================================

function drawBackground() {

  ctx.fillStyle = "#080B12";
  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  // Lua
  ctx.beginPath();
  ctx.arc(
    canvas.width - 70,
    100,
    35,
    0,
    Math.PI * 2
  );

  ctx.fillStyle = "#111827";
  ctx.fill();

  // estrelas
  for (let i = 0; i < 25; i++) {

    const x = (i * 97) % canvas.width;
    const y = (i * 53) % (groundY() - 80);

    ctx.fillStyle = "#263244";

    ctx.fillRect(
      x,
      y,
      2,
      2
    );
  }

  // chão
  ctx.fillStyle = "#111827";

  ctx.fillRect(
    0,
    groundY(),
    canvas.width,
    canvas.height - groundY()
  );

  ctx.strokeStyle = "#00E5FF";
  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(
    0,
    groundY()
  );

  ctx.lineTo(
    canvas.width,
    groundY()
  );

  ctx.stroke();
}

function drawPlayer() {

  const x = player.x;
  const y = player.y;

  // corpo
  ctx.fillStyle = "#00E5FF";

  ctx.fillRect(
    x + 8,
    y + 15,
    27,
    35
  );

  // cabeça
  ctx.fillStyle = "#202938";

  ctx.beginPath();

  ctx.arc(
    x + 21,
    y + 12,
    14,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // faixa
  ctx.fillStyle = "#FF3D81";

  ctx.fillRect(
    x + 7,
    y + 8,
    28,
    5
  );

  // olhos
  ctx.fillStyle = "#FFFFFF";

  ctx.fillRect(
    x + 14,
    y + 13,
    5,
    3
  );

  ctx.fillRect(
    x + 24,
    y + 13,
    5,
    3
  );

  // pernas
  ctx.fillStyle = "#00E5FF";

  ctx.fillRect(
    x + 9,
    y + 47,
    9,
    8
  );

  ctx.fillRect(
    x + 26,
    y + 47,
    9,
    8
  );
}

function drawObstacles() {

  obstacles.forEach(obstacle => {

    ctx.fillStyle = "#FF3D81";

    ctx.shadowBlur = 12;
    ctx.shadowColor = "#FF3D81";

    ctx.fillRect(
      obstacle.x,
      obstacle.y,
      obstacle.width,
      obstacle.height
    );

    ctx.shadowBlur = 0;
  });
}

function drawCoins() {

  collectibleCoins.forEach(coin => {

    ctx.beginPath();

    ctx.arc(
      coin.x,
      coin.y,
      coin.radius,
      0,
      Math.PI * 2
    );

    ctx.fillStyle = "#FFD43B";

    ctx.shadowBlur = 10;
    ctx.shadowColor = "#FFD43B";

    ctx.fill();

    ctx.shadowBlur = 0;
  });
}

function drawGame() {

  drawBackground();
  drawCoins();
  drawObstacles();
  drawPlayer();
}


// ==========================================
// GAME LOOP
// ==========================================

function gameLoop(timestamp) {

  if (!game.running) return;

  if (!game.lastTime) {
    game.lastTime = timestamp;
  }

  let delta =
    (timestamp - game.lastTime) / 16.67;

  delta = Math.min(delta, 2);

  game.lastTime = timestamp;

  if (!game.paused) {

    updatePlayer(delta);
    updateObstacles(delta);
    updateCoins(delta);

    checkCollisions();

    updateScore(delta);
    increaseDifficulty(delta);
  }

  drawGame();

  requestAnimationFrame(gameLoop);
}


// ==========================================
// START GAME
// ==========================================

function startGame() {

  game.running = true;
  game.paused = false;

  game.score = 0;
  game.coins = 0;

  game.speed = 4;

  game.lastTime = 0;
  game.obstacleTimer = 0;
  game.coinTimer = 0;
  game.difficultyTimer = 0;

  obstacles = [];
  collectibleCoins = [];

  resetPlayer();

  document.getElementById("scoreDisplay").textContent = "0";
  document.getElementById("gameCoinsDisplay").textContent = "0";

  showScreen("gameScreen");

  requestAnimationFrame(gameLoop);
}


// ==========================================
// GAME OVER
// ==========================================

function endGame() {

  if (!game.running) return;

  game.running = false;

  const finalScore =
    Math.floor(game.score);

  const oldHighScore =
    saveData.highScore;

  const isNewRecord =
    finalScore > oldHighScore;

  if (isNewRecord) {
    saveData.highScore = finalScore;
  }

  saveData.coins += game.coins;

  saveGame();

  document.getElementById("finalScore").textContent =
    finalScore;

  document.getElementById("finalCoins").textContent =
    game.coins;

  document
    .getElementById("newRecord")
    .classList
    .toggle("hidden", !isNewRecord);

  showScreen("gameOverScreen");

  vibrate(150);
}


// ==========================================
// PAUSE
// ==========================================

function togglePause() {

  if (!game.running) return;

  game.paused = !game.paused;

  document.getElementById("pauseButton").textContent =
    game.paused ? "▶" : "⏸";
}


// ==========================================
// CHARACTERS
// ==========================================

const characters = [
  {
    id: "ninja",
    name: "Ninja",
    icon: "🥷",
    price: 0
  },
  {
    id: "shadow",
    name: "Shadow Ninja",
    icon: "👤",
    price: 100
  },
  {
    id: "cyber",
    name: "Cyber Ninja",
    icon: "🤖",
    price: 250
  },
  {
    id: "fire",
    name: "Fire Ninja",
    icon: "🔥",
    price: 500
  }
];

function renderCharacters() {

  const container =
    document.getElementById("charactersList");

  container.innerHTML = "";

  characters.forEach(character => {

    const unlocked =
      saveData.unlockedCharacters.includes(
        character.id
      );

    const selected =
      saveData.selectedCharacter ===
      character.id;

    const card =
      document.createElement("div");

    card.className = "character-card";

    let action = "";

    if (selected) {

      action = `
        <button class="game-button" disabled>
          ✓ SELECIONADO
        </button>
      `;

    } else if (unlocked) {

      action = `
        <button
          class="game-button primary character-select"
          data-id="${character.id}">
          SELECIONAR
        </button>
      `;

    } else {

      action = `
        <button
          class="game-button character-buy"
          data-id="${character.id}">
          🪙 ${character.price} MOEDAS
        </button>
      `;
    }

    card.innerHTML = `
      <div class="character-icon">
        ${character.icon}
      </div>

      <h3>${character.name}</h3>

      ${action}
    `;

    container.appendChild(card);
  });
}

function selectCharacter(id) {

  if (
    !saveData.unlockedCharacters.includes(id)
  ) {
    return;
  }

  saveData.selectedCharacter = id;

  saveGame();
  renderCharacters();
}

function buyCharacter(id) {

  const character =
    characters.find(c => c.id === id);

  if (!character) return;

  if (saveData.coins < character.price) {

    alert("Você não tem moedas suficientes.");
    return;
  }

  saveData.coins -= character.price;

  saveData.unlockedCharacters.push(id);

  saveData.selectedCharacter = id;

  saveGame();

  renderCharacters();
}


// ==========================================
// SHOP
// ==========================================

const PACOTES_MOEDAS = {
  100: '100_moedas',
  500: '500_moedas',
  1000: '1000_moedas',
};

function getDispositivoId() {
  let id = localStorage.getItem('ninjaDashDispositivoId');
  if (!id) {
    id = 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    localStorage.setItem('ninjaDashDispositivoId', id);
  }
  return id;
}

function buyDemoCoins(amount) {
  const pacote = PACOTES_MOEDAS[amount];
  if (!pacote) {
    alert('Pacote inválido.');
    return;
  }
  iniciarPagamentoPix(pacote, amount);
}

async function iniciarPagamentoPix(pacote, amount) {
  mostrarModalPix('Gerando pagamento PIX...', null, null);
  try {
    const resposta = await fetch('/api/criar-pagamento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pacote, dispositivo_id: getDispositivoId() }),
    });
    const dados = await resposta.json();
    if (!resposta.ok) {
      fecharModalPix();
      alert('Erro ao gerar pagamento: ' + (dados.erro || 'tente novamente.'));
      return;
    }
    mostrarModalPix(null, dados.qr_code_base64, dados.qr_code);
    aguardarPagamento(dados.payment_id, amount);
  } catch (erro) {
    fecharModalPix();
    alert('Não foi possível conectar ao servidor de pagamento.');
  }
}

function aguardarPagamento(paymentId, amount) {
  let tentativas = 0;
  const intervalo = setInterval(async () => {
    tentativas++;
    if (tentativas > 100) {
      clearInterval(intervalo);
      fecharModalPix();
      alert('Tempo esgotado. Se você já pagou, as moedas serão creditadas em instantes.');
      return;
    }
    try {
      const resposta = await fetch('/api/status-pagamento?payment_id=' + paymentId);
      const dados = await resposta.json();
      if (dados.status === 'approved') {
        clearInterval(intervalo);
        saveData.coins += amount;
        saveGame();
        const shopCoinsEl = document.getElementById('shopCoins');
        if (shopCoinsEl) shopCoinsEl.textContent = saveData.coins;
        fecharModalPix();
        alert('Pagamento aprovado! Você recebeu ' + amount + ' moedas.');
      }
    } catch (erro) {}
  }, 3000);
}

function mostrarModalPix(mensagem, qrBase64, qrCode) {
  let modal = document.getElementById('pixModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'pixModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
    modal.innerHTML = '<div style="background:#1a1a2e;border-radius:16px;padding:24px;max-width:340px;width:100%;text-align:center;color:#fff;"><div id="pixModalContent"></div><button id="pixModalFechar" class="game-button" style="margin-top:16px;">FECHAR</button></div>';
    document.body.appendChild(modal);
    document.getElementById('pixModalFechar').addEventListener('click', fecharModalPix);
  }
  const conteudo = document.getElementById('pixModalContent');
  if (mensagem) {
    conteudo.innerHTML = '<p>' + mensagem + '</p>';
  } else if (qrBase64) {
    conteudo.innerHTML =
      '<p>Escaneie o QR Code no app do seu banco:</p>' +
      '<img src="data:image/png;base64,' + qrBase64 + '" style="width:220px;height:220px;margin:12px auto;display:block;border-radius:8px;" />' +
      '<p style="font-size:12px;opacity:0.8;">Ou copie o código PIX:</p>' +
      '<textarea readonly style="width:100%;height:60px;font-size:10px;padding:6px;border-radius:8px;border:none;">' + qrCode + '</textarea>' +
      '<p style="font-size:12px;margin-top:10px;opacity:0.8;">Aguardando confirmação do pagamento...</p>';
  }
  modal.style.display = 'flex';
}

function fecharModalPix() {
  const modal = document.getElementById('pixModal');
  if (modal) modal.style.display = 'none';
}


// ==========================================
// SETTINGS
// ==========================================

function vibrate(duration) {

  if (
    saveData.vibrationEnabled &&
    navigator.vibrate
  ) {
    navigator.vibrate(duration);
  }
}


// ==========================================
// EVENTS
// ==========================================

document
  .getElementById("playButton")
  .addEventListener("click", startGame);

document
  .getElementById("restartButton")
  .addEventListener("click", startGame);

document
  .getElementById("gameOverMenuButton")
  .addEventListener("click", () => {
    showScreen("menuScreen");
  });

document
  .getElementById("pauseButton")
  .addEventListener(
    "click",
    togglePause
  );

document
  .getElementById("charactersButton")
  .addEventListener("click", () => {

    renderCharacters();
    showScreen("charactersScreen");
  });

document
  .getElementById("shopButton")
  .addEventListener("click", () => {

    updateAllUI();
    showScreen("shopScreen");
  });

document
  .getElementById("settingsButton")
  .addEventListener("click", () => {
    showScreen("settingsScreen");
  });


// Voltar

document
  .querySelectorAll(".backButton")
  .forEach(button => {

    button.addEventListener("click", () => {

      showScreen(
        button.dataset.screen
      );

    });

  });


// Tela / toque

canvas.addEventListener(
  "pointerdown",
  event => {

    event.preventDefault();

    if (game.paused) return;

    jump();
  }
);


// teclado

window.addEventListener(
  "keydown",
  event => {

    if (
      event.code === "Space" ||
      event.code === "ArrowUp"
    ) {

      event.preventDefault();
      jump();
    }
  }
);


// Personagens

document
  .getElementById("charactersList")
  .addEventListener(
    "click",
    event => {

      const select =
        event.target.closest(
          ".character-select"
        );

      const buy =
        event.target.closest(
          ".character-buy"
        );

      if (select) {

        selectCharacter(
          select.dataset.id
        );

      }

      if (buy) {

        buyCharacter(
          buy.dataset.id
        );

      }

    }
  );


// Loja

document
  .querySelectorAll(".shop-demo")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        buyDemoCoins(
          Number(button.dataset.coins)
        );

      }
    );

  });


// Som

document
  .getElementById("soundToggle")
  .addEventListener("click", () => {

    saveData.soundEnabled =
      !saveData.soundEnabled;

    saveGame();
  });


// Vibração

document
  .getElementById("vibrationToggle")
  .addEventListener("click", () => {

    saveData.vibrationEnabled =
      !saveData.vibrationEnabled;

    saveGame();
  });


// Reset

document
  .getElementById("resetButton")
  .addEventListener("click", () => {

    const confirmed =
      confirm(
        "Tem certeza que deseja apagar todo o progresso?"
      );

    if (confirmed) {

      resetGameData();

      renderCharacters();

      alert("Progresso resetado.");
    }

  });


// ==========================================
// INITIALIZATION
// ==========================================

loadGame();
resizeCanvas();
renderCharacters();
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .catch(error => {
        console.error(
          "Erro ao registrar Service Worker:",
          error
        );
      });
  });
}
