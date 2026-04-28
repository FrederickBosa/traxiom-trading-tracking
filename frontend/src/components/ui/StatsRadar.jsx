import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

const COLORS = ['#7c3aed', '#f59e0b', '#0d9488'];

// Agrupa las operaciones por par, calcula métricas promedio y
// devuelve los top-3 pares por número de trades.
function buildDataByPair(ops) {
  // 1. Agrupar por par
  const groups = {};
  ops.forEach((op) => {
    const pair = op.pair || '?';
    if (!groups[pair]) groups[pair] = [];
    groups[pair].push(op);
  });

  // 2. Top-3 pares más operados
  const top3 = Object.entries(groups)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
    .map(([pair, pairOps]) => {
      const avg    = (fn) => pairOps.reduce((s, op) => s + (fn(op) || 0), 0) / pairOps.length;
      const entry  = avg((op) => parseFloat(op.entryPoint));
      const tp     = avg((op) => parseFloat(op.takeProfit));
      const sl     = avg((op) => parseFloat(op.stopLoss));
      const slDist = Math.abs(entry - sl);
      const tpDist = Math.abs(tp - entry);
      return {
        pair,
        pnlAbs: Math.abs(avg((op) => op.result)),
        riesgo: avg((op) => parseFloat(op.risk)),
        rr:     slDist > 0 ? tpDist / slDist : 0,
        tpDist,
        slDist,
      };
    });

  // 3. Normalizar cada métrica a 0-100
  const keys   = ['pnlAbs', 'riesgo', 'rr', 'tpDist', 'slDist'];
  const labels = ['Resultado', 'Riesgo', 'R:R', 'TP', 'SL'];
  const maxes  = {};
  keys.forEach((k) => {
    maxes[k] = Math.max(...top3.map((g) => g[k]), 0.001);
  });

  const data = labels.map((label, li) => {
    const row = { metric: label };
    top3.forEach((g, i) => {
      row[`p${i}`] = Math.round((g[keys[li]] / maxes[keys[li]]) * 100);
    });
    return row;
  });

  return { data, pairs: top3.map((g) => g.pair) };
}

function StatsRadar({ operations }) {
  if (!operations.length) {
    return (
      <div className="tt-stats-radar tt-stats-radar--empty" style={{ height: 205 }}>
        Sin operaciones
      </div>
    );
  }

  const { data, pairs } = buildDataByPair(operations);

  return (
    <div className="tt-stats-radar">
      <ResponsiveContainer width="100%" height={205}>
        <RadarChart data={data} cx="50%" cy="48%" outerRadius={62}>
          <PolarGrid stroke="#ddd6fe" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: '#9ca3af', fontSize: 9, fontWeight: 600 }}
          />
          {pairs.map((pair, i) => (
            <Radar
              key={pair}
              name={pair}
              dataKey={`p${i}`}
              stroke={COLORS[i]}
              fill={COLORS[i]}
              fillOpacity={0.08}
              strokeWidth={2}
              dot={{ r: 3, fill: COLORS[i], strokeWidth: 0 }}
            />
          ))}
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #ddd6fe' }}
            formatter={(v) => [`${v}`, undefined]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default StatsRadar;
