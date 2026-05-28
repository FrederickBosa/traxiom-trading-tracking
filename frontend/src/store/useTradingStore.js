import { create } from 'zustand';
import * as api from '../services/api.js';

// Ordena: openTime (ISO datetime) si existe, si no createdAt (fecha) → id desc (desempate)
// openTime viene del campo open_time de Supabase y tiene precisión de segundos,
// lo que permite ordenar correctamente varias ops del mismo día importadas desde MT5.
const sortDesc = (ops) =>
  [...ops].sort((a, b) => {
    const aKey = a.openTime || a.createdAt || '';
    const bKey = b.openTime || b.createdAt || '';
    const d = bKey.localeCompare(aKey);
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

  importOperations: async (trades) => {
    try {
      const imported = await api.importTrades(trades);
      set((state) => ({
        operations: sortDesc([
          ...imported.map((t) => ({ ...t, isEditing: false })),
          ...state.operations,
        ]),
      }));
      return imported.length;
    } catch (err) {
      set({ error: err.message });
      throw err;
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
    // El balance real incluye resultado + swap de cada operación
    return operations.reduce((acc, op) => acc + (op.result || 0) + (op.swap || 0), 0);
  },

  getEquityCurve: () => {
    const { operations } = get();
    const deposits     = operations.filter((op) => op.orderType === 'Depósito');
    const depositTotal = deposits.reduce((acc, op) => acc + (op.result || 0), 0);
    // Orden cronológico (el store guarda DESC) + swap incluido
    const trades = [...operations.filter((op) => op.orderType !== 'Depósito')].reverse();
    let running = depositTotal;
    const curve = [{ trade: 0, balance: depositTotal }];
    trades.forEach((op, i) => {
      running += (op.result || 0) + (op.swap || 0);
      curve.push({ trade: i + 1, balance: parseFloat(running.toFixed(2)) });
    });
    return curve;
  },

  // ─── Estadísticas completas (estilo myfxbook) ─────────────────────────────
  getStats: () => {
    const { operations } = get();
    const deposits = operations.filter((op) => op.orderType === 'Depósito');
    // Cronológico para drawdown y racha
    const trades   = [...operations.filter((op) => op.orderType !== 'Depósito')].reverse();
    if (!trades.length) return null;

    const depositTotal = deposits.reduce((s, op) => s + (op.result || 0), 0);
    const netResults   = trades.map((op) => (op.result || 0) + (op.swap || 0));

    const winners = netResults.filter((r) => r > 0);
    const losers  = netResults.filter((r) => r < 0);

    const grossProfit  = winners.reduce((s, r) => s + r, 0);
    const grossLoss    = losers.reduce((s, r) => s + r, 0);
    const netProfit    = grossProfit + grossLoss;
    const winRate      = (winners.length / trades.length) * 100;
    const profitFactor = grossLoss !== 0 ? grossProfit / Math.abs(grossLoss) : null;
    const expectedPayoff = netProfit / trades.length;
    const avgWin   = winners.length ? grossProfit / winners.length : 0;
    const avgLoss  = losers.length  ? grossLoss   / losers.length  : 0;
    const bestTrade  = winners.length ? Math.max(...winners) : 0;
    const worstTrade = losers.length  ? Math.min(...losers)  : 0;

    // Drawdown: mayor caída desde un máximo de balance
    let running = depositTotal, peak = depositTotal, maxDD = 0, maxDDPct = 0;
    for (const r of netResults) {
      running += r;
      if (running > peak) peak = running;
      const dd = peak - running;
      if (dd > maxDD) { maxDD = dd; maxDDPct = peak > 0 ? (dd / peak) * 100 : 0; }
    }

    // Long / Short breakdown
    const isLong  = (op) => (op.orderType || '').toLowerCase().includes('buy');
    const isShort = (op) => (op.orderType || '').toLowerCase().includes('sell');
    const longsRes  = [];
    const shortsRes = [];
    trades.forEach((op, i) => {
      if (isLong(op))  longsRes.push(netResults[i]);
      if (isShort(op)) shortsRes.push(netResults[i]);
    });

    // Racha máxima consecutiva
    let maxConsecW = 0, maxConsecL = 0, curW = 0, curL = 0;
    for (const r of netResults) {
      if (r > 0)      { curW++; curL = 0; if (curW > maxConsecW) maxConsecW = curW; }
      else if (r < 0) { curL++; curW = 0; if (curL > maxConsecL) maxConsecL = curL; }
      else            { curW = 0; curL = 0; }
    }

    return {
      totalTrades:    trades.length,
      winners:        winners.length,
      losers:         losers.length,
      netProfit,
      grossProfit,
      grossLoss,
      winRate,
      profitFactor,
      expectedPayoff,
      avgWin,
      avgLoss,
      bestTrade,
      worstTrade,
      maxDD,
      maxDDPct,
      longs:          longsRes.length,
      shorts:         shortsRes.length,
      longWinRate:    longsRes.length  ? (longsRes.filter((r) => r > 0).length  / longsRes.length)  * 100 : 0,
      shortWinRate:   shortsRes.length ? (shortsRes.filter((r) => r > 0).length / shortsRes.length) * 100 : 0,
      maxConsecWins:   maxConsecW,
      maxConsecLosses: maxConsecL,
    };
  },
}));

export default useTradingStore;
