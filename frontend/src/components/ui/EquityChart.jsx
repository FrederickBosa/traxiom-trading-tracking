import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

function EquityChart({ equityCurve, initialBalance }) {
  return (
    <div className="tt-equity-chart">
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={equityCurve} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />

          <XAxis
            dataKey="trade"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#ddd6fe' }}
            label={{
              value: 'Operaciones',
              position: 'insideBottom',
              offset: -2,
              fill: '#c4b5fd',
              fontSize: 10,
            }}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={58}
            tickFormatter={(v) => `$${v}`}
          />

          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #ddd6fe',
              borderRadius: 8,
              color: '#1e1b4b',
              fontSize: 12,
              boxShadow: '0 4px 12px rgba(109,77,209,0.12)',
            }}
            formatter={(v) => [`$${v.toFixed(2)}`, 'Balance']}
            labelFormatter={(l) => (l === 0 ? 'Balance inicial' : `Trade #${l}`)}
          />

          <ReferenceLine
            y={initialBalance}
            stroke="#c4b5fd"
            strokeDasharray="5 4"
            label={{
              value: `$${initialBalance}`,
              position: 'right',
              fill: '#c4b5fd',
              fontSize: 10,
            }}
          />

          <Area
            type="monotone"
            dataKey="balance"
            stroke="#7c3aed"
            strokeWidth={2.5}
            fill="url(#balanceGrad)"
            dot={{ r: 4, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default EquityChart;
