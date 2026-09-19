import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

export default async function handler(req, res) {
  const { payment_id } = req.query;

  if (!payment_id) {
    return res.status(400).json({ erro: 'payment_id é obrigatório' });
  }

  try {
    const payment = new Payment(client);
    const info = await payment.get({ id: payment_id });

    return res.status(200).json({ status: info.status });
  } catch (erro) {
    console.error('Erro ao consultar pagamento:', erro);
    return res.status(500).json({ erro: 'Falha ao consultar pagamento' });
  }
}
