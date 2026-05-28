import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';

// ─── Dots ─────────────────────────────────────────────────────────────────────

const CircleDot = ({ cx, cy }) => {
  if (cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={3.5} fill="#fff" stroke="#7c3aed" strokeWidth={2} />;
};
const CircleActiveDot = ({ cx, cy }) => {
  if (cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={5.5} fill="#7c3aed" stroke="#fff" strokeWidth={2} />;
};

// ─── Filtros disponibles ──────────────────────────────────────────────────────

const FILTERS = [
  { label: '10',   value: 10  },
  { label: '25',   value: 25  },
  { label: '50',   value: 50  },
  { label: 'Todo', value: null },
];

// ─── Componente ───────────────────────────────────────────────────────────────

function EquityLine({ equityCurve, initialBalance }) {
  const [filter, setFilter] = useState(null); // null = todas

  const totalTrades = equityCurve.length - 1; // sin contar el punto inicial

  // Sólo mostrar filtros numéricos que sean menores al total de trades
  const applicable = FILTERS.filter(
    (f) => f.value == null || totalTrades > f.value
  );
  const canFilter = applicable.some((f) => f.value != null);

  // Datos filtrados: últimos N + punto de arranque
  const filtered =
    filter != null && equityCurve.length > filter + 1
      ? equityCurve.slice(-(filter + 1))
      : equityCurve;

  // Línea de referencia: balance al inicio de la ventana visible
  const refBalance =
    filter != null ? (filtered[0]?.balance ?? initialBalance) : initialBalance;
  const refLabel =
    filter != null
      ? `Inicio ·  $${refBalance.toFixed(0)}`
      : `Inicial  $${refBalance.toFixed(0)}`;

  // Puntos en la línea sólo cuando hay pocos datos (>20 quedan muy densos)
  const showDots = filtered.length <= 22;

  return (
    <div className="tt-equity-line">

      {/* ── Header: título + filtros ── */}
      <div className="tt-equity-line__header">
        <span className="tt-equity-line__title">Curva de capital</span>

        {canFilter && (
          <div className="tt-equity-line__filters" role="group" aria-label="Filtrar rango">
            {applicable.map(({ label, value }) => (
              <button
                key={label}
                type="button"
                className={`tt-equity-line__filter-btn${filter === value ? ' tt-equity-line__filter-btn--active' : ''}`}
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Gráfica ── */}
      <div className="tt-equity-line__chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filtered} margin={{ top: 8, right: 16, bottom: 24, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />

            <XAxis
              dataKey="trade"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#ddd6fe' }}
              label={{
                value: 'Operaciones',
                position: 'insideBottom',
                offset: -12,
                fill: '#c4b5fd',
                fontSize: 9,
              }}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={54}
              tickFormatter={(v) => `$${v}`}
              domain={['auto', 'auto']}
            />

            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #ddd6fe',
                borderRadius: 8,
                fontSize: 11,
                boxShadow: '0 4px 12px rgba(109,77,209,0.12)',
              }}
              formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Balance']}
              labelFormatter={(l) => (l === 0 ? 'Inicio' : `Trade #${l}`)}
            />

            <ReferenceLine
              y={refBalance}
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              label={{
                value: refLabel,
                position: 'insideTopRight',
                fill: '#f59e0b',
                fontSize: 9,
              }}
            />

            <Line
              type="monotone"
              dataKey="balance"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={showDots ? <CircleDot /> : false}
              activeDot={<CircleActiveDot />}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default EquityLine;
