const fs = require('fs');
let app = fs.readFileSync('app.js', 'utf8');

const oldTrecho = `      if (dados.status === 'approved') {
        clearInterval(intervalo);
        saveData.coins += amount;
        saveGame();
        const shopCoinsEl = document.getElementById('shopCoins');
        if (shopCoinsEl) shopCoinsEl.textContent = saveData.coins;
        fecharModalPix();
        alert('Pagamento aprovado! Você recebeu ' + amount + ' moedas.');
      }`;

const newTrecho = `      if (dados.status === 'approved') {
        clearInterval(intervalo);
        await syncMoedasComServidor();
        const shopCoinsEl = document.getElementById('shopCoins');
        if (shopCoinsEl) shopCoinsEl.textContent = saveData.coins;
        fecharModalPix();
        alert('Pagamento aprovado! Você recebeu ' + amount + ' moedas.');
      }

async function syncMoedasComServidor() {
  try {
    const resposta = await fetch('/api/saldo-moedas?dispositivo_id=' + getDispositivoId());
    const dados = await resposta.json();
    const totalServidor = dados.moedas_compradas || 0;
    const jaAplicado = Number(localStorage.getItem('moedasAplicadasServidor') || 0);
    const diferenca = totalServidor - jaAplicado;
    if (diferenca > 0) {
      saveData.coins += diferenca;
      localStorage.setItem('moedasAplicadasServidor', String(totalServidor));
      saveGame();
    }
  } catch (erro) {
    console.error('Erro ao sincronizar moedas:', erro);
  }
}

window.addEventListener('load', () => {
  syncMoedasComServidor();
});`;

if (app.includes(oldTrecho)) {
  app = app.replace(oldTrecho, newTrecho);
  fs.writeFileSync('app.js', app);
  console.log('✅ app.js atualizado com sincronização de saldo');
} else {
  console.log('⚠️ Não encontrei o trecho exato - nada foi alterado');
}
