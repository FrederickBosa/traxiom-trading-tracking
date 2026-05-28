// StatsMetrics — fila de 8 KPIs estilo myfxbook
// Cada tarjeta explica el concepto en un tooltip para que sea educativo.

const TOOLTIPS = {
  netProfit:      'Ganancia/pérdida neta total (resultado + swap de todos los trades).',
  winRate:        'Porcentaje de trades que cerraron en positivo. Objetivo: > 50 %.',
  profitFactor:   'Ganancia bruta ÷ pérdida bruta. > 1.0 = estrategia rentable. Ideal > 1.5.',
  expectedPayoff: 'Ganancia o pérdida promedio por operación. Si es positivo, la estrategia es sostenible.',
  avgWin:         'Promedio de las operaciones ganadoras.',
  avgLoss:        'Promedio de las operaciones perdedoras.',
  bestTrade:      'Mayor ganancia obtenida en un solo trade.',
  maxDD:          'Mayor caída desde un máximo de balance. Mide el riesgo de ruina. Cuanto menor, mejor.',
};

function fmt(v, prefix = '$') {
  const abs = Math.abs(v);
  const s   = abs >= 1000
    ? `${prefix}${(abs / 1000).toFixed(1)}k`
    : `${prefix}${abs.toFixed(2)}`;
  return v < 0 ? `-${s}` : (v > 0 ? `+${s}` : s);
}

function InfoIcon({ text }) {
  return (
    <span
      title={text}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: '#ede9fe',
        color: '#7c3aed',
        fontSize: '0.55rem',
        fontWeight: 800,
        cursor: 'help',
        marginLeft: 4,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      i
    </span>
  );
}

function MetricCard({ label, value, sub, valueColor, tooltip, highlight }) {
  return (
    <div
      className="tt-stats-metrics__card"
      style={highlight ? { borderColor: '#c4b5fd', background: '#faf8ff' } : undefined}
    >
      <div className="tt-stats-metrics__card-label">
        {label}
        {tooltip && <InfoIcon text={tooltip} />}
      </div>
      <div className="tt-stats-metrics__card-value" style={{ color: valueColor }}>
        {value}
      </div>
      {sub && <div className="tt-stats-metrics__card-sub">{sub}</div>}
    </div>
  );
}

function StatsMetrics({ stats }) {
  if (!stats) {
    return (
      <div className="tt-stats-metrics tt-stats-metrics--empty">
        Sin operaciones — importa o agrega trades para ver tus estadísticas
      </div>
    );
  }

  const {
    totalTrades, winners, losers,
    netProfit, winRate, profitFactor, expectedPayoff,
    avgWin, avgLoss, bestTrade, maxDD, maxDDPct,
    longs, shorts, longWinRate, shortWinRate,
    maxConsecWins, maxConsecLosses,
  } = stats;

  const profitColor = (v) => v > 0 ? '#059669' : v < 0 ? '#dc2626' : '#6b7280';

  const pfColor = profitFactor == null
    ? '#6b7280'
    : profitFactor >= 1.5 ? '#059669'
    : profitFactor >= 1.0 ? '#f59e0b'
    : '#dc2626';

  return (
    <div className="tt-stats-metrics">
      {/* ── Fila 1: métricas principales ── */}
      <MetricCard
        label="Net P&L"
        value={fmt(netProfit)}
        sub={`Bruto: +${fmt(Math.abs(stats.grossProfit))} / -${fmt(Math.abs(stats.grossLoss))}`}
        valueColor={profitColor(netProfit)}
        tooltip={TOOLTIPS.netProfit}
        highlight
      />
      <MetricCard
        label="Win Rate"
        value={`${winRate.toFixed(1)} %`}
        sub={`${winners}W / ${losers}L de ${totalTrades} trades`}
        valueColor={winRate >= 50 ? '#059669' : '#dc2626'}
        tooltip={TOOLTIPS.winRate}
      />
      <MetricCard
        label="Profit Factor"
        value={profitFactor != null ? profitFactor.toFixed(2) : '—'}
        sub={profitFactor != null ? (profitFactor >= 1.5 ? '✦ Excelente' : profitFactor >= 1.0 ? '✓ Rentable' : '✗ Por mejorar') : '—'}
        valueColor={pfColor}
        tooltip={TOOLTIPS.profitFactor}
      />
      <MetricCard
        label="Expected Payoff"
        value={fmt(expectedPayoff)}
        sub="Ganancia media por trade"
        valueColor={profitColor(expectedPayoff)}
        tooltip={TOOLTIPS.expectedPayoff}
      />
      {/* ── Fila 2: métricas de detalle ── */}
      <MetricCard
        label="Avg Ganancia"
        value={fmt(avgWin)}
        sub={`Mejor: ${fmt(bestTrade)}`}
        valueColor="#059669"
        tooltip={TOOLTIPS.avgWin}
      />
      <MetricCard
        label="Avg Pérdida"
        value={fmt(avgLoss)}
        sub={`Peor: ${fmt(stats.worstTrade)}`}
        valueColor="#dc2626"
        tooltip={TOOLTIPS.avgLoss}
      />
      <MetricCard
        label="Max Drawdown"
        value={`${fmt(maxDD)}`}
        sub={`${maxDDPct.toFixed(1)} % del balance`}
        valueColor={maxDDPct > 20 ? '#dc2626' : maxDDPct > 10 ? '#f59e0b' : '#6b7280'}
        tooltip={TOOLTIPS.maxDD}
      />
      <MetricCard
        label="Long / Short"
        value={`${longWinRate.toFixed(0)} % / ${shortWinRate.toFixed(0)} %`}
        sub={`${longs} compras · ${shorts} ventas`}
        valueColor="#7c3aed"
      />
    </div>
  );
}

export default StatsMetrics;
