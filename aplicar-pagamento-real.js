const fs = require('fs');

// ---- app.js ----
let app = fs.readFileSync('app.js', 'utf8');

const oldBuyDemo = `function buyDemoCoins(amount) {

  alert(
    \`Pacote demonstrativo de \${amount} moedas.\\n\\nPagamento real será integrado futuramente.\`
  );
}`;

const newBuyDemo = `const PACOTES_MOEDAS = {
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
}`;

if (app.includes(oldBuyDemo)) {
  app = app.replace(oldBuyDemo, newBuyDemo);
  fs.writeFileSync('app.js', app);
  console.log('✅ app.js atualizado com sucesso');
} else {
  console.log('⚠️ Não encontrei o trecho exato em app.js - nada foi alterado');
}

// ---- index.html ----
let html = fs.readFileSync('index.html', 'utf8');

const trocas = [
  ['<h3>100 MOEDAS</h3>\n        <p>Pacote demonstrativo</p>', '<h3>100 MOEDAS</h3>\n        <p>R\$ 9,90</p>'],
  ['<h3>500 MOEDAS</h3>\n        <p>Pacote demonstrativo</p>', '<h3>500 MOEDAS</h3>\n        <p>R\$ 39,90</p>'],
  ['<h3>1000 MOEDAS</h3>\n        <p>Pacote demonstrativo</p>', '<h3>1000 MOEDAS</h3>\n        <p>R\$ 69,90</p>'],
  ['Os itens são demonstrativos nesta versão.', 'Pagamento processado com segurança via PIX (Mercado Pago).'],
];

let trocasFeitas = 0;
trocas.forEach(([de, para]) => {
  if (html.includes(de)) {
    html = html.replace(de, para);
    trocasFeitas++;
  }
});

fs.writeFileSync('index.html', html);
console.log('✅ index.html atualizado (' + trocasFeitas + ' de 4 trocas feitas)');
