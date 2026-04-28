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

function buildData(ops) {
  const raw = ops.map((op) => {
    const entry = parseFloat(op.entryPoint) || 0;
    const tp    = parseFloat(op.takeProfit) || 0;
    const sl    = parseFloat(op.stopLoss)   || 0;
    const slDist = Math.abs(entry - sl);
    const tpDist = Math.abs(tp - entry);
    return {
      pnlAbs: Math.abs(op.result || 0),
      riesgo: parseFloat(op.risk) || 0,
      rr:     slDist > 0 ? parseFloat((tpDist / slDist).toFixed(2)) : 0,
      tpDist: parseFloat(tpDist.toFixed(5)),
      slDist: parseFloat(slDist.toFixed(5)),
    };
  });

  const keys   = ['pnlAbs', 'riesgo', 'rr', 'tpDist', 'slDist'];
  const labels = ['Resultado', 'Riesgo', 'R:R', 'TP', 'SL'];

  // Normalize each column to 0–100 across the ops
  const maxes = {};
  keys.forEach((k) => { maxes[k] = Math.max(...raw.map((r) => r[k]), 0.001); });
  const norm = raw.map((r) => {
    const n = {};
    keys.forEach((k) => { n[k] = Math.round((r[k] / maxes[k]) * 100); });
    return n;
  });

  return labels.map((label, li) => {
    const row = { metric: label };
    norm.forEach((n, i) => { row[`op${i}`] = n[keys[li]]; });
    return row;
  });
}

function StatsRadar({ operations }) {
  // Use the last 3 operations (any status)
  const last3 = operations.slice(-3);

  if (!last3.length) {
    return <div className="tt-stats-radar tt-stats-radar--empty" style={{ height: 205 }}>Sin operaciones</div>;
  }

  const data = buildData(last3);

  return (
    <div className="tt-stats-radar">
      <ResponsiveContainer width="100%" height={205}>
        <RadarChart data={data} cx="50%" cy="48%" outerRadius={62}>
          <PolarGrid stroke="#ddd6fe" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: '#9ca3af', fontSize: 9, fontWeight: 600 }}
          />
          {last3.map((op, i) => (
            <Radar
              key={op.id}
              name={op.pair || `Op ${i + 1}`}
              dataKey={`op${i}`}
              stroke={COLORS[i]}
              fill={COLORS[i]}
              fillOpacity={0}
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
