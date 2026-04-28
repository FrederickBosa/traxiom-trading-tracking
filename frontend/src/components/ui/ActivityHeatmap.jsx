// Sin useMemo manual: el React Compiler (React 19) los gestiona automáticamente.
// Tenerlos causaba "Compilation Skipped" porque detectaba mutación en setHours.

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function getCellColor(data, isFuture) {
  if (isFuture) return '#f5f3ff';
  if (!data || data.count === 0) return '#f0edff';
  const { netResult } = data;
  if (netResult === 0) return '#c4b5fd';
  const intensity = Math.min(Math.abs(netResult) / 80, 1);
  if (netResult > 0) return `rgba(5,150,105,${0.18 + intensity * 0.72})`;
  return `rgba(220,38,38,${0.15 + intensity * 0.72})`;
}

function getDayNumColor(data, isFuture) {
  if (isFuture) return '#c4b5fd';
  if (!data || data.count === 0) return '#7c6fcd';
  const intensity = Math.min(Math.abs(data.netResult) / 80, 1);
  return intensity > 0.5 ? '#fff' : '#1e1b4b';
}

function ActivityHeatmap({ operations }) {
  // Fecha local de hoy a medianoche — sin mutar el objeto (new Date(y,m,d))
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const year  = today.getFullYear();
  const month = today.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Monday-first offset: Mon=0 … Sun=6
  const rawDow  = new Date(year, month, 1).getDay();
  const firstDow = rawDow === 0 ? 6 : rawDow - 1;

  // Grilla de celdas: null = relleno, número = día del mes
  const head     = Array(firstDow).fill(null);
  const days     = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const combined = [...head, ...days];
  const rem      = combined.length % 7;
  const cells    = rem === 0 ? combined : [...combined, ...Array(7 - rem).fill(null)];

  // Índice fecha→{count, netResult} (sin mutación de objeto)
  const tradesByDate = operations.reduce((acc, op) => {
    const dateKey = (op.createdAt || '').slice(0, 10);
    if (!dateKey) return acc;
    const prev = acc[dateKey] ?? { count: 0, netResult: 0 };
    return {
      ...acc,
      [dateKey]: {
        count:     prev.count + 1,
        netResult: prev.netResult + (op.result || 0),
      },
    };
  }, {});

  const monthTitle = today.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="tt-activity-heatmap">
      <p className="tt-activity-heatmap__month-title">{monthTitle}</p>

      {/* Day-of-week headers */}
      <div className="tt-activity-heatmap__dow-row">
        {DAY_LABELS.map((d) => (
          <span key={d} className="tt-activity-heatmap__dow-label">{d}</span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="tt-activity-heatmap__cal-grid">
        {cells.map((day, idx) => {
          if (!day) {
            return <div key={`pad-${idx}`} className="tt-activity-heatmap__cal-empty" />;
          }
          const mm      = String(month + 1).padStart(2, '0');
          const dd      = String(day).padStart(2, '0');
          const dateStr = `${year}-${mm}-${dd}`;
          const cellDate = new Date(year, month, day);
          const isFuture = cellDate > today;
          const isToday  = cellDate.getTime() === today.getTime();
          const data     = tradesByDate[dateStr] ?? null;
          const bg       = getCellColor(data, isFuture);
          const numColor = getDayNumColor(data, isFuture);

          return (
            <div
              key={dateStr}
              className={`tt-activity-heatmap__cal-day${isToday ? ' tt-activity-heatmap__cal-day--today' : ''}`}
              style={{ backgroundColor: bg }}
              title={
                data
                  ? `${day} — ${data.count} op${data.count !== 1 ? 's' : ''} · ${data.netResult >= 0 ? '+' : ''}$${data.netResult.toFixed(2)}`
                  : isFuture
                  ? undefined
                  : `${day} — sin operaciones`
              }
            >
              <span className="tt-activity-heatmap__cal-num" style={{ color: numColor }}>
                {day}
              </span>
              {data && (
                <span className="tt-activity-heatmap__cal-dot" style={{ backgroundColor: numColor }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="tt-activity-heatmap__cal-legend">
        <span style={{ backgroundColor: 'rgba(5,150,105,0.55)' }} />
        <span className="tt-activity-heatmap__cal-legend-label">Ganancia</span>
        <span style={{ backgroundColor: 'rgba(220,38,38,0.55)' }} />
        <span className="tt-activity-heatmap__cal-legend-label">Pérdida</span>
        <span style={{ backgroundColor: '#f0edff', border: '1px solid #ddd6fe' }} />
        <span className="tt-activity-heatmap__cal-legend-label">Sin ops</span>
      </div>
    </div>
  );
}

export default ActivityHeatmap;
