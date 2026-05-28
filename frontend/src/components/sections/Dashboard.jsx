import Skeleton from '@mui/material/Skeleton';
import EquityLine    from '../ui/EquityLine';
import ActivityHeatmap from '../ui/ActivityHeatmap';
import PairsDonut    from '../ui/PairsDonut';
import MonthlyPnl    from '../ui/MonthlyPnl';
import StatsMetrics  from '../ui/StatsMetrics';
import TradesTable   from '../ui/TradesTable';
import useTradingStore from '../../store/useTradingStore';

function StatCardSkeleton() {
  return (
    <div className="tt-dashboard__stat-card">
      <Skeleton variant="text" width={140} height={20} sx={{ mb: 1 }} />
      <Skeleton variant="rounded" width="100%" height={160} />
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="tt-dashboard__metrics-row">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="tt-stats-metrics__card">
          <Skeleton variant="text" width={80} height={14} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={110} height={28} />
          <Skeleton variant="text" width={90} height={12} sx={{ mt: 0.5 }} />
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  const operations  = useTradingStore((s) => s.operations);
  const loading     = useTradingStore((s) => s.loading);
  const getStats    = useTradingStore((s) => s.getStats);

  const deposits     = operations.filter((op) => op.orderType === 'Depósito');
  const trades       = operations.filter((op) => op.orderType !== 'Depósito');
  const depositTotal = deposits.reduce((acc, op) => acc + (op.result || 0), 0);

  // Balance real = depósitos + (result + swap) de cada trade
  const tradingPnL = trades.reduce((acc, op) => acc + (op.result || 0) + (op.swap || 0), 0);
  const balance    = depositTotal + tradingPnL;
  const pnlPercent = depositTotal > 0 ? (tradingPnL / depositTotal) * 100 : 0;

  // Curva de capital en orden cronológico + swap incluido
  const equityCurve = (() => {
    const chronoTrades = [...trades].reverse();
    let running = depositTotal;
    const curve = [{ trade: 0, balance: depositTotal }];
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

  const sign      = tradingPnL > 0 ? '+' : '';
  const pnlDisplay = `${sign}${pnlPercent.toFixed(2)}%`;

  return (
    <div className="tt-dashboard">

      {/* ── 1. Balance + curva de capital ─────────────────────────────────── */}
      <section className="tt-dashboard__topbar" aria-label="Resumen de cuenta">
        <div className="tt-dashboard__balance-block" id="tt-balance-block">
          <span className="tt-dashboard__balance-label">Balance actual</span>

          {loading
            ? <Skeleton variant="text" width={140} height={44} />
            : <span className="tt-dashboard__balance-value">${balance.toFixed(2)}</span>
          }

          <div className="tt-dashboard__balance-meta">
            <span className="tt-dashboard__balance-initial">
              {loading
                ? <Skeleton variant="text" width={90} height={18} />
                : `Depositado: $${depositTotal.toFixed(2)}`
              }
            </span>
            {loading
              ? <Skeleton variant="text" width={80} height={18} />
              : (
                <span className={`tt-dashboard__pnl ${pnlClass}`}>
                  P&amp;L: {pnlDisplay}
                </span>
              )
            }
          </div>
        </div>

        <div className="tt-dashboard__chart-block">
          <p className="tt-dashboard__chart-block-title">Curva de capital</p>
          {loading
            ? <Skeleton variant="rounded" width="100%" height={90} />
            : <EquityLine equityCurve={equityCurve} initialBalance={depositTotal} />
          }
        </div>
      </section>

      {/* ── 2. Métricas clave (estilo myfxbook) ───────────────────────────── */}
      <section aria-label="Métricas de rendimiento">
        {loading
          ? <MetricsSkeleton />
          : (
            <div className="tt-dashboard__metrics-row">
              <StatsMetrics stats={stats} depositTotal={depositTotal} />
            </div>
          )
        }
      </section>

      {/* ── 3. Actividad + Pares + P&L mensual ────────────────────────────── */}
      <section className="tt-dashboard__stats-row" aria-label="Estadísticas del mes">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="tt-dashboard__stat-card">
              <p className="tt-dashboard__stat-card-title">Actividad del mes</p>
              <ActivityHeatmap operations={trades} />
            </div>
            <div className="tt-dashboard__stat-card">
              <p className="tt-dashboard__stat-card-title">Pares operados</p>
              <PairsDonut operations={trades} />
            </div>
            <div className="tt-dashboard__stat-card">
              <p className="tt-dashboard__stat-card-title">P&amp;L mensual</p>
              <MonthlyPnl operations={trades} />
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
