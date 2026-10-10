// Exemplo de atualização dos pacotes no seu app.js
const gamePackages = [
    {
        id: 1,
        title: "100 Moedas",
        price: "R$ 5,00",
        description: "Pacote Oficial",
        checkoutUrl: "https://mpago.la/SEU_LINK_REAL_5" // Substitua pelo seu link real do Mercado Pago
    },
    {
        id: 2,
        title: "500 Moedas",
        price: "R$ 10,00",
        description: "Pacote Oficial",
        checkoutUrl: "https://mpago.la/SEU_LINK_REAL_10" // Substitua pelo seu link real do Mercado Pago
    },
    {
        id: 3,
        title: "1000 Moedas",
        price: "R$ 15,00",
        description: "Pacote Oficial",
        checkoutUrl: "https://mpago.la/SEU_LINK_REAL_15" // Substitua pelo seu link real do Mercado Pago
    }
];

// Função para renderizar os botões e atualizar o redirecionamento
function renderStore() {
    const storeContainer = document.getElementById('store-container');
    if (!storeContainer) return;
    
    storeContainer.innerHTML = gamePackages.map(pkg => `
        <div class="package-card">
            <h3>${pkg.title}</h3>
            <p>${pkg.price}</p>
            <span>${pkg.description}</span>
            <button onclick="window.location.href='${pkg.checkoutUrl}'">ADQUIRIR</button>
        </div>
    `).join('');
}
