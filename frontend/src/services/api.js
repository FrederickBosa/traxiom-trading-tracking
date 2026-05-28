import { supabase } from './supabase.js';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Fecha local del navegador en formato YYYY-MM-DD (sin conversión UTC)
const localDateHeader = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
};

async function authFetch(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Date': localDateHeader(),   // fecha local del cliente → el backend la usa como fallback
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Error en la petición');
  }

  if (res.status === 204) return null;
  return res.json();
}

export const getTrades = () => authFetch('/trades');

export const createTrade = (trade) =>
  authFetch('/trades', { method: 'POST', body: JSON.stringify(trade) });

export const updateTrade = (id, trade) =>
  authFetch(`/trades/${id}`, { method: 'PATCH', body: JSON.stringify(trade) });

export const deleteTrade = (id) =>
  authFetch(`/trades/${id}`, { method: 'DELETE' });

export const importTrades = (trades) =>
  authFetch('/trades/import', { method: 'POST', body: JSON.stringify(trades) });
