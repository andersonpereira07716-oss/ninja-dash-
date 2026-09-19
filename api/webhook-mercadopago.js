import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('ok');
  }

  try {
    const { type, data } = req.body;

    if (type !== 'payment') {
      return res.status(200).send('ignorado');
    }

    const payment = new Payment(client);
    const info = await payment.get({ id: data.id });

    if (info.status !== 'approved') {
      return res.status(200).send('aguardando aprovação');
    }

    const { dispositivo_id, moedas, pacote } = info.metadata;

    const { data: jaExiste } = await supabase
      .from('pagamentos')
      .select('id')
      .eq('mercadopago_payment_id', String(info.id))
      .maybeSingle();

    if (jaExiste) {
      return res.status(200).send('já processado');
    }

    await supabase.from('pagamentos').insert({
      mercadopago_payment_id: String(info.id),
      dispositivo_id,
      pacote,
      moedas: Number(moedas),
      valor_centavos: Math.round(info.transaction_amount * 100),
      status: 'aprovado',
    });

    await supabase.rpc('creditar_moedas', {
      p_dispositivo_id: dispositivo_id,
      p_quantidade: Number(moedas),
    });

    return res.status(200).send('moedas creditadas');
  } catch (erro) {
    console.error('Erro no webhook:', erro);
    return res.status(500).send('erro');
  }
}
