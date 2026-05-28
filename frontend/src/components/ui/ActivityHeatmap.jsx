// Sin useMemo manual: el React Compiler (React 19) los gestiona automáticamente.
import { useState } from 'react';
import ChevronLeftRoundedIcon  from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

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
  // Fecha local de hoy
  const now     = new Date();
  const todayY  = now.getFullYear();
  const todayM  = now.getMonth();    // 0-indexed
  const todayD  = now.getDate();
  const todayObj = new Date(todayY, todayM, todayD);

  // Mes más antiguo con operaciones (para limitar navegación hacia atrás)
  const earliestKey = operations.reduce((min, op) => {
    const k = (op.createdAt || '').slice(0, 7);
    return (!min || k < min) ? k : min;
  }, '');
  const [earliestY, earliestMStr] = earliestKey ? earliestKey.split('-') : [String(todayY), String(todayM + 1)];
  const earliestYear  = parseInt(earliestY, 10) || todayY;
  const earliestMonth = (parseInt(earliestMStr, 10) || (todayM + 1)) - 1; // 0-indexed

  // Estado: mes visible
  const [viewYear,  setViewYear]  = useState(todayY);
  const [viewMonth, setViewMonth] = useState(todayM); // 0-indexed

  const canGoBack = viewYear > earliestYear || (viewYear === earliestYear && viewMonth > earliestMonth);
  const canGoFwd  = viewYear < todayY || (viewYear === todayY && viewMonth < todayM);

  function prevMonth() {
    if (!canGoBack) return;
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (!canGoFwd) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const year  = viewYear;
  const month = viewMonth;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rawDow   = new Date(year, month, 1).getDay();
  const firstDow = rawDow === 0 ? 6 : rawDow - 1; // lunes = 0

  const head     = Array(firstDow).fill(null);
  const days     = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const combined = [...head, ...days];
  const rem      = combined.length % 7;
  const cells    = rem === 0 ? combined : [...combined, ...Array(7 - rem).fill(null)];

  // Índice fecha → { count, netResult }
  const tradesByDate = operations.reduce((acc, op) => {
    const dateKey = (op.createdAt || '').slice(0, 10);
    if (!dateKey) return acc;
    const prev = acc[dateKey] ?? { count: 0, netResult: 0 };
    return {
      ...acc,
      [dateKey]: {
        count:     prev.count + 1,
        netResult: prev.netResult + (op.result || 0) + (op.swap || 0),
      },
    };
  }, {});

  // Resumen del mes visible
  const mm = String(month + 1).padStart(2, '0');
  const monthPrefix = `${year}-${mm}`;
  const monthEntries = Object.entries(tradesByDate).filter(([k]) => k.startsWith(monthPrefix));
  const monthTrades = monthEntries.reduce((s, [, v]) => s + v.count, 0);
  const monthPnl    = monthEntries.reduce((s, [, v]) => s + v.netResult, 0);

  const monthTitle = new Date(year, month, 1)
    .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const pnlColor = monthPnl > 0 ? '#059669' : monthPnl < 0 ? '#dc2626' : '#9ca3af';
  const pnlSign  = monthPnl > 0 ? '+' : '';

  return (
    <div className="tt-activity-heatmap">
      {/* Cabecera con navegación */}
      <div className="tt-activity-heatmap__nav">
        <button
          className="tt-activity-heatmap__nav-btn"
          onClick={prevMonth}
          disabled={!canGoBack}
          aria-label="Mes anterior"
        >
          <ChevronLeftRoundedIcon sx={{ fontSize: 16 }} />
        </button>

        <div className="tt-activity-heatmap__nav-center">
          <p className="tt-activity-heatmap__month-title">{monthTitle}</p>
          {monthTrades > 0 && (
            <span className="tt-activity-heatmap__month-summary" style={{ color: pnlColor }}>
              {monthTrades} op{monthTrades !== 1 ? 's' : ''} · {pnlSign}${monthPnl.toFixed(2)}
            </span>
          )}
        </div>

        <button
          className="tt-activity-heatmap__nav-btn"
          onClick={nextMonth}
          disabled={!canGoFwd}
          aria-label="Mes siguiente"
        >
          <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
        </button>
      </div>

      {/* Etiquetas días de la semana */}
      <div className="tt-activity-heatmap__dow-row">
        {DAY_LABELS.map((d) => (
          <span key={d} className="tt-activity-heatmap__dow-label">{d}</span>
        ))}
      </div>

      {/* Grilla */}
      <div className="tt-activity-heatmap__cal-grid">
        {cells.map((day, idx) => {
          if (!day) {
            return <div key={`pad-${idx}`} className="tt-activity-heatmap__cal-empty" />;
          }
          const dd      = String(day).padStart(2, '0');
          const dateStr = `${year}-${mm}-${dd}`;
          const cellDate = new Date(year, month, day);
          const isFuture = cellDate > todayObj;
          const isToday  = cellDate.getTime() === todayObj.getTime();
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

      {/* Leyenda */}
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
