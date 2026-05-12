import { create } from 'zustand';
import * as api from '../services/api.js';

// Ordena: fecha desc → id desc (desempate entre ops del mismo día)
const sortDesc = (ops) =>
  [...ops].sort((a, b) => {
    const d = (b.createdAt || '').localeCompare(a.createdAt || '');
    return d !== 0 ? d : (b.id || '').localeCompare(a.id || '');
  });

const useTradingStore = create((set, get) => ({
  initialBalance: 0,
  operations: [],
  loading: true,  // true desde el inicio → espera el primer fetch real
  error: null,

  fetchTrades: async () => {
    set({ loading: true, error: null });
    try {
      const trades = await api.getTrades();
      set({ operations: trades });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  // Crea una operación con los datos completos del modal (no abre edición inline)
  createOperation: async (data) => {
    try {
      const created = await api.createTrade(data);
      set((state) => ({
        operations: sortDesc([{ ...created, isEditing: false }, ...state.operations]),
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  updateOperation: async (id, data) => {
    set((state) => ({
      operations: sortDesc(
        state.operations.map((op) => (op.id === id ? { ...op, ...data } : op))
      ),
    }));

    const { isEditing, ...payload } = data;
    if (isEditing !== undefined && Object.keys(payload).length === 0) return;

    try {
      const current = get().operations.find((op) => op.id === id);
      if (!current) return;
      const merged = { ...current, ...data };
      const { isEditing: _ie, ...toSend } = merged;
      await api.updateTrade(id, toSend);
    } catch (err) {
      set({ error: err.message });
    }
  },

  deleteOperation: async (id) => {
    set((state) => ({
      operations: state.operations.filter((op) => op.id !== id),
    }));
    try {
      await api.deleteTrade(id);
    } catch (err) {
      set({ error: err.message });
      await get().fetchTrades();
    }
  },

  getCurrentBalance: () => {
    const { operations } = get();
    return operations.reduce((acc, op) => acc + (op.result || 0), 0);
  },

  getEquityCurve: () => {
    const { operations } = get();
    const deposits = operations.filter((op) => op.orderType === 'Depósito');
    const depositTotal = deposits.reduce((acc, op) => acc + (op.result || 0), 0);
    let running = depositTotal;
    const curve = [{ trade: 0, balance: depositTotal }];
    const trades = operations.filter((op) => op.orderType !== 'Depósito');
    trades.forEach((op, i) => {
      running += op.result || 0;
      curve.push({ trade: i + 1, balance: parseFloat(running.toFixed(2)) });
    });
    return curve;
  },
}));

export default useTradingStore;
