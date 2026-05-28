import { useState, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { parseMT5Html } from '../../utils/mt5Parser';
import useTradingStore from '../../store/useTradingStore';

// Detecta duplicados contra las ops ya existentes en el store
// Criterio: mismo par + misma fecha + mismo resultado
function markDuplicates(parsed, existing) {
  const keys = new Set(
    existing.map((op) => `${op.pair}|${op.createdAt}|${op.result}`)
  );
  return parsed.map((t) => ({
    ...t,
    isDuplicate: keys.has(`${t.pair}|${t.createdAt}|${t.result}`),
  }));
}

const cellSx = { fontSize: '0.72rem', padding: '5px 8px', whiteSpace: 'nowrap' };

export default function MT5ImportModal({ open, onClose }) {
  const operations      = useTradingStore((s) => s.operations);
  const importOperations = useTradingStore((s) => s.importOperations);

  const fileInputRef = useRef(null);
  const [trades,   setTrades]   = useState([]);   // parsed + marked
  const [fileName, setFileName] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const newTrades = trades.filter((t) => !t.isDuplicate);

  // ── Leer y parsear el HTML ─────────────────────────────────────────────────
  function handleFile(file) {
    if (!file) return;
    setFileName(file.name);
    setError('');
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed  = parseMT5Html(e.target.result);
        if (!parsed.length) {
          setError('No se encontraron operaciones en el archivo. ¿Es un reporte de MT5?');
          setTrades([]);
        } else {
          setTrades(markDuplicates(parsed, operations));
        }
      } catch {
        setError('Error al leer el archivo. Verifica que sea un reporte HTML de MT5.');
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Error al leer el archivo.');
      setLoading(false);
    };
    reader.readAsText(file, 'UTF-16');
  }

  function handleDrop(e) {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }

  async function handleImport() {
    if (!newTrades.length) return;
    setSaving(true);
    try {
      // eslint-disable-next-line no-unused-vars
      const toSend = newTrades.map(({ mt5Id, isDuplicate, ...rest }) => rest);
      await importOperations(toSend);
      onClose();
    } catch {
      setError('Error al importar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (saving) return;
    setTrades([]);
    setFileName('');
    setError('');
    onClose();
  }

  const resultColor = (v) => (v > 0 ? '#059669' : v < 0 ? '#dc2626' : '#6b7280');

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableRestoreFocus
      slotProps={{ paper: { sx: { borderRadius: '14px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' } } }}
    >
      <DialogTitle sx={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e1b4b', borderBottom: '1px solid #ede9fe', pb: 1.5 }}>
        Importar desde MT5
      </DialogTitle>

      <DialogContent sx={{ pt: '20px !important' }}>
        {/* ── Drop zone ── */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed #ddd6fe',
            borderRadius: 10,
            padding: '28px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: '#faf8ff',
            marginBottom: 16,
            transition: 'border-color 0.15s',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <UploadFileRoundedIcon sx={{ fontSize: 36, color: '#c4b5fd', mb: 1 }} />
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#6d28d9', fontWeight: 600 }}>
            {fileName || 'Arrastra el reporte HTML de MT5 o haz clic para seleccionar'}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#9ca3af' }}>
            MT5 → Ver → Terminal → Historial → clic derecho → Guardar como Informe Detallado
          </p>
        </div>

        {/* ── Error ── */}
        {error && (
          <p style={{ color: '#dc2626', fontSize: '0.78rem', marginBottom: 12 }}>{error}</p>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <CircularProgress size={28} sx={{ color: '#7c3aed' }} />
          </div>
        )}

        {/* ── Resumen + tabla preview ── */}
        {!loading && trades.length > 0 && (
          <>
            {/* Resumen */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', background: '#ede9fe', color: '#6d28d9', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                {trades.length} encontradas
              </span>
              <span style={{ fontSize: '0.78rem', background: '#d1fae5', color: '#059669', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                {newTrades.length} nuevas
              </span>
              {trades.length - newTrades.length > 0 && (
                <span style={{ fontSize: '0.78rem', background: '#f3f4f6', color: '#6b7280', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                  {trades.length - newTrades.length} duplicadas (se omiten)
                </span>
              )}
            </div>

            {/* Tabla preview */}
            <div style={{ overflowX: 'auto', maxHeight: 320, overflowY: 'auto', borderRadius: 8, border: '1px solid #ede9fe' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr style={{ background: '#f5f3ff', position: 'sticky', top: 0 }}>
                    {['Fecha', 'Par', 'Tipo', 'Precio', 'SL', 'TP', 'Resultado', ''].map((h) => (
                      <th key={h} style={{ ...cellSx, fontWeight: 700, color: '#7c3aed', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t, i) => (
                    <tr
                      key={`${t.mt5Id}-${i}`}
                      style={{
                        background: t.isDuplicate ? '#f9f9f9' : i % 2 === 0 ? '#fff' : '#faf8ff',
                        opacity: t.isDuplicate ? 0.45 : 1,
                      }}
                    >
                      <td style={cellSx}>{t.createdAt}</td>
                      <td style={{ ...cellSx, fontWeight: 700, color: '#6d28d9' }}>{t.pair}</td>
                      <td style={cellSx}>{t.orderType}</td>
                      <td style={{ ...cellSx, fontFamily: 'monospace' }}>{t.entryPoint}</td>
                      <td style={{ ...cellSx, fontFamily: 'monospace' }}>{t.stopLoss || '—'}</td>
                      <td style={{ ...cellSx, fontFamily: 'monospace' }}>{t.takeProfit || '—'}</td>
                      <td style={{ ...cellSx, fontWeight: 700, color: resultColor(t.result), fontFamily: 'monospace' }}>
                        {t.result >= 0 ? `+$${t.result.toFixed(2)}` : `-$${Math.abs(t.result).toFixed(2)}`}
                      </td>
                      <td style={{ ...cellSx, fontSize: '0.65rem', color: '#9ca3af' }}>
                        {t.isDuplicate ? 'duplicada' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1, borderTop: '1px solid #ede9fe' }}>
        <button className="tt-btn-ghost" onClick={handleClose} disabled={saving}>
          <CloseRoundedIcon sx={{ fontSize: 15 }} />
          Cancelar
        </button>
        <button
          className="tt-btn-primary"
          onClick={handleImport}
          disabled={saving || !newTrades.length}
        >
          {saving
            ? <CircularProgress size={14} thickness={5} sx={{ color: 'inherit' }} />
            : <SaveRoundedIcon sx={{ fontSize: 15 }} />
          }
          {saving ? 'Importando…' : `Importar ${newTrades.length} operaciones`}
        </button>
      </DialogActions>
    </Dialog>
  );
}
