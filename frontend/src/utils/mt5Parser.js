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

// Normaliza encabezados: minúsculas, sin caracteres especiales
// "Deal #" → "deal", "Commission" → "commission"
function normHeader(h) {
  return (h || '').toLowerCase().replace(/[^a-z]/g, '');
}

// Construye un mapa { columnaNormalizada: índiceVisible } a partir de la fila de cabecera
function buildColMap(vis) {
  const map = {};
  vis.forEach((td, i) => {
    const key = normHeader(td.textContent);
    if (key) map[key] = i;
  });
  return map;
}

// ─── 1. Sección Positions → mapa positionId → { tp, sl } ─────────────────────
function parsePositionsSection(doc) {
  const map   = {};
  const rows  = Array.from(doc.querySelectorAll('tr'));
  let inSection = false, headerPassed = false;

  for (const row of rows) {
    const text = row.textContent.replace(/\s+/g, ' ').trim();

    if (!inSection) {
      if (text === 'Positions') inSection = true;
      continue;
    }
    if (!headerPassed) {
      if (text.includes('Symbol') && text.includes('Time')) headerPassed = true;
      continue;
    }
    if (text === 'Orders' || text === 'Deals') break;

    const vis = Array.from(row.querySelectorAll('td'))
                     .filter(td => !td.classList.contains('hidden'));
    if (vis.length < 10) continue;

    const posId = vis[1]?.textContent.trim();
    const sl    = parseFloat(vis[6]?.textContent.trim()) || 0;
    const tp    = parseFloat(vis[7]?.textContent.trim()) || 0;
    if (posId) map[posId] = { tp, sl };
  }
  return map;
}

// ─── 2. Sección Deals → trades cerrados + depósitos + balance final ───────────
function parseDealsSection(doc, positionMap) {
  const rows = Array.from(doc.querySelectorAll('tr'));
  let inSection = false;
  let cols = null;   // mapa de columna normalizada → índice visible

  const posGroups  = {};
  const deposits   = [];
  let   finalBalance = 0;

  for (const row of rows) {
    const text = row.textContent.replace(/\s+/g, ' ').trim();

    // ── Detectar inicio de sección ────────────────────────────────────
    if (!inSection) {
      if (text === 'Deals') inSection = true;
      continue;
    }

    // Solo celdas visibles (sin clase "hidden")
    const vis = Array.from(row.querySelectorAll('td'))
                     .filter(td => !td.classList.contains('hidden'));

    // ── Detectar fila de cabecera → construir mapa de columnas ────────
    if (!cols) {
      const headers = vis.map(td => normHeader(td.textContent));
      // La cabecera de Deals siempre tiene 'time' y alguno de: 'type', 'direction', 'deal'
      if (headers.includes('time') &&
          (headers.includes('type') || headers.includes('direction') || headers.includes('deal'))) {
        cols = buildColMap(vis);
      }
      continue;
    }

    // Ignorar filas muy cortas (separadores, totales…)
    if (vis.length < 5) continue;

    // Helper: obtiene el texto del campo, priorizando mapa de columnas
    const g = (name, fallbackIdx) => {
      const idx = cols[name];
      return (idx !== undefined ? vis[idx] : vis[fallbackIdx])?.textContent.trim() ?? '';
    };

    // ── Extraer campos ─────────────────────────────────────────────────
    const time      = g('time', 0);
    const symbol    = g('symbol', 2);
    const type      = g('type', 3).toLowerCase();
    const volume    = parseFloat(g('volume', 5)) || 0;
    const price     = parseFloat(g('price', 6)) || 0;
    const orderId   = g('order', 7);
    const commission= parseFloat(g('commission', 8)) || 0;
    const fee       = parseFloat(g('fee', 9)) || 0;
    const swap      = parseFloat(g('swap', 10)) || 0;
    const profit    = parseFloat(g('profit', 11)) || 0;
    const balance   = parseFloat(g('balance', 12)) || 0;
    const comment   = g('comment', 13);

    // Dirección: se lee del mapa si existe; si no, se infiere por orden de aparición
    const dirRaw = cols['direction'] !== undefined ? g('direction', -1).toLowerCase() : '';
    // 'in' → apertura, 'out' → cierre.  Si no hay columna direction se usa la heurística.
    const isExplicitIn  = dirRaw === 'in';
    const isExplicitOut = dirRaw === 'out';

    if (balance > 0) finalBalance = balance;

    // ── Depósitos y créditos ──────────────────────────────────────────
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

    // ── Deals de trades ───────────────────────────────────────────────
    if (!symbol || !orderId) continue;
    if (!posGroups[orderId]) posGroups[orderId] = {};

    const group = posGroups[orderId];

    // Determinar si es apertura o cierre:
    //   1. Usa Direction si está disponible y tiene valor explícito ('in'/'out')
    //   2. Heurística: primera aparición del posId = apertura, segunda = cierre
    let isIn, isOut;
    if (isExplicitIn || isExplicitOut) {
      isIn  = isExplicitIn;
      isOut = isExplicitOut;
    } else {
      // Sin columna Direction: inferir por orden cronológico
      isIn  = !group.in;
      isOut = !!group.in && !group.out;
    }

    if (isIn && !group.in) {
      group.in = { time, symbol, type, volume, price, commission, fee, swap };
    } else if (isOut && !group.out) {
      group.out = { time, price, profit, commission, fee, swap };
    }
  }

  // ── Construir trades combinando in + out + TP/SL de Positions ─────────
  const trades = [];
  for (const [posId, group] of Object.entries(posGroups)) {
    if (!group.in || !group.out) continue;   // solo trades cerrados

    const inDeal  = group.in;
    const outDeal = group.out;
    const pos     = positionMap[posId] || {};

    const totalSwap = (inDeal.swap || 0) + (outDeal.swap || 0);

    trades.push({
      mt5Id:        posId,
      pair:         cleanPair(inDeal.symbol),
      orderType:    mapOrderType(inDeal.type),
      entryPoint:   inDeal.price,
      takeProfit:   pos.tp || 0,
      stopLoss:     pos.sl || 0,
      result:       outDeal.profit,
      swap:         totalSwap,
      risk:         inDeal.volume,
      openTime:     parseDateTime(inDeal.time),
      createdAt:    parseDate(inDeal.time),
      signalSource: 'MT5 Import',
      observations: '',
    });
  }

  // Ordenar por openTime para que el bulk insert vaya en orden cronológico
  trades.sort((a, b) => (a.openTime || '').localeCompare(b.openTime || ''));

  return { trades, deposits, finalBalance };
}

// ─── Función principal ────────────────────────────────────────────────────────
export function parseMT5Html(htmlText) {
  const doc         = new DOMParser().parseFromString(htmlText, 'text/html');
  const positionMap = parsePositionsSection(doc);
  return parseDealsSection(doc, positionMap);
}
