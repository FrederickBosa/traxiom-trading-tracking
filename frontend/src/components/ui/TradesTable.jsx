import { useEffect, useRef, useState } from 'react';
import Skeleton from '@mui/material/Skeleton';
import Pagination from '@mui/material/Pagination';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import TradeRow from './TradeRow';
import TradeFormModal from './TradeFormModal';
import useTradingStore from '../../store/useTradingStore';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const COLUMNS = [
  'Tipo Orden', 'Par', 'Riesgo', 'Precio',
  'Take Profit', 'Stop Loss', 'Señal', 'Resultado', 'Observaciones', 'Acciones',
];

const PAGE_SIZE = 10;

function TradesTable({ loading }) {
  const operations = useTradingStore((s) => s.operations);

  // initialLoadDone: se activa la primera vez que el fetch completa.
  // A partir de ahí ignoramos cambios en operations.length para no
  // lanzar el tour si el usuario borra trades durante la sesión.
  const initialLoadDone = useRef(false);
  const tourShown       = useRef(false); // evita doble disparo por re-renders

  // ── Estado del modal ───────────────────────────────────────────────────────
  const [modal, setModal] = useState({ open: false, trade: null, isDeposit: false });
  const [page,  setPage]  = useState(1);

  const openNew     = () => { setModal({ open: true, trade: null, isDeposit: false }); setPage(1); };
  const openDeposit = () => { setModal({ open: true, trade: null, isDeposit: true  }); setPage(1); };
  const openEdit    = (trade) => setModal({ open: true, trade, isDeposit: trade.orderType === 'Depósito' });
  const closeModal  = () => setModal((m) => ({ ...m, open: false }));

  // Páginas totales; si la página activa queda vacía tras un borrado, la corrige
  const totalPages = Math.max(1, Math.ceil(operations.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = operations.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const from = operations.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to   = Math.min(safePage * PAGE_SIZE, operations.length);

  // ── Tour: se evalúa UNA sola vez, cuando el primer fetch termina.
  // Si el usuario tiene trades → no tour.
  // Si no tiene → tour. Borrar trades durante la sesión no lo reactiva.
  useEffect(() => {
    if (loading) return;                   // fetch aún en curso
    if (initialLoadDone.current) return;   // ya hicimos la revisión inicial
    initialLoadDone.current = true;

    if (operations.length > 0) return;     // tiene trades, no necesita el tour
    if (tourShown.current) return;
    tourShown.current = true;

    const driverObj = driver({
      animate: true,
      overlayOpacity: 0.75,
      smoothScroll: true,
      showProgress: true,
      allowClose: false,
      showButtons: ['next', 'previous'],
      nextBtnText: 'Siguiente →',
      prevBtnText: '← Anterior',
      doneBtnText: '¡Empezar!',
      steps: [
        {
          element: '#tt-balance-block',
          popover: {
            title: '👋 ¡Bienvenido a Trading Tracker!',
            description: 'Aquí verás tu balance actual, el capital depositado y tu P&L en porcentaje.',
            side: 'bottom',
          },
        },
        {
          element: '#tt-deposit-btn',
          popover: {
            title: '💰 Paso 1 — Registra tu capital',
            description: 'Antes de anotar operaciones, registra cuánto dinero hay en tu cuenta con el botón "Depósito".',
            side: 'bottom',
          },
        },
        {
          element: '#tt-add-trade-btn',
          popover: {
            title: '📈 Paso 2 — Agrega tu primera operación',
            description: 'Una vez registrado el capital, haz clic aquí para anotar tus trades. ¡Ya estás listo!',
            side: 'bottom',
          },
        },
      ],
    });

    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      driverObj.drive();
    }, 600);
  }, [loading, operations.length]);

  return (
    <div className="tt-trades-table">
      {/* ── Toolbar ── */}
      <div className="tt-trades-table__toolbar">
        <h2 className="tt-trades-table__title">Operaciones</h2>
        <div className="tt-trades-table__actions">
          <button id="tt-deposit-btn" className="tt-btn-secondary" onClick={openDeposit}>
            <AccountBalanceWalletRoundedIcon sx={{ fontSize: 16 }} />
            Depósito
          </button>
          <button id="tt-add-trade-btn" className="tt-btn-primary" onClick={openNew}>
            <AddRoundedIcon sx={{ fontSize: 16 }} />
            Nueva Operación
          </button>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="tt-trades-table__scroll-wrapper">
        <table className="tt-trades-table__table">
          <thead>
            <tr className="tt-trades-table__header-row">
              {COLUMNS.map((col) => (
                <th key={col} scope="col" className="tt-trades-table__th">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {COLUMNS.map((col) => (
                    <td key={col} className="tt-trades-table__th">
                      <Skeleton variant="text" height={20} />
                    </td>
                  ))}
                </tr>
              ))
            ) : operations.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="tt-trades-table__empty">
                  Aún no hay operaciones. Empieza registrando un <strong>Depósito</strong> y luego agrega tu primera operación.
                </td>
              </tr>
            ) : (
              paginated.map((trade) => (
                <TradeRow key={trade.id} trade={trade} onEdit={openEdit} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Paginación ── */}
      {!loading && operations.length > PAGE_SIZE && (
        <div className="tt-trades-table__pagination">
          <span className="tt-trades-table__pagination-info">
            {from}–{to} de {operations.length} operaciones
          </span>
          <Pagination
            count={totalPages}
            page={safePage}
            onChange={(_, value) => setPage(value)}
            size="small"
            shape="rounded"
            sx={{
              '& .MuiPaginationItem-root': {
                fontSize: '0.75rem',
                color: '#6d28d9',
                borderColor: '#ddd6fe',
              },
              '& .MuiPaginationItem-root.Mui-selected': {
                backgroundColor: '#7c3aed',
                color: '#fff',
                '&:hover': { backgroundColor: '#6d28d9' },
              },
              '& .MuiPaginationItem-root:hover': {
                backgroundColor: '#ede9fe',
              },
            }}
          />
        </div>
      )}

      {/* ── Modal de formulario ──
           key cambia cada vez que el modal abre con un contexto distinto
           → React remonta el componente con estado fresco sin necesidad
             de useEffect que llame setState (warning del React Compiler) ── */}
      <TradeFormModal
        key={modal.open ? `${modal.trade?.id ?? 'new'}-${modal.isDeposit}` : 'closed'}
        open={modal.open}
        onClose={closeModal}
        trade={modal.trade}
        isDeposit={modal.isDeposit}
      />
    </div>
  );
}

export default TradesTable;
