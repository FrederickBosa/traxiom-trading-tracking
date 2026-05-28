import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import useTradingStore from '../../store/useTradingStore';

function TradeRow({ trade, onEdit }) {
  const deleteOperation = useTradingStore((s) => s.deleteOperation);

  const resultClass   = trade.result > 0 ? 'profit' : trade.result < 0 ? 'loss' : 'open';
  const resultDisplay = trade.result > 0
    ? `+$${trade.result}`
    : trade.result < 0
      ? `-$${Math.abs(trade.result)}`
      : 'Open';
  const isDeposit = trade.orderType === 'Depósito' || trade.orderType === 'Crédito';

  // ── Fila de depósito ─────────────────────────────────────────────────────
  if (isDeposit) {
    return (
      <tr className="tt-trade-row tt-trade-row--deposit">
        <td className="tt-trade-row__cell" colSpan={7}>
          <span className="tt-trade-row__deposit-label">{trade.orderType}</span>
        </td>
        <td className="tt-trade-row__cell">
          <span className="tt-trade-row__result-badge tt-trade-row__result-badge--deposit">
            +${(trade.result || 0).toFixed(2)}
          </span>
        </td>
        <td className="tt-trade-row__cell tt-trade-row__cell--full">
          <div className="tt-trade-row__obs">{trade.observations || '—'}</div>
        </td>
        <td className="tt-trade-row__cell tt-trade-row__cell--actions">
          <button className="tt-btn-icon" onClick={() => onEdit(trade)} title="Editar" aria-label="Editar">
            <EditRoundedIcon sx={{ fontSize: 16 }} />
          </button>
          <button className="tt-btn-icon tt-btn-icon--danger" onClick={() => deleteOperation(trade.id)} title="Eliminar" aria-label="Eliminar">
            <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
          </button>
        </td>
      </tr>
    );
  }

  // ── Fila de trade ─────────────────────────────────────────────────────────
  return (
    <tr className="tt-trade-row">
      <td className="tt-trade-row__cell">{trade.orderType}</td>
      <td className="tt-trade-row__cell">
        <span className="tt-trade-row__pair-badge">{trade.pair || '—'}</span>
      </td>
      <td className="tt-trade-row__cell tt-trade-row__cell--mono">{Number(trade.risk).toFixed(2)}</td>
      <td className="tt-trade-row__cell tt-trade-row__cell--mono">{trade.entryPoint}</td>
      <td className="tt-trade-row__cell tt-trade-row__cell--mono">{trade.takeProfit}</td>
      <td className="tt-trade-row__cell tt-trade-row__cell--mono">{trade.stopLoss}</td>
      <td className="tt-trade-row__cell">{trade.signalSource}</td>
      <td className="tt-trade-row__cell">
        <span className={`tt-trade-row__result-badge tt-trade-row__result-badge--${resultClass}`}>
          {resultDisplay}
        </span>
      </td>
      <td className="tt-trade-row__cell tt-trade-row__cell--full">
          <div className="tt-trade-row__obs">{trade.observations || '—'}</div>
        </td>
      <td className="tt-trade-row__cell tt-trade-row__cell--actions">
        <button className="tt-btn-icon" onClick={() => onEdit(trade)} title="Editar" aria-label="Editar">
          <EditRoundedIcon sx={{ fontSize: 16 }} />
        </button>
        <button className="tt-btn-icon tt-btn-icon--danger" onClick={() => deleteOperation(trade.id)} title="Eliminar" aria-label="Eliminar">
          <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
        </button>
      </td>
    </tr>
  );
}

export default TradeRow;
