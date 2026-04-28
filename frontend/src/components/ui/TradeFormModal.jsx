import { useState } from 'react';
import * as Yup from 'yup';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CircularProgress from '@mui/material/CircularProgress';
import useTradingStore from '../../store/useTradingStore';
import { FOREX_PAIRS } from '../../constants/forexPairs';

// ─── Constantes ───────────────────────────────────────────────────────────────

const BUY_TYPES  = ['Buy Market', 'Buy Limit', 'Buy Stop'];
const SELL_TYPES = ['Sell Market', 'Sell Limit', 'Sell Stop'];
const ORDER_TYPES    = [...BUY_TYPES, ...SELL_TYPES];
const SIGNAL_SOURCES = ['M71', 'Kymera', 'Análisis Propio'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const parseDecimal = (v) => {
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? '' : n;          // '' para que Yup lo detecte como vacío
};

const emptyTrade  = () => ({ pair: '', risk: '', entryPoint: '', takeProfit: '', stopLoss: '', orderType: 'Buy Market', signalSource: 'M71', result: '',  observations: '', createdAt: today() });
const emptyDeposit = () => ({ pair: 'Depósito', risk: 0, entryPoint: 0, takeProfit: 0, stopLoss: 0, orderType: 'Depósito', signalSource: 'M71', result: '', observations: '', createdAt: today() });

// ─── Esquema Yup (solo para trades, no para depósitos) ────────────────────────

const tradeSchema = Yup.object({
  orderType: Yup.string()
    .required('Requerido')
    .oneOf(ORDER_TYPES, 'Tipo no válido'),

  pair: Yup.string()
    .required('Requerido')
    .test('in-list', 'Par no está en la lista', (v) => FOREX_PAIRS.includes(v ?? '')),

  risk: Yup.number()
    .typeError('Debe ser un número')
    .required('Requerido')
    .min(0.01, 'Mínimo 0.01'),

  entryPoint: Yup.number()
    .typeError('Debe ser un número')
    .required('Requerido')
    .positive('Debe ser > 0'),

  takeProfit: Yup.number()
    .typeError('Debe ser un número')
    .required('Requerido')
    .positive('Debe ser positivo')
    .test('tp-buy',  'En compras el TP debe ser mayor al precio',  function (val) {
      const { orderType, entryPoint } = this.parent;
      if (BUY_TYPES.includes(orderType))  return (val ?? 0) > (entryPoint ?? 0);
      return true;
    })
    .test('tp-sell', 'En ventas el TP debe ser menor al precio', function (val) {
      const { orderType, entryPoint } = this.parent;
      if (SELL_TYPES.includes(orderType)) return (val ?? 0) < (entryPoint ?? 0);
      return true;
    }),

  stopLoss: Yup.number()
    .typeError('Debe ser un número')
    .required('Requerido')
    .positive('Debe ser positivo')
    .test('sl-buy',  'En compras el SL debe ser menor al precio',  function (val) {
      const { orderType, entryPoint } = this.parent;
      if (BUY_TYPES.includes(orderType))  return (val ?? 0) < (entryPoint ?? 0);
      return true;
    })
    .test('sl-sell', 'En ventas el SL debe ser mayor al precio', function (val) {
      const { orderType, entryPoint } = this.parent;
      if (SELL_TYPES.includes(orderType)) return (val ?? 0) > (entryPoint ?? 0);
      return true;
    }),

  signalSource: Yup.string()
    .required('Requerido')
    .oneOf(SIGNAL_SOURCES, 'Señal no válida'),

  result: Yup.number()
    .typeError('Debe ser un número')
    .required('Requerido'),
});

const depositSchema = Yup.object({
  result: Yup.number()
    .typeError('Debe ser un número')
    .required('Requerido')
    .positive('Debe ser mayor a 0'),
});

// ─── Estilos sx compartidos ───────────────────────────────────────────────────

const fieldSx = {
  '& .MuiInputLabel-root':  { color: '#9ca3af', fontSize: '0.75rem' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#7c3aed' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ddd6fe' },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#c4b5fd' },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7c3aed', borderWidth: '1.5px' },
  '& .MuiOutlinedInput-input': { color: '#1e1b4b', fontSize: '0.8rem', padding: '7.5px 10px' },
  '& .MuiAutocomplete-input': { fontSize: '0.8rem', color: '#1e1b4b' },
  '& .MuiSvgIcon-root': { color: '#9ca3af', fontSize: '1rem' },
  '& .MuiFormHelperText-root': { fontSize: '0.68rem', marginTop: '2px' },
};

// ─── Sub-componentes de campo ─────────────────────────────────────────────────

function DecimalField({ value, onChange, label, error, helperText }) {
  return (
    <TextField
      type="text"
      inputMode="decimal"
      variant="outlined"
      size="small"
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
      error={error}
      helperText={helperText}
      sx={fieldSx}
    />
  );
}

// Select Autocomplete — {…params} limpio, sin readOnly ni slotProps.input.
// disableClearable + no freeSolo garantiza que solo se guarden opciones válidas.
function DropdownField({ value, onChange, options, label, error, helperText }) {
  return (
    <Autocomplete
      value={value}
      onChange={(_, v) => onChange(v)}
      options={options}
      disableClearable
      size="small"
      popupIcon={<KeyboardArrowDownRoundedIcon />}
      fullWidth
      sx={fieldSx}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          variant="outlined"
          size="small"
          error={error}
          helperText={helperText}
          sx={fieldSx}
        />
      )}
    />
  );
}

