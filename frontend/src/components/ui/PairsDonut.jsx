import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#7c3aed', '#a78bfa', '#5b21b6', '#c4b5fd', '#4c1d95'];

function PairsDonut({ operations }) {
  const counts = {};
  operations.forEach((op) => {
    if (!op.pair) return;
    counts[op.pair] = (counts[op.pair] || 0) + 1;
  });

  const data = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  if (!data.length) {
    return <div className="tt-pairs-donut tt-pairs-donut--empty" style={{ height: 175 }}>Sin operaciones</div>;
  }

  return (
    <div className="tt-pairs-donut">
      <ResponsiveContainer width="100%" height={175}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={50}
            dataKey="value"
            strokeWidth={2}
            stroke="#ffffff"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              fontSize: 11,
              borderRadius: 8,
              border: '1px solid #ddd6fe',
              boxShadow: '0 4px 12px rgba(109,77,209,0.12)',
            }}
            formatter={(v, n) => [`${v} ops`, n]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="tt-pairs-donut__legend">
        {data.map((d, i) => (
          <div key={d.name} className="tt-pairs-donut__legend-item">
            <span
              className="tt-pairs-donut__legend-dot"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="tt-pairs-donut__legend-name">{d.name}</span>
            <span className="tt-pairs-donut__legend-count">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PairsDonut;
