// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAIR_MAP = { 'DJ30.s': 'US30', 'DJ30': 'US30' };

function cleanPair(s) {
  const sym = (s || '').trim();
  return PAIR_MAP[sym] ?? sym.replace(/\.s$/i, '');
}

// "2026.04.08 16:56:34" → "2026-04-08"
function parseDate(str) {
  return (str || '').trim().slice(0, 10).replace(/\./g, '-');
}

// "2026.04.08 16:56:34" → "2026-04-08T16:56:34"
function parseDateTime(str) {
  if (!str) return null;
  return str.trim()
    .replace(/^(\d{4})\.(\d{2})\.(\d{2})/, '$1-$2-$3')
    .replace(' ', 'T');
}

function mapOrderType(type) {
  return (type || '').toLowerCase() === 'sell' ? 'Sell Market' : 'Buy Market';
}

// Normaliza encabezado: minúsculas, solo letras a-z
// "S/L" → "sl"   "T/P" → "tp"   "Deal #" → "deal"   "Commission" → "commission"
function normH(h) {
  return (h || '').toLowerCase().replace(/[^a-z]/g, '');
}

// Construye mapa { headerNormalizado: índiceVisible } desde una fila visible
function colMap(vis) {
  const m = {};
  vis.forEach((td, i) => { const k = normH(td.textContent); if (k) m[k] = i; });
  return m;
}

// ─── 1. Sección Positions ─────────────────────────────────────────────────────
//  Retorna:
//    positionMap  : { posId → { tp, sl } }          (para cruzar con Deals)
//    openPositions: [ tradeObj, … ]                 (posiciones aún abiertas)
function parsePositionsSection(doc) {
  const positionMap   = {};
  const openPositions = [];
  const rows = Array.from(doc.querySelectorAll('tr'));
  let inSection = false;
  let cols = null;

  for (const row of rows) {
    const text = row.textContent.replace(/\s+/g, ' ').trim();

    if (!inSection) {
      if (text === 'Positions') inSection = true;
      continue;
    }
    // La sección Positions termina cuando empieza Orders o Deals
    if (text === 'Orders' || text === 'Deals') break;

    const vis = Array.from(row.querySelectorAll('td'))
                     .filter(td => !td.classList.contains('hidden'));

    // Detectar fila de cabecera
    if (!cols) {
      const hdrs = vis.map(td => normH(td.textContent));
      if (hdrs.includes('time') && hdrs.some(h => h === 'symbol' || h === 'position' || h === 'sl' || h === 'tp')) {
        cols = colMap(vis);
      }
      continue;
    }

    if (vis.length < 8) continue;

    // Helper con fallback de índice
    const g = (name, fb) =>
      (cols[name] !== undefined ? vis[cols[name]] : vis[fb])?.textContent.trim() ?? '';

    const posId  = g('position', 1);
    const time   = g('time', 0);
    const symbol = g('symbol', 2);
    const type   = g('type', 3);
    const volume = parseFloat(g('volume', 4)) || 0;
    const price  = parseFloat(g('price', 5)) || 0;
    // S/L y T/P: intentar varios nombres normalizados
    const sl   = parseFloat(g('sl', 6)) || parseFloat(g('stoploss', 6)) || 0;
    const tp   = parseFloat(g('tp', 7)) || parseFloat(g('takeprofit', 7)) || 0;
    const swap = parseFloat(g('swap', -1)) || 0;

    // Profit flotante: usar columna del mapa si existe; si no, escanear desde índice 8
    // saltando celdas que parecen fechas ("2026.04.08…" → parseFloat = 2026.04)
    const profit = (() => {
      for (const name of ['profit', 'pl', 'pnl']) {
        if (cols[name] !== undefined) return parseFloat(g(name, -1)) || 0;
      }
      for (let i = 8; i < vis.length; i++) {
        const txt = vis[i]?.textContent.trim() || '';
        if (/^\d{4}[.\-]/.test(txt)) continue;   // saltar fechas tipo "2026.04.08"
        const v = parseFloat(txt);
        if (!isNaN(v)) return v;
      }
      return 0;
    })();

    if (!posId || !symbol) continue;

    positionMap[posId] = { tp, sl };

    openPositions.push({
      mt5Id:        posId,
      pair:         cleanPair(symbol),
      orderType:    mapOrderType(type),
      entryPoint:   price,
      takeProfit:   tp,
      stopLoss:     sl,
      result:       profit,
      swap:         swap,
      risk:         volume,
      openTime:     parseDateTime(time),
      createdAt:    parseDate(time),
      signalSource: 'MT5 Import',
      observations: '',
    });
  }

  return { positionMap, openPositions };
}

