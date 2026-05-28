import Skeleton from '@mui/material/Skeleton';
import EquityLine     from '../ui/EquityLine';
import ActivityHeatmap from '../ui/ActivityHeatmap';
import PairsDonut     from '../ui/PairsDonut';
import MonthlyPnl     from '../ui/MonthlyPnl';
import StatsMetrics   from '../ui/StatsMetrics';
import TradesTable    from '../ui/TradesTable';
import useTradingStore from '../../store/useTradingStore';

const DEPOSIT_TYPES = ['Depósito', 'Crédito'];

// ─── Skeleton components ──────────────────────────────────────────────────────

function BalanceSummarySkeleton() {
  return (
    <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #ede9fe', display: 'flex', flexDirection: 'column', gap: 7 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Skeleton variant="text" width={65} height={13} />
          <Skeleton variant="text" sx={{ flex: 1 }} height={2} />
          <Skeleton variant="text" width={52} height={13} />
        </div>
      ))}
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="tt-dashboard__metrics-row">
      <div className="tt-stats-metrics">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="tt-stats-metrics__card" style={{ cursor: 'default', pointerEvents: 'none' }}>
            <Skeleton variant="text" width={70} height={11} sx={{ mb: 0.25 }} />
            <Skeleton variant="text" width={90} height={24} />
            <Skeleton variant="text" width={78} height={11} sx={{ mt: 0.25 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="tt-dashboard__stat-card">
      <Skeleton variant="text" width={120} height={17} sx={{ mb: 1.5, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
        {/* Nav row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Skeleton variant="rounded" width={24} height={24} sx={{ borderRadius: '6px' }} />
          <Skeleton variant="text" width={116} height={17} />
          <Skeleton variant="rounded" width={24} height={24} sx={{ borderRadius: '6px' }} />
        </div>
        {/* Day-of-week header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 30px)', gap: '2px', margin: '0 auto 4px' }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} variant="text" width={30} height={13} />
          ))}
        </div>
        {/* Calendar cells — 5 rows × 7 */}
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 30px)', gap: '2px', margin: '0 auto' }}>
            {Array.from({ length: 7 }).map((_, col) => (
              <Skeleton key={col} variant="rounded" width={30} height={30} sx={{ borderRadius: '6px' }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutSkeleton() {
  return (
    <div className="tt-dashboard__stat-card">
      <Skeleton variant="text" width={100} height={17} sx={{ mb: 1.5, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <Skeleton variant="circular" width={96} height={96} />
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Skeleton variant="rounded" width={8} height={8} sx={{ borderRadius: '2px', flexShrink: 0 }} />
              <Skeleton variant="text" height={14} sx={{ flex: 1 }} />
              <Skeleton variant="text" width={22} height={14} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BarChartSkeleton() {
  return (
    <div className="tt-dashboard__stat-card">
      <Skeleton variant="text" width={80} height={17} sx={{ mb: 1.5, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 14, paddingBottom: 20, paddingTop: 8 }}>
        {[130, 52, 96, 36].map((h, i) => (
          <Skeleton key={i} variant="rounded" width={32} height={h} sx={{ borderRadius: '4px 4px 0 0' }} />
        ))}
      </div>
    </div>
  );
}

// ─── Fila del resumen de cuenta ───────────────────────────────────────────────

function SummaryRow({ label, value, color, bold }) {
  return (
    <div className="tt-dashboard__account-summary-row">
      <span className={`tt-dashboard__account-summary-label${bold ? ' tt-dashboard__account-summary-label--bold' : ''}`}>
        {label}
      </span>
      <span className="tt-dashboard__account-summary-sep" />
      <span
        className={`tt-dashboard__account-summary-value${bold ? ' tt-dashboard__account-summary-value--bold' : ''}`}
        style={color ? { color } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard() {
  const operations = useTradingStore((s) => s.operations);
  const loading    = useTradingStore((s) => s.loading);
  const getStats   = useTradingStore((s) => s.getStats);

  // Separar depósitos, créditos y trades reales
  const depositOps = operations.filter((op) => op.orderType === 'Depósito');
  const creditOps  = operations.filter((op) => op.orderType === 'Crédito');
  const trades     = operations.filter((op) => !DEPOSIT_TYPES.includes(op.orderType));

  const depositTotal = depositOps.reduce((acc, op) => acc + (op.result || 0), 0);
  const creditTotal  = creditOps.reduce((acc, op)  => acc + (op.result || 0), 0);
  const capitalTotal = depositTotal + creditTotal;   // todo el dinero puesto en cuenta

  // P&L: resultado bruto de trades + swap
  const beneficio  = trades.reduce((acc, op) => acc + (op.result || 0), 0);
  const swapTotal  = trades.reduce((acc, op) => acc + (op.swap   || 0), 0);
  const tradingPnL = beneficio + swapTotal;
  const balance    = capitalTotal + tradingPnL;
  const pnlPercent = capitalTotal > 0 ? (tradingPnL / capitalTotal) * 100 : 0;

  // Curva de capital en orden cronológico
  const equityCurve = (() => {
    const chronoTrades = [...trades].reverse();
    let running = capitalTotal;
    const curve = [{ trade: 0, balance: capitalTotal }];
    chronoTrades.forEach((op, i) => {
      running += (op.result || 0) + (op.swap || 0);
      curve.push({ trade: i + 1, balance: parseFloat(running.toFixed(2)) });
    });
    return curve;
  })();

  const stats = !loading ? getStats() : null;

  const pnlClass =
    tradingPnL > 0 ? 'tt-dashboard__pnl--profit'
    : tradingPnL < 0 ? 'tt-dashboard__pnl--loss'
    : 'tt-dashboard__pnl--neutral';

  const sign       = tradingPnL > 0 ? '+' : '';
  const pnlDisplay = `${sign}${pnlPercent.toFixed(2)}%`;

  // Helpers de formato
  const pc      = (v) => v > 0 ? '#059669' : v < 0 ? '#dc2626' : undefined;
  const fmtM    = (v) => `$${Math.abs(v).toFixed(2)}`;
  const fmtSign = (v) => `${v > 0 ? '+' : v < 0 ? '-' : ''}$${Math.abs(v).toFixed(2)}`;

  return (
    <div className="tt-dashboard">

      {/* ── 1. Balance + curva de capital ─────────────────────────────────── */}
      <section className="tt-dashboard__topbar" aria-label="Resumen de cuenta">

        {/* Tarjeta izquierda: balance + resumen de cuenta */}
        <div className="tt-dashboard__balance-block" id="tt-balance-block">
          <span className="tt-dashboard__balance-label">Balance actual</span>

          {loading
            ? <Skeleton variant="text" width={140} height={44} />
            : <span className="tt-dashboard__balance-value">${balance.toFixed(2)}</span>
          }

          <div className="tt-dashboard__balance-meta">
            {loading
              ? <Skeleton variant="text" width={90} height={18} />
              : <span className="tt-dashboard__balance-initial">Capital: ${capitalTotal.toFixed(2)}</span>
            }
            {loading
              ? <Skeleton variant="rounded" width={80} height={18} sx={{ borderRadius: 10 }} />
              : (
                <span className={`tt-dashboard__pnl ${pnlClass}`}>
                  P&amp;L: {pnlDisplay}
                </span>
              )
            }
          </div>

          {/* Resumen de cuenta estilo MT5 */}
          <div className="tt-dashboard__account-summary">
            {loading ? (
              <BalanceSummarySkeleton />
            ) : (
              <>
                <SummaryRow label="Beneficio" value={fmtSign(beneficio)} color={pc(beneficio)} />
                {creditTotal !== 0 && (
                  <SummaryRow label="Crédito" value={fmtM(creditTotal)} />
                )}
                <SummaryRow label="Depósito"  value={fmtM(depositTotal)} />
                <SummaryRow label="Swap"      value={fmtSign(swapTotal)} color={pc(swapTotal)} />
                <SummaryRow label="Comisión"  value="$0.00" />
              </>
            )}
          </div>
        </div>

        {/* Tarjeta derecha: curva de capital */}
        <div className="tt-dashboard__chart-block">
          <p className="tt-dashboard__chart-block-title">Curva de capital</p>
          {loading
            ? <Skeleton variant="rounded" width="100%" height={90} />
            : <EquityLine equityCurve={equityCurve} initialBalance={capitalTotal} />
          }
        </div>
      </section>

      {/* ── 2. Métricas clave (estilo myfxbook) ───────────────────────────── */}
      <section aria-label="Métricas de rendimiento">
        {loading
          ? <MetricsSkeleton />
          : (
            <div className="tt-dashboard__metrics-row">
              <StatsMetrics stats={stats} depositTotal={capitalTotal} />
            </div>
          )
        }
      </section>

      {/* ── 3. Actividad + Pares + P&L mensual ────────────────────────────── */}
      <section className="tt-dashboard__stats-row" aria-label="Estadísticas del mes">
        {loading ? (
          <>
            <ActivitySkeleton />
            <DonutSkeleton />
            <BarChartSkeleton />
          </>
        ) : (
          <>
            <div className="tt-dashboard__stat-card">
              <p className="tt-dashboard__stat-card-title">Actividad del mes</p>
              <div className="tt-dashboard__stat-card-content">
                <ActivityHeatmap operations={trades} />
              </div>
            </div>
            <div className="tt-dashboard__stat-card">
              <p className="tt-dashboard__stat-card-title">Pares operados</p>
              <div className="tt-dashboard__stat-card-content">
                <PairsDonut operations={trades} />
              </div>
            </div>
            <div className="tt-dashboard__stat-card">
              <p className="tt-dashboard__stat-card-title">P&amp;L mensual</p>
              <div className="tt-dashboard__stat-card-content">
                <MonthlyPnl operations={trades} />
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── 4. Tabla de operaciones ───────────────────────────────────────── */}
      <section className="tt-dashboard__table-wrapper" aria-label="Historial de operaciones">
        <TradesTable loading={loading} />
      </section>

    </div>
  );
}

export default Dashboard;
