import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { dispositivo_id } = req.query;

  if (!dispositivo_id) {
    return res.status(400).json({ erro: 'dispositivo_id é obrigatório' });
  }

  try {
    const { data, error } = await supabase
      .from('jogadores')
      .select('moedas')
      .eq('dispositivo_id', dispositivo_id)
      .maybeSingle();

    if (error) throw error;

    return res.status(200).json({ moedas_compradas: data ? data.moedas : 0 });
  } catch (erro) {
    console.error('Erro ao buscar saldo:', erro);
    return res.status(500).json({ erro: 'Falha ao buscar saldo' });
  }
}
