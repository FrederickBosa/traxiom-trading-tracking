// ─── Mapeo de símbolos MT5 → pares del app ────────────────────────────────────
const PAIR_MAP = {
  'DJ30.s': 'US30',
  'DJ30':   'US30',
};

function cleanPair(symbol) {
  const s = (symbol || '').trim();
  if (PAIR_MAP[s]) return PAIR_MAP[s];
  return s.replace(/\.s$/i, '');   // quita el sufijo .s del broker
}

// "2026.04.08 16:56:34" → "2026-04-08"
function parseDate(str) {
  if (!str) return '';
  return str.trim().slice(0, 10).replace(/\./g, '-');
}

function mapOrderType(type) {
  return (type || '').toLowerCase().trim() === 'sell' ? 'Sell Market' : 'Buy Market';
}

// ─── Parser principal ─────────────────────────────────────────────────────────
// El HTML de MT5 está codificado en UTF-16 LE. El FileReader del navegador lo
// decodifica correctamente si se usa readAsText(file, 'UTF-16').
// Luego lo pasamos a DOMParser para extraer sólo la sección "Positions".
export function parseMT5Html(htmlText) {
  const doc = new DOMParser().parseFromString(htmlText, 'text/html');
  const allRows = Array.from(doc.querySelectorAll('tr'));

  const trades = [];
  let inPositions  = false;
  let headerPassed = false;

  for (const row of allRows) {
    const rowText = row.textContent.replace(/\s+/g, ' ').trim();

    // ── Detectar inicio de sección Positions ──────────────────────────────
    if (!inPositions) {
      if (rowText === 'Positions') inPositions = true;
      continue;
    }

    // ── Saltar fila de cabeceras de columna ───────────────────────────────
    if (!headerPassed) {
      if (rowText.includes('Time') && rowText.includes('Symbol')) headerPassed = true;
      continue;
    }

    // ── Parar al llegar a la sección Orders o al resumen ──────────────────
    if (rowText === 'Orders' || rowText.startsWith('Closed P&L') || rowText.startsWith('Balance:')) break;

    // ── Parsear fila de datos ─────────────────────────────────────────────
    const allTds   = Array.from(row.querySelectorAll('td'));
    const visible  = allTds.filter(td => !td.classList.contains('hidden'));
    if (visible.length < 10) continue;    // fila de totales o vacía

    const openTime   = visible[0]?.textContent.trim();
    const positionId = visible[1]?.textContent.trim();
    const symbol     = visible[2]?.textContent.trim();
    const type       = visible[3]?.textContent.trim();
    // visible[4] = volume
    const openPrice  = parseFloat(visible[5]?.textContent.trim()) || 0;
    const sl         = parseFloat(visible[6]?.textContent.trim()) || 0;
    const tp         = parseFloat(visible[7]?.textContent.trim()) || 0;
    // visible[8]  = close time
    // visible[9]  = close price
    // visible[10] = commission
    // visible[11] = swap
    const profit     = parseFloat(visible[12]?.textContent.trim()) || 0;

    if (!symbol || !openTime || !positionId || openPrice === 0) continue;

    trades.push({
      mt5Id:        positionId,           // solo para detección de duplicados en el cliente
      pair:         cleanPair(symbol),
      orderType:    mapOrderType(type),
      entryPoint:   openPrice,
      takeProfit:   tp,
      stopLoss:     sl,
      result:       profit,
      createdAt:    parseDate(openTime),
      risk:         0,
      signalSource: 'MT5 Import',
      observations: `MT5 #${positionId}`,
    });
  }

  return trades;
}
