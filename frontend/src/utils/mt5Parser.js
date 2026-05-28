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

// "2026.04.08 16:56:34" → "2026-04-08T16:56:34" (ISO sin zona, relativo al broker)
function parseDateTime(str) {
  if (!str) return null;
  return str.trim()
    .replace(/^(\d{4})\.(\d{2})\.(\d{2})/, '$1-$2-$3')
    .replace(' ', 'T');
}

function mapOrderType(type) {
  return (type || '').toLowerCase() === 'sell' ? 'Sell Market' : 'Buy Market';
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
  const rows  = Array.from(doc.querySelectorAll('tr'));
  let inSection = false, headerPassed = false;

  // posId → { in: {…}, out: {…} }
  const posGroups  = {};
  const deposits   = [];
  let   finalBalance = 0;

  for (const row of rows) {
    const text = row.textContent.replace(/\s+/g, ' ').trim();

    if (!inSection) {
      if (text === 'Deals') inSection = true;
      continue;
    }
    if (!headerPassed) {
      if (text.includes('Deal') && text.includes('Direction')) headerPassed = true;
      continue;
    }

    const vis = Array.from(row.querySelectorAll('td'))
                     .filter(td => !td.classList.contains('hidden'));
    if (vis.length < 10) continue;

    // Columns: Time|Deal|Symbol|Type|Direction|Volume|Price|Order|Commission|Fee|Swap|Profit|Balance|Comment
    const time       = vis[0]?.textContent.trim();
    const symbol     = vis[2]?.textContent.trim();
    const type       = vis[3]?.textContent.trim().toLowerCase();
    const direction  = vis[4]?.textContent.trim().toLowerCase();
    const volume     = parseFloat(vis[5]?.textContent.trim()) || 0;
    const price      = parseFloat(vis[6]?.textContent.trim()) || 0;
    const orderId    = vis[7]?.textContent.trim();          // = Position ID
    const commission = parseFloat(vis[8]?.textContent.trim()) || 0;
    const fee        = parseFloat(vis[9]?.textContent.trim()) || 0;
    const swap       = parseFloat(vis[10]?.textContent.trim()) || 0;
    const profit     = parseFloat(vis[11]?.textContent.trim()) || 0;
    const balance    = parseFloat(vis[12]?.textContent.trim()) || 0;
    const comment    = vis[13]?.textContent.trim();

    if (balance > 0) finalBalance = balance;

    // ── Depósitos y créditos ──────────────────────────────────────────────
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

    // ── Deals de trades (in/out) ──────────────────────────────────────────
    if (!symbol || !orderId) continue;
    if (!posGroups[orderId]) posGroups[orderId] = {};

    if (direction === 'in') {
      posGroups[orderId].in = { time, symbol, type, volume, price, commission, fee, swap };
    } else if (direction === 'out') {
      posGroups[orderId].out = { time, price, profit, commission, fee, swap };
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
      risk:         inDeal.volume,            // lotaje
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
  const doc          = new DOMParser().parseFromString(htmlText, 'text/html');
  const positionMap  = parsePositionsSection(doc);
  return parseDealsSection(doc, positionMap);
}