// ─── 2. Sección Deals → trades cerrados + depósitos + balance final ───────────
function parseDealsSection(doc, positionMap) {
  const rows = Array.from(doc.querySelectorAll('tr'));
  let inSection = false;
  let cols = null;

  const posGroups  = {};
  const deposits   = [];
  let   finalBalance = 0;

  for (const row of rows) {
    const text = row.textContent.replace(/\s+/g, ' ').trim();

    if (!inSection) {
      if (text === 'Deals') inSection = true;
      continue;
    }

    const vis = Array.from(row.querySelectorAll('td'))
                     .filter(td => !td.classList.contains('hidden'));

    // Construir mapa de columnas desde la cabecera
    if (!cols) {
      const hdrs = vis.map(td => normH(td.textContent));
      if (hdrs.includes('time') &&
          (hdrs.includes('type') || hdrs.includes('direction') || hdrs.includes('deal'))) {
        cols = colMap(vis);
      }
      continue;
    }

    if (vis.length < 5) continue;

    const g = (name, fb) =>
      (cols[name] !== undefined ? vis[cols[name]] : vis[fb])?.textContent.trim() ?? '';

    const time       = g('time', 0);
    const symbol     = g('symbol', 2);
    const type       = g('type', 3).toLowerCase();
    const volume     = parseFloat(g('volume', 5)) || 0;
    const price      = parseFloat(g('price', 6)) || 0;
    const orderId    = g('order', 7);
    const commission = parseFloat(g('commission', 8)) || 0;
    const fee        = parseFloat(g('fee', 9)) || 0;
    const swap       = parseFloat(g('swap', 10)) || 0;
    const profit     = parseFloat(g('profit', 11)) || 0;
    const balance    = parseFloat(g('balance', 12)) || 0;
    const comment    = g('comment', 13);

    // Dirección explícita si la columna existe y tiene valor 'in'/'out'
    const dirRaw     = cols['direction'] !== undefined ? g('direction', -1).toLowerCase() : '';
    const explicitIn  = dirRaw === 'in';
    const explicitOut = dirRaw === 'out';

    if (balance > 0) finalBalance = balance;

    // ── Depósitos / créditos ─────────────────────────────────────────
    if (type === 'balance' || type === 'credit') {
      deposits.push({
        pair:         'Depósito',
        orderType:    'Depósito',
        entryPoint:   0,
        takeProfit:   0,
        stopLoss:     0,
        result:       profit,
        swap:         0,
        risk:         0,
        openTime:     parseDateTime(time),
        createdAt:    parseDate(time),
        signalSource: 'MT5 Import',
        observations: comment || (type === 'credit' ? 'Crédito MT5' : 'Depósito MT5'),
      });
      continue;
    }

    // ── Deals de trades ──────────────────────────────────────────────
    if (!symbol || !orderId) continue;
    if (!posGroups[orderId]) posGroups[orderId] = {};

    const grp = posGroups[orderId];

    // Determinar apertura/cierre:
    //  1. Columna Direction explícita con valor 'in'/'out'
    //  2. Heurística: primera aparición = apertura, segunda = cierre
    let isIn, isOut;
    if (explicitIn || explicitOut) {
      isIn  = explicitIn;
      isOut = explicitOut;
    } else {
      isIn  = !grp.in;
      isOut = !!grp.in && !grp.out;
    }

    if (isIn && !grp.in) {
      grp.in = { time, symbol, type, volume, price, commission, fee, swap };
    } else if (isOut && !grp.out) {
      grp.out = { time, price, profit, commission, fee, swap };
    }
  }

  // ── Construir trades cerrados ──────────────────────────────────────
  const closedTrades = [];
  for (const [posId, grp] of Object.entries(posGroups)) {
    if (!grp.in || !grp.out) continue;   // ignorar posiciones aún abiertas en Deals

    const inD  = grp.in;
    const outD = grp.out;
    const pos  = positionMap[posId] || {};

    closedTrades.push({
      mt5Id:        posId,
      pair:         cleanPair(inD.symbol),
      orderType:    mapOrderType(inD.type),
      entryPoint:   inD.price,
      takeProfit:   pos.tp || 0,
      stopLoss:     pos.sl || 0,
      result:       outD.profit,
      swap:         (inD.swap || 0) + (outD.swap || 0),
      risk:         inD.volume,
      openTime:     parseDateTime(inD.time),
      createdAt:    parseDate(inD.time),
      signalSource: 'MT5 Import',
      observations: '',
    });
  }

  return { closedTrades, deposits, finalBalance };
}

// ─── Función principal ────────────────────────────────────────────────────────
export function parseMT5Html(htmlText) {
  const doc = new DOMParser().parseFromString(htmlText, 'text/html');

  // 1. Positions: positionMap (TP/SL) + posiciones abiertas como trades
  const { positionMap, openPositions } = parsePositionsSection(doc);

  // 2. Deals: trades cerrados + depósitos + balance
  const { closedTrades, deposits, finalBalance } = parseDealsSection(doc, positionMap);

  // 3. Unir: los trades cerrados tienen precedencia sobre las posiciones abiertas
  //    (si una posición aparece como cerrada en Deals, no la duplicamos desde Positions)
  const closedIds = new Set(closedTrades.map(t => t.mt5Id).filter(Boolean));
  const openOnly  = openPositions.filter(t => !closedIds.has(t.mt5Id));

  const trades = [...closedTrades, ...openOnly];
  trades.sort((a, b) => (a.openTime || '').localeCompare(b.openTime || ''));

  return { trades, deposits, finalBalance };
}
