import supabase from '../config/supabase.js';

// Si el frontend no envía createdAt (o llega vacío), usamos la fecha LOCAL
// del cliente que viene en el header 'X-Client-Date', y como último recurso
// la fecha del proceso (que también puede ser UTC). El campo siempre se
// normaliza a 'YYYY-MM-DD' para que Postgres lo reciba sin ambigüedad.
const todayLocal = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
};

const toSnake = (trade, clientDate) => ({
  pair: trade.pair,
  risk: trade.risk,
  entry_point: trade.entryPoint,
  take_profit: trade.takeProfit,
  stop_loss: trade.stopLoss,
  order_type: trade.orderType,
  signal_source: trade.signalSource,
  result: trade.result,
  swap: trade.swap ?? 0,
  open_time: trade.openTime || null,   // ISO datetime de MT5; null para trades manuales
  observations: trade.observations,
  // Prioridad: (1) lo que el cliente envía en el body,
  //            (2) header X-Client-Date,
  //            (3) fecha UTC del servidor como último recurso.
  created_at: toDateString(trade.createdAt) || toDateString(clientDate) || todayLocal(),
});

// Normaliza cualquier formato de fecha a 'YYYY-MM-DD' para evitar que
// Supabase devuelva '2025-04-27T00:00:00+00:00' en lugar de '2025-04-27'
const toDateString = (value) => (value ? String(value).slice(0, 10) : '');

const toCamel = (row) => ({
  id: row.id,
  pair: row.pair,
  risk: Number(row.risk),
  entryPoint: Number(row.entry_point),
  takeProfit: Number(row.take_profit),
  stopLoss: Number(row.stop_loss),
  orderType: row.order_type,
  signalSource: row.signal_source,
  result: Number(row.result),
  swap: Number(row.swap ?? 0),
  openTime: row.open_time || null,     // ISO datetime o null
  observations: row.observations || '',
  createdAt: toDateString(row.created_at),
  isEditing: false,
});

export async function getAllTrades(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', req.user.id)
      .order('open_time',  { ascending: false, nullsFirst: false }) // primero trades MT5 con hora exacta
      .order('created_at', { ascending: false })                    // luego por fecha
      .order('id',         { ascending: false });                   // desempate final

    if (error) throw error;
    res.json(data.map(toCamel));
  } catch (err) {
    next(err);
  }
}

export async function createTrade(req, res, next) {
  try {
    const clientDate = req.headers['x-client-date'];
    const payload = { ...toSnake(req.body, clientDate), user_id: req.user.id };

    const { data, error } = await supabase
      .from('trades')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(toCamel(data));
  } catch (err) {
    next(err);
  }
}

export async function updateTrade(req, res, next) {
  try {
    const { id } = req.params;
    const clientDate = req.headers['x-client-date'];
    const payload = toSnake(req.body, clientDate);

    const { data, error } = await supabase
      .from('trades')
      .update(payload)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Trade no encontrado' });

    res.json(toCamel(data));
  } catch (err) {
    next(err);
  }
}

export async function importTrades(req, res, next) {
  try {
    const trades = req.body;
    if (!Array.isArray(trades) || trades.length === 0) {
      return res.status(400).json({ error: 'Array de trades requerido' });
    }

    const clientDate = req.headers['x-client-date'];
    const payload    = trades.map((t) => ({
      ...toSnake(t, clientDate),
      user_id: req.user.id,
    }));

    const { data, error } = await supabase
      .from('trades')
      .insert(payload)
      .select();

    if (error) throw error;
    res.status(201).json(data.map(toCamel));
  } catch (err) {
    next(err);
  }
}

export async function deleteTrade(req, res, next) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
