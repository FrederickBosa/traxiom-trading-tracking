import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

// Dot personalizado para la línea de balance (círculo limpio)
const CircleDot = ({ cx, cy }) => {
  if (cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={4} fill="#ffffff" stroke="#7c3aed" strokeWidth={2.5} />;
};
const CircleActiveDot = ({ cx, cy }) => {
  if (cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={6} fill="#7c3aed" stroke="#ffffff" strokeWidth={2} />;
};

function EquityLine({ equityCurve, initialBalance }) {
  return (
    <ResponsiveContainer width="100%" height={170}>
      <LineChart data={equityCurve} margin={{ top: 8, right: 16, bottom: 24, left: 4 }}>
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

        {/* Línea de referencia: balance inicial — fina, sin puntos */}
        <ReferenceLine
          y={initialBalance}
          stroke="#f59e0b"
          strokeWidth={1.5}
          strokeDasharray="6 3"
          label={{
            value: `Inicial $${initialBalance}`,
            position: 'insideTopRight',
            fill: '#f59e0b',
            fontSize: 9,
          }}
        />

        {/* Curva de balance — sólida, con puntos circulares */}
        <Line
          type="monotone"
          dataKey="balance"
          stroke="#7c3aed"
          strokeWidth={2}
          dot={<CircleDot />}
          activeDot={<CircleActiveDot />}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default EquityLine;
