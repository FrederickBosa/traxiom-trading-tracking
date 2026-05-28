// MonthlyPnl — barras de P&L por mes (reemplaza el radar)
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, CartesianGrid,
} from 'recharts';

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function buildData(operations) {
  const monthly = {};
  operations.forEach((op) => {
    const key = (op.createdAt || '').slice(0, 7); // "YYYY-MM"
    if (!key || key.length < 7) return;
    if (!monthly[key]) monthly[key] = 0;
    monthly[key] += (op.result || 0) + (op.swap || 0);
  });

  return Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, pnl]) => {
      const [yr, mo] = key.split('-');
      const label = `${MONTH_NAMES[+mo - 1]} '${yr.slice(2)}`;
      return { label, pnl: parseFloat(pnl.toFixed(2)) };
    });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #ddd6fe',
      borderRadius: 8,
      padding: '6px 10px',
      fontSize: 11,
      boxShadow: '0 4px 12px rgba(109,77,209,0.12)',
    }}>
      <div style={{ fontWeight: 700, color: '#6d28d9', marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: 'monospace', color: v >= 0 ? '#059669' : '#dc2626', fontWeight: 700 }}>
        {v >= 0 ? '+' : ''}{v.toFixed(2)} USD
      </div>
    </div>
  );
};

function MonthlyPnl({ operations }) {
  const data = buildData(operations);

  if (!data.length) {
    return (
      <div className="tt-monthly-pnl tt-monthly-pnl--empty" style={{ height: 205 }}>
        Sin operaciones
      </div>
    );
  }

  return (
    <div className="tt-monthly-pnl">
      <ResponsiveContainer width="100%" height={205}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 28, left: 4 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#9ca3af', fontSize: 9, fontWeight: 600 }}
            tickLine={false}
            axisLine={{ stroke: '#ddd6fe' }}
            label={{
              value: 'P&L por mes',
              position: 'insideBottom',
              offset: -16,
              fill: '#c4b5fd',
              fontSize: 9,
            }}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f3ff' }} />
          <ReferenceLine y={0} stroke="#ddd6fe" strokeWidth={1} />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={36}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.pnl >= 0 ? '#059669' : '#dc2626'}
                fillOpacity={0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MonthlyPnl;
