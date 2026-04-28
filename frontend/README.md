# Trading Journal — Frontend

Aplicación React 19 + Vite que consume la API REST del backend.

## Stack

| Librería | Uso |
|----------|-----|
| React 19 + React Compiler | UI + memoización automática |
| Vite 8 | Bundler y dev server |
| MUI v9 | Componentes (Dialog, Autocomplete, etc.) |
| Recharts | Gráficas (equity, donut, radar) |
| Zustand 5 | Estado global (operaciones + loading) |
| Yup | Validación del formulario de trade |
| Driver.js | Tour de bienvenida |
| Supabase JS | Auth (login / OAuth / onAuthStateChange) |
| SCSS (ITCSS + BEM) | Estilos con prefijo `tt-` |

## Estructura `src/`

```
src/
├── components/
│   ├── sections/        → Dashboard.jsx, Login.jsx, TradingPlan.jsx
│   └── ui/              → Header, Sidebar, TradesTable, TradeFormModal, ...
├── constants/           → forexPairs.js
├── hooks/               → useAuth.js
├── scss/                → ITCSS: settings, tools, generic, objects, components
├── services/
│   ├── api.js           → fetch wrapper con JWT automático
│   └── supabase.js      → cliente Supabase + helpers de auth
├── store/
│   └── useTradingStore.js → Zustand: fetchTrades, createOperation, ...
├── App.jsx              → guard de autenticación
└── main.jsx             → punto de entrada
```

## Variables de entorno

Crea `apps/frontend/.env` con:

```
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://<proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## Comandos

```bash
npm run dev       # dev server en http://localhost:5175
npm run build     # build de producción → dist/
npm run lint      # ESLint
npm run preview   # previsualiza el build
```

## Despliegue en Netlify

1. Conecta el repositorio en Netlify.
2. **Base directory**: `apps/frontend`
3. **Build command**: `npm run build`
4. **Publish directory**: `apps/frontend/dist`
5. Añade las tres variables `VITE_*` en *Site settings → Environment variables*.
