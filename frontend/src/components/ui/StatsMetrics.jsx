// StatsMetrics — 8 KPIs con popover educativo propio (funciona en mobile)
import { useState } from 'react';
import Popover from '@mui/material/Popover';

// ─── Definición completa de cada métrica ─────────────────────────────────────

function buildInfo(stats, depositTotal) {
  const {
    netProfit, grossProfit, grossLoss,
    winRate, winners, losers, totalTrades,
    profitFactor, expectedPayoff,
    avgWin, avgLoss, bestTrade, worstTrade,
    maxDD, maxDDPct,
    longs, shorts, longWinRate, shortWinRate,
    maxConsecWins, maxConsecLosses,
  } = stats;

  const dep    = depositTotal;
  const roi    = dep > 0 ? (netProfit / dep) * 100 : 0;
  const rr     = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : null;
  const brkevenWR = rr != null ? (1 / (1 + rr)) * 100 : null;

  return {
    netProfit: {
      icon: '💰',
      title: 'Net P&L — Ganancia Neta',
      definition: 'Es el resultado económico real de tu trading: la suma de todos los profits y pérdidas incluyendo el costo de swap (financiamiento nocturno).',
      formula: 'Net P&L  =  Σ (Resultado + Swap)  de todos los trades',
      assess: netProfit > 0
        ? { label: '✓ Positivo', color: '#059669', bg: '#d1fae5', desc: 'Tu estrategia está generando ganancias netas.' }
        : netProfit < 0
        ? { label: '✗ Negativo', color: '#dc2626', bg: '#fee2e2', desc: 'Estás perdiendo capital neto. Revisa entradas y gestión de riesgo.' }
        : { label: '⚖ Neutral',  color: '#f59e0b', bg: '#fef3c7', desc: 'Resultado neutral. Sin ganancia ni pérdida real.' },
      interpretation:
        dep > 0
          ? `Depositaste $${dep.toFixed(2)}. Con un P&L de ${netProfit >= 0 ? '+' : ''}$${netProfit.toFixed(2)}, tu ROI es del ${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%. Ganancia bruta: +$${grossProfit.toFixed(2)} / Pérdida bruta: -$${Math.abs(grossLoss).toFixed(2)}.`
          : `P&L neto: ${netProfit >= 0 ? '+' : ''}$${netProfit.toFixed(2)}. Registra un depósito para ver el ROI.`,
      scale: [
        { color: '#059669', text: '> $0 → Rentable' },
        { color: '#dc2626', text: '< $0 → Pérdida neta' },
      ],
    },

    winRate: {
      icon: '🎯',
      title: 'Win Rate — Tasa de Acierto',
      definition: 'Porcentaje de trades que cerraron en positivo. Por sí sola no garantiza rentabilidad: importa combinada con el ratio ganancia/pérdida.',
      formula: 'Win Rate  =  (Trades ganadores ÷ Total trades) × 100',
      assess: winRate >= 55
        ? { label: '✓ Alta', color: '#059669', bg: '#d1fae5', desc: 'Más de la mitad de tus trades son ganadores.' }
        : winRate >= 45
        ? { label: '⚠ Media', color: '#f59e0b', bg: '#fef3c7', desc: 'Win rate ajustada. Necesitas un buen R:R para ser rentable.' }
        : { label: '✗ Baja', color: '#dc2626', bg: '#fee2e2', desc: 'Menos del 45% de acierto. Requiere R:R > 1.2 para compensar.' },
      interpretation:
        `De ${totalTrades} trades, ganaste ${winners} (${winRate.toFixed(1)}%) y perdiste ${losers} (${(100 - winRate).toFixed(1)}%). ${
          brkevenWR != null
            ? `Con tu R:R actual de ${rr!.toFixed(2)}, el break-even teórico es al ${brkevenWR.toFixed(1)}% de acierto — ${winRate >= brkevenWR ? 'lo estás superando ✓' : 'estás por debajo ✗'}.`
            : ''
        }`,
      scale: [
        { color: '#059669', text: '> 55% → Alta' },
        { color: '#f59e0b', text: '45–55% → Media' },
        { color: '#dc2626', text: '< 45% → Baja' },
      ],
    },

    profitFactor: {
      icon: '⚖️',
      title: 'Profit Factor — Factor de Beneficio',
      definition: 'Cuánto dinero ganas por cada dólar que pierdes. Es el indicador más directo de si una estrategia es sostenible en el largo plazo.',
      formula: 'Profit Factor  =  Ganancia Bruta ÷ |Pérdida Bruta|',
      assess: profitFactor == null
        ? { label: '—', color: '#6b7280', bg: '#f3f4f6', desc: 'Sin pérdidas aún — no se puede calcular.' }
        : profitFactor >= 1.5
        ? { label: '✦ Excelente', color: '#059669', bg: '#d1fae5', desc: 'Estrategia muy sólida. Por cada $1 perdido, ganas más de $1.50.' }
        : profitFactor >= 1.0
        ? { label: '✓ Rentable',  color: '#f59e0b', bg: '#fef3c7', desc: 'Eres rentable pero con margen ajustado. Objetivo: superar 1.5.' }
        : { label: '✗ Pérdida',   color: '#dc2626', bg: '#fee2e2', desc: 'Pierdes más de lo que ganas. La estrategia no es sostenible.' },
      interpretation:
        profitFactor != null
          ? `Por cada $1 que pierdes, estás ganando $${profitFactor.toFixed(2)}. Ganancia bruta: +$${grossProfit.toFixed(2)} vs pérdida bruta: -$${Math.abs(grossLoss).toFixed(2)}.`
          : 'Aún no tienes trades perdedores para calcular el ratio.',
      scale: [
        { color: '#059669', text: '≥ 1.5 → Excelente' },
        { color: '#f59e0b', text: '1.0–1.5 → Aceptable' },
        { color: '#dc2626', text: '< 1.0 → Pérdida' },
      ],
    },

    expectedPayoff: {
      icon: '📊',
      title: 'Expected Payoff — Ganancia Esperada',
      definition: 'Cuánto dinero ganas (o pierdes) en promedio por cada trade ejecutado. Si es positivo, el sistema es estadísticamente rentable a largo plazo.',
      formula: 'Expected Payoff  =  Net P&L ÷ Total de trades',
      assess: expectedPayoff > 0
        ? { label: '✓ Positivo', color: '#059669', bg: '#d1fae5', desc: 'En promedio cada trade suma a tu cuenta.' }
        : expectedPayoff < 0
        ? { label: '✗ Negativo', color: '#dc2626', bg: '#fee2e2', desc: 'En promedio cada trade resta a tu cuenta.' }
        : { label: '⚖ Cero',    color: '#f59e0b', bg: '#fef3c7', desc: 'Cada trade no suma ni resta en promedio.' },
      interpretation:
        `Con ${totalTrades} trades y Net P&L de $${netProfit.toFixed(2)}, cada operación te aporta en promedio $${Math.abs(expectedPayoff).toFixed(2)} ${expectedPayoff >= 0 ? '✓' : '(pérdida)'}. A este ritmo, en 50 trades esperarías $${(expectedPayoff * 50).toFixed(2)}.`,
      scale: [
        { color: '#059669', text: '> $0 → Sistema rentable' },
        { color: '#dc2626', text: '< $0 → Sistema perdedor' },
      ],
    },

    avgWin: {
      icon: '📈',
      title: 'Avg Ganancia — Promedio Ganador',
      definition: 'Ganancia promedio de los trades que cerraron en positivo. Combinado con el Avg Pérdida define el R:R real de tu operativa.',
      formula: 'Avg Ganancia  =  Ganancia Bruta ÷ Nº de trades ganadores',
      assess: rr != null && rr >= 1
        ? { label: '✓ R:R ≥ 1', color: '#059669', bg: '#d1fae5', desc: `R:R real de ${rr.toFixed(2)} — cada ganancia supera la pérdida promedio.` }
        : rr != null
        ? { label: '⚠ R:R < 1', color: '#f59e0b', bg: '#fef3c7', desc: `R:R de ${rr.toFixed(2)} — tus pérdidas superan tus ganancias en tamaño.` }
        : { label: '—', color: '#6b7280', bg: '#f3f4f6', desc: 'Sin pérdidas para calcular R:R.' },
      interpretation:
        `Ganas en promedio $${avgWin.toFixed(2)} por trade ganador. Tu mejor trade fue +$${bestTrade.toFixed(2)}.${
          rr != null ? ` Tu R:R real (Avg Ganancia ÷ Avg Pérdida) es ${rr.toFixed(2)}:1 — ${rr >= 1 ? 'cada ganancia supera la pérdida media ✓' : 'tus ganancias no compensan el tamaño de pérdidas ✗'}.` : ''
        }`,
      scale: [
        { color: '#059669', text: 'R:R ≥ 1 → Compensas las pérdidas' },
        { color: '#dc2626', text: 'R:R < 1 → Necesitas mayor Win Rate' },
      ],
    },

    avgLoss: {
      icon: '📉',
      title: 'Avg Pérdida — Promedio Perdedor',
      definition: 'Pérdida promedio de los trades que cerraron en negativo. Un buen trader controla que esta cifra sea predecible y consistente.',
      formula: 'Avg Pérdida  =  Pérdida Bruta ÷ Nº de trades perdedores',
      assess: Math.abs(avgLoss) <= Math.abs(avgWin)
        ? { label: '✓ Controlada', color: '#059669', bg: '#d1fae5', desc: 'La pérdida media es menor que la ganancia media.' }
        : { label: '⚠ Alta',       color: '#dc2626', bg: '#fee2e2', desc: 'La pérdida media supera la ganancia media. Ajusta stop-loss.' },
      interpretation:
        `Pierdes en promedio $${Math.abs(avgLoss).toFixed(2)} por trade perdedor. Tu peor trade fue -$${Math.abs(worstTrade).toFixed(2)}.${
          avgLoss !== 0 && avgWin !== 0
            ? ` Tus ganancias son ${(avgWin / Math.abs(avgLoss)).toFixed(2)}x el tamaño de tus pérdidas.`
            : ''
        }`,
      scale: [
        { color: '#059669', text: '|Avg Pérdida| < Avg Ganancia → Sano' },
        { color: '#dc2626', text: '|Avg Pérdida| > Avg Ganancia → Revisar SL' },
      ],
    },

    maxDD: {
      icon: '🔻',
      title: 'Max Drawdown — Máxima Caída',
      definition: 'La mayor caída de tu balance desde un máximo histórico hasta el mínimo siguiente. Mide el peor escenario que habrías vivido y representa el riesgo real de ruina.',
      formula: 'Max DD  =  Pico máximo de balance − Mínimo posterior\nMax DD%  =  (Max DD ÷ Pico) × 100',
      assess: maxDDPct <= 10
        ? { label: '✓ Controlado', color: '#059669', bg: '#d1fae5', desc: 'Drawdown < 10%. Gestión de riesgo sólida.' }
        : maxDDPct <= 20
        ? { label: '⚠ Moderado',  color: '#f59e0b', bg: '#fef3c7', desc: 'Drawdown entre 10–20%. Aceptable pero mejorable.' }
        : { label: '✗ Alto',      color: '#dc2626', bg: '#fee2e2', desc: 'Drawdown > 20%. Riesgo de ruina elevado. Reduce el lotaje.' },
      interpretation:
        `En el peor momento, tu balance cayó $${maxDD.toFixed(2)} (${maxDDPct.toFixed(1)}%) desde su máximo. ${
          maxDDPct > 20
            ? 'Un drawdown > 20% aumenta seriamente el riesgo de no recuperarse. Considera reducir el tamaño de posición.'
            : maxDDPct > 10
            ? 'Aceptable, pero trabaja en reducirlo con stops más ajustados o menor lotaje.'
            : 'Excelente control del riesgo. Mantén esta disciplina.'
        }`,
      scale: [
        { color: '#059669', text: '< 10% → Riesgo bajo' },
        { color: '#f59e0b', text: '10–20% → Riesgo moderado' },
        { color: '#dc2626', text: '> 20% → Riesgo alto' },
      ],
    },

    longShort: {
      icon: '↕️',
      title: 'Long vs Short — Compras vs Ventas',
      definition: 'Compara el rendimiento de tus posiciones de compra (Long/Buy) versus venta (Short/Sell). Identifica en qué dirección eres más efectivo.',
      formula: 'Win Rate Long  =  (Compras ganadoras ÷ Total compras) × 100\nWin Rate Short =  (Ventas ganadoras ÷ Total ventas) × 100',
      assess: Math.abs(longWinRate - shortWinRate) <= 10
        ? { label: '⚖ Equilibrado', color: '#7c3aed', bg: '#ede9fe', desc: 'Rendimiento similar en ambas direcciones.' }
        : longWinRate > shortWinRate
        ? { label: '↑ Long más fuerte',  color: '#059669', bg: '#d1fae5', desc: `Eres más efectivo en compras (+${(longWinRate - shortWinRate).toFixed(0)}pp).` }
        : { label: '↓ Short más fuerte', color: '#0d9488', bg: '#ccfbf1', desc: `Eres más efectivo en ventas (+${(shortWinRate - longWinRate).toFixed(0)}pp).` },
      interpretation:
        `${longs} compras con ${longWinRate.toFixed(1)}% de acierto. ${shorts} ventas con ${shortWinRate.toFixed(1)}% de acierto. ${
          longWinRate > shortWinRate
            ? `Te va mejor en compras. Considera priorizar setups alcistas.`
            : shortWinRate > longWinRate
            ? `Te va mejor en ventas. Considera priorizar setups bajistas.`
            : 'Rendimiento equilibrado en ambas direcciones.'
        } Racha máxima: ${maxConsecWins} ganancias / ${maxConsecLosses} pérdidas consecutivas.`,
      scale: [
        { color: '#059669', text: 'Long% alto → Favorece compras' },
        { color: '#0d9488', text: 'Short% alto → Favorece ventas' },
        { color: '#7c3aed', text: 'Diferencia < 10pp → Equilibrado' },
      ],
    },
  };
}

