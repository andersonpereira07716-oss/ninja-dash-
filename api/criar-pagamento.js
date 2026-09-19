import { MercadoPagoConfig, Payment } from 'mercadopago';

const PACOTES = {
  '100_moedas':  { moedas: 100,  valor: 9.90,  descricao: '100 Moedas - Ninja Dash' },
  '500_moedas':  { moedas: 500,  valor: 39.90, descricao: '500 Moedas - Ninja Dash' },
  '1000_moedas': { moedas: 1000, valor: 69.90, descricao: '1000 Moedas - Ninja Dash' },
};

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { pacote, dispositivo_id, email_pagador } = req.body;

  const item = PACOTES[pacote];
  if (!item) {
    return res.status(400).json({ erro: 'Pacote inválido' });
  }
  if (!dispositivo_id) {
    return res.status(400).json({ erro: 'dispositivo_id é obrigatório' });
  }

  try {
    const payment = new Payment(client);

    const resultado = await payment.create({
      body: {
        transaction_amount: item.valor,
        description: item.descricao,
        payment_method_id: 'pix',
        payer: {
          email: email_pagador || 'jogador@ninjadash.app',
        },
        metadata: {
          pacote,
          dispositivo_id,
          moedas: item.moedas,
        },
        notification_url: `${process.env.URL_BASE}/api/webhook-mercadopago`,
      },
    });

    const pix = resultado.point_of_interaction.transaction_data;

    return res.status(200).json({
      payment_id: resultado.id,
      qr_code: pix.qr_code,
      qr_code_base64: pix.qr_code_base64,
      status: resultado.status,
    });
  } catch (erro) {
    console.error('Erro ao criar pagamento:', erro);
    return res.status(500).json({ erro: 'Falha ao criar pagamento' });
  }
}
