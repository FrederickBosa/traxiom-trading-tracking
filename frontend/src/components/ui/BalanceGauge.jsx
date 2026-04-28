import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const RANGE = 25; // ±25% shown on gauge

function BalanceGauge({ balance, initialBalance }) {
  const pnl = balance - initialBalance;
  const pnlPercent = initialBalance > 0 ? (pnl / initialBalance) * 100 : 0;
  const clamped = Math.max(-RANGE, Math.min(RANGE, pnlPercent));

  // Map [-RANGE, +RANGE] → [0°, 180°]
  const fillDeg = ((clamped + RANGE) / (RANGE * 2)) * 180;

  const fillColor = pnl > 0 ? '#059669' : pnl < 0 ? '#dc2626' : '#7c3aed';
  const sign = pnl > 0 ? '+' : '';

  const data = [
    { value: fillDeg },
    { value: 180 - fillDeg },
  ];

  return (
    <div className="tt-balance-gauge">
      <div className="tt-balance-gauge__wrap">
        <ResponsiveContainer width="100%" height={130}>
          <PieChart>
            <Pie
              data={data}
              startAngle={180}
              endAngle={0}
              cx="50%"
              cy="88%"
              innerRadius={58}
              outerRadius={78}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill={fillColor} />
              <Cell fill="#ede9fe" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="tt-balance-gauge__center">
          <span className="tt-balance-gauge__pct" style={{ color: fillColor }}>
            {sign}{pnlPercent.toFixed(1)}%
          </span>
          <span className="tt-balance-gauge__sublabel">P&amp;L</span>
        </div>
      </div>
      <div className="tt-balance-gauge__scale">
        <span>-{RANGE}%</span>
        <span>BE</span>
        <span>+{RANGE}%</span>
      </div>
    </div>
  );
}

export default BalanceGauge;