// ─── Popover de detalle ───────────────────────────────────────────────────────

function MetricPopover({ info, anchorEl, onClose, valueColor, value }) {
  if (!info) return null;
  const open = Boolean(anchorEl);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: '14px',
            boxShadow: '0 16px 48px rgba(109,77,209,0.22)',
            border: '1px solid #ddd6fe',
            maxWidth: 340,
            width: '92vw',
            p: 0,
            overflow: 'hidden',
          },
        },
      }}
    >
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)', padding: '14px 18px 12px' }}>
        <div style={{ fontSize: '1.1rem', marginBottom: 3 }}>{info.icon}</div>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{info.title}</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: valueColor || '#c4b5fd', fontFamily: 'monospace', marginTop: 4 }}>{value}</div>
      </div>

      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Definición */}
        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 3 }}>¿Qué es?</div>
          <div style={{ fontSize: '0.76rem', color: '#374151', lineHeight: 1.55 }}>{info.definition}</div>
        </div>

        {/* Fórmula */}
        <div style={{ background: '#f5f3ff', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 3 }}>Fórmula</div>
          <pre style={{ fontSize: '0.7rem', color: '#5b21b6', fontFamily: 'monospace', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {info.formula}
          </pre>
        </div>

        {/* Assessment */}
        <div style={{ background: info.assess.bg, borderRadius: 8, padding: '8px 10px', borderLeft: `3px solid ${info.assess.color}` }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: info.assess.color, marginBottom: 2 }}>{info.assess.label}</div>
          <div style={{ fontSize: '0.72rem', color: '#374151', lineHeight: 1.5 }}>{info.assess.desc}</div>
        </div>

        {/* Interpretación personalizada */}
        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 3 }}>Tu situación</div>
          <div style={{ fontSize: '0.74rem', color: '#374151', lineHeight: 1.6 }}>{info.interpretation}</div>
        </div>

        {/* Escala */}
        <div style={{ borderTop: '1px solid #ede9fe', paddingTop: 10 }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 5 }}>Referencia</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {info.scale.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.68rem', color: '#6b7280', fontFamily: 'monospace' }}>{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Popover>
  );
}

