import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

// Clean SVG circle — rendered independent of the dashed line path
const CircleDot = (props) => {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={4} fill="#ffffff" stroke="#7c3aed" strokeWidth={2.5} />;
};
const CircleActiveDot = (props) => {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={6} fill="#7c3aed" stroke="#ffffff" strokeWidth={2} />;
};

// Clean SVG square — same size & stroke weight as circle
const SquareDot = (props) => {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return <rect x={cx - 4} y={cy - 4} width={8} height={8} fill="#ffffff" stroke="#f59e0b" strokeWidth={2.5} />;
};
const SquareActiveDot = (props) => {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return <rect x={cx - 5} y={cy - 5} width={10} height={10} fill="#f59e0b" stroke="#ffffff" strokeWidth={2} />;
};

function EquityLine({ equityCurve, initialBalance }) {
  const data = equityCurve.map((pt) => ({
    ...pt,
    baseline: initialBalance,
  }));

  return (
    <ResponsiveContainer width="100%" height={170}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
        <XAxis
          dataKey="trade"
          tick={{ fill: '#9ca3af', fontSize: 10 }}
          tickLine={false}
          axisLine={{ stroke: '#ddd6fe' }}
          label={{ value: 'Operaciones', position: 'insideBottom', offset: -2, fill: '#c4b5fd', fontSize: 9 }}
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
          formatter={(v, name) => [`$${Number(v).toFixed(2)}`, name === 'balance' ? 'Balance' : 'Inicial']}
          labelFormatter={(l) => (l === 0 ? 'Inicio' : `Trade #${l}`)}
        />
        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} formatter={(v) => (v === 'balance' ? 'Balance' : 'Inicial')} />

        {/* Baseline — amber dashed, square dots */}
        <Line
          type="monotone"
          dataKey="baseline"
          stroke="#f59e0b"
          strokeDasharray="5 5"
          strokeWidth={1.5}
          dot={<SquareDot />}
          activeDot={<SquareActiveDot />}
        />

        {/* Balance — purple dashed, circle dots */}
        <Line
          type="monotone"
          dataKey="balance"
          stroke="#7c3aed"
          strokeDasharray="5 5"
          strokeWidth={2}
          dot={<CircleDot />}
          activeDot={<CircleActiveDot />}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default EquityLine;