// ─── Modal principal ──────────────────────────────────────────────────────────

function TradeFormModal({ open, onClose, trade, isDeposit }) {
  const createOperation = useTradingStore((s) => s.createOperation);
  const updateOperation = useTradingStore((s) => s.updateOperation);

  const isEdit = Boolean(trade);

  // Lazy initializer: se ejecuta UNA sola vez al montar el componente.
  // El padre (TradesTable) cambia el `key` cada vez que abre el modal con
  // un contexto distinto → React remonta aquí con estado fresco sin useEffect.
  const [draft,  setDraft]  = useState(() =>
    trade ? { ...trade } : isDeposit ? emptyDeposit() : emptyTrade()
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field, val) => {
    setDraft((p) => ({ ...p, [field]: val }));
    // Limpia el error del campo al editar
    if (errors[field]) setErrors((e) => { const next = { ...e }; delete next[field]; return next; });
  };

  const handleSave = async () => {
    const schema = isDeposit ? depositSchema : tradeSchema;
    const data = {
      ...draft,
      risk:       parseDecimal(draft.risk),
      entryPoint: parseDecimal(draft.entryPoint),
      takeProfit: parseDecimal(draft.takeProfit),
      stopLoss:   parseDecimal(draft.stopLoss),
      result:     parseDecimal(draft.result),
    };

    try {
      await schema.validate(data, { abortEarly: false });
    } catch (err) {
      const fieldErrors = {};
      err.inner.forEach((e) => { fieldErrors[e.path] = e.message; });
      setErrors(fieldErrors);
      return;
    }

    // _isEditing: extraída solo para excluirla del payload → prefijo _ indica intencional
    const { isEditing: _isEditing, ...payload } = data;
    setSaving(true);
    try {
      if (isEdit) {
        await updateOperation(trade.id, payload);
      } else {
        await createOperation(payload);
      }
      // Quitar el foco antes de cerrar para evitar el conflicto
      // aria-hidden en #root vs focused element cuando el Dialog se desmonta
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const title = isEdit
    ? (isDeposit ? 'Editar Depósito'  : 'Editar Operación')
    : (isDeposit ? 'Nuevo Depósito'   : 'Nueva Operación');

  const e = errors; // alias corto

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      disableRestoreFocus
      slotProps={{ paper: { sx: { borderRadius: '14px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' } } }}
    >
      {/* ── Título ── */}
      <DialogTitle sx={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e1b4b', borderBottom: '1px solid #ede9fe', pb: 1.5 }}>
        {title}
      </DialogTitle>

      {/* ── Contenido ── */}
      <DialogContent>
        {isDeposit ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DecimalField
              label="Monto ($)"
              value={draft.result}
              onChange={(v) => set('result', v)}
              error={!!e.result}
              helperText={e.result}
            />
            <TextField
              variant="outlined" size="small" label="Observaciones" fullWidth multiline rows={2}
              value={draft.observations}
              onChange={(ev) => set('observations', ev.target.value)}
              sx={fieldSx}
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
            {/* Tipo Orden */}
            <DropdownField
              label="Tipo Orden"
              value={draft.orderType}
              onChange={(v) => set('orderType', v)}
              options={ORDER_TYPES}
              error={!!e.orderType}
              helperText={e.orderType}
            />

            {/* Par — freeSolo con lista FOREX_PAIRS */}
            <Autocomplete
              freeSolo
              disableClearable
              options={FOREX_PAIRS}
              inputValue={draft.pair || ''}
              onInputChange={(_, v) => set('pair', v.toUpperCase())}
              size="small"
              fullWidth
              sx={fieldSx}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Par"
                  variant="outlined"
                  size="small"
                  autoFocus
                  error={!!e.pair}
                  helperText={e.pair}
                  sx={fieldSx}
                />
              )}
            />

            {/* Riesgo */}
            <DecimalField label="Riesgo (%)"    value={draft.risk}       onChange={(v) => set('risk', v)}       error={!!e.risk}       helperText={e.risk} />

            {/* Precio (antes Entrada) */}
            <DecimalField label="Precio"         value={draft.entryPoint} onChange={(v) => set('entryPoint', v)} error={!!e.entryPoint} helperText={e.entryPoint} />

            {/* Take Profit */}
            <DecimalField label="Take Profit"    value={draft.takeProfit} onChange={(v) => set('takeProfit', v)} error={!!e.takeProfit} helperText={e.takeProfit} />

            {/* Stop Loss */}
            <DecimalField label="Stop Loss"      value={draft.stopLoss}   onChange={(v) => set('stopLoss', v)}   error={!!e.stopLoss}   helperText={e.stopLoss} />

            {/* Señal */}
            <DropdownField
              label="Señal"
              value={draft.signalSource}
              onChange={(v) => set('signalSource', v)}
              options={SIGNAL_SOURCES}
              error={!!e.signalSource}
              helperText={e.signalSource}
            />

            {/* Resultado */}
            <DecimalField label="Resultado ($)"  value={draft.result}     onChange={(v) => set('result', v)}     error={!!e.result}     helperText={e.result} />

            {/* Observaciones — ocupa ambas columnas */}
            <div style={{ gridColumn: '1 / -1' }}>
              <TextField
                variant="outlined" size="small" label="Observaciones" fullWidth multiline rows={2}
                value={draft.observations}
                onChange={(ev) => set('observations', ev.target.value)}
                sx={fieldSx}
              />
            </div>
          </div>
        )}
      </DialogContent>

      {/* ── Acciones ── */}
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1, borderTop: '1px solid #ede9fe' }}>
        <button className="tt-btn-ghost" onClick={onClose} disabled={saving}>
          <CloseRoundedIcon sx={{ fontSize: 15 }} />
          Cancelar
        </button>
        <button className="tt-btn-primary" onClick={handleSave} disabled={saving}>
          {saving
            ? <CircularProgress size={14} thickness={5} sx={{ color: 'inherit' }} />
            : <SaveRoundedIcon sx={{ fontSize: 15 }} />
          }
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </DialogActions>
    </Dialog>
  );
}

export default TradeFormModal;