// ─── Tarjeta de métrica ───────────────────────────────────────────────────────

function MetricCard({ label, value, sub, valueColor, onClick }) {
  return (
    <button
      className="tt-stats-metrics__card"
      onClick={onClick}
      type="button"
      title="Toca para ver detalles"
    >
      <div className="tt-stats-metrics__card-label">{label}</div>
      <div className="tt-stats-metrics__card-value" style={{ color: valueColor }}>{value}</div>
      {sub && <div className="tt-stats-metrics__card-sub">{sub}</div>}
      <div className="tt-stats-metrics__card-tap">toca para saber más</div>
    </button>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

function StatsMetrics({ stats, depositTotal = 0 }) {
  const [anchor, setAnchor] = useState(null);
  const [active, setActive] = useState(null); // key de la métrica activa

  if (!stats) {
    return (
      <div className="tt-stats-metrics tt-stats-metrics--empty">
        Sin operaciones — importa o agrega trades para ver tus estadísticas
      </div>
    );
  }

  const info = buildInfo(stats, depositTotal);

  const openCard = (e, key) => {
    setAnchor(e.currentTarget);
    setActive(key);
  };
  const closeCard = () => { setAnchor(null); setActive(null); };

  const {
    netProfit, winRate, winners, losers, totalTrades,
    profitFactor, expectedPayoff, avgWin, avgLoss, bestTrade,
    maxDD, maxDDPct, longs, shorts, longWinRate, shortWinRate,
  } = stats;

  const pc  = (v) => v > 0 ? '#059669' : v < 0 ? '#dc2626' : '#6b7280';
  const pfC = profitFactor == null ? '#6b7280'
            : profitFactor >= 1.5 ? '#059669'
            : profitFactor >= 1.0 ? '#f59e0b'
            : '#dc2626';
  const ddC = maxDDPct > 20 ? '#dc2626' : maxDDPct > 10 ? '#f59e0b' : '#6b7280';

  // Función de formato de dinero
  const fmtM = (v) => {
    const s = `$${Math.abs(v).toFixed(2)}`;
    return v > 0 ? `+${s}` : v < 0 ? `-${s}` : s;
  };

  const activeInfo = active ? info[active] : null;
  const cardValues = {
    netProfit:    { label: fmtM(netProfit), color: pc(netProfit) },
    winRate:      { label: `${winRate.toFixed(1)}%`, color: winRate >= 50 ? '#059669' : '#dc2626' },
    profitFactor: { label: profitFactor != null ? profitFactor.toFixed(2) : '—', color: pfC },
    expectedPayoff:{ label: fmtM(expectedPayoff), color: pc(expectedPayoff) },
    avgWin:       { label: fmtM(avgWin), color: '#059669' },
    avgLoss:      { label: fmtM(avgLoss), color: '#dc2626' },
    maxDD:        { label: `${fmtM(-maxDD)} (${maxDDPct.toFixed(1)}%)`, color: ddC },
    longShort:    { label: `${longWinRate.toFixed(0)}% / ${shortWinRate.toFixed(0)}%`, color: '#7c3aed' },
  };

  return (
    <>
      <div className="tt-stats-metrics">
        <MetricCard
          label="Net P&L"
          value={cardValues.netProfit.label}
          sub={`Bruto: +$${stats.grossProfit.toFixed(2)} / -$${Math.abs(stats.grossLoss).toFixed(2)}`}
          valueColor={cardValues.netProfit.color}
          onClick={(e) => openCard(e, 'netProfit')}
        />
        <MetricCard
          label="Win Rate"
          value={cardValues.winRate.label}
          sub={`${winners}W  ${losers}L  de ${totalTrades}`}
          valueColor={cardValues.winRate.color}
          onClick={(e) => openCard(e, 'winRate')}
        />
        <MetricCard
          label="Profit Factor"
          value={cardValues.profitFactor.label}
          sub={profitFactor != null ? (profitFactor >= 1.5 ? '✦ Excelente' : profitFactor >= 1.0 ? '✓ Rentable' : '✗ Mejorar') : '—'}
          valueColor={cardValues.profitFactor.color}
          onClick={(e) => openCard(e, 'profitFactor')}
        />
        <MetricCard
          label="Expected Payoff"
          value={cardValues.expectedPayoff.label}
          sub="Ganancia media / trade"
          valueColor={cardValues.expectedPayoff.color}
          onClick={(e) => openCard(e, 'expectedPayoff')}
        />
        <MetricCard
          label="Avg Ganancia"
          value={cardValues.avgWin.label}
          sub={`Mejor: +$${bestTrade.toFixed(2)}`}
          valueColor={cardValues.avgWin.color}
          onClick={(e) => openCard(e, 'avgWin')}
        />
        <MetricCard
          label="Avg Pérdida"
          value={cardValues.avgLoss.label}
          sub={`Peor: -$${Math.abs(stats.worstTrade).toFixed(2)}`}
          valueColor={cardValues.avgLoss.color}
          onClick={(e) => openCard(e, 'avgLoss')}
        />
        <MetricCard
          label="Max Drawdown"
          value={cardValues.maxDD.label}
          sub={maxDDPct > 20 ? '⚠ Alto' : maxDDPct > 10 ? 'Moderado' : 'Controlado'}
          valueColor={cardValues.maxDD.color}
          onClick={(e) => openCard(e, 'maxDD')}
        />
        <MetricCard
          label="Long / Short"
          value={cardValues.longShort.label}
          sub={`${longs} compras · ${shorts} ventas`}
          valueColor={cardValues.longShort.color}
          onClick={(e) => openCard(e, 'longShort')}
        />
      </div>

      <MetricPopover
        info={activeInfo}
        anchorEl={anchor}
        onClose={closeCard}
        valueColor={active ? cardValues[active]?.color : undefined}
        value={active ? cardValues[active]?.label : undefined}
      />
    </>
  );
}

export default StatsMetrics;
