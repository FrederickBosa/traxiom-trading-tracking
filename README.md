# Traxiom — Trading Tracking

Aplicación personal para registrar y analizar operaciones de Forex/CFD.  
Stack: **React 19 + Vite** (frontend) · **Express.js** (backend) · **Supabase** (base de datos + autenticación).

---

## Estructura del monorepo

```
traxiom-trading-tracking/
├── frontend/       → React 19 + Vite + MUI + Recharts
├── backend/        → Express.js + Supabase (service role)
├── .env.example    → plantilla de variables de entorno
└── package.json    → npm workspaces + script "dev"
```

---

## Requisitos previos

| Herramienta | Versión mínima |
|-------------|---------------|
| Node.js     | 18.x          |
| npm         | 9.x           |
| Cuenta Supabase | gratuita  |

---

## Configuración inicial

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd traxiom-trading-tracking
npm install
```

### 2. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor** ejecuta el script de tablas y políticas RLS (ver sección SQL más abajo).
3. En **Authentication → Providers** activa **Email** (y opcionalmente Google OAuth).
4. Copia la **URL**, **anon key** y **service_role key** del proyecto.

### 3. Variables de entorno

Copia la plantilla y rellena los valores reales:

```bash
cp .env.example frontend/.env
cp .env.example backend/.env
```

> ⚠️ Nunca subas los archivos `.env` al repositorio. El `.gitignore` ya los excluye.

```
# frontend/.env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://<proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# backend/.env
PORT=3001
SUPABASE_URL=https://<proyecto>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   ← solo en el backend, jamás en el frontend
FRONTEND_URL=http://localhost:5175
```

---

## Desarrollo local

```bash
# Levanta frontend (puerto 5175) y backend (puerto 3001) en paralelo
npm run dev

# Solo frontend
npm run dev:frontend

# Solo backend
npm run dev:backend
```

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Levanta ambos servidores en paralelo |
| `npm run dev:frontend` | Solo Vite dev server |
| `npm run dev:backend` | Solo Express con nodemon |
| `npm run build` | Build de producción del frontend |

---

## Despliegue

| Capa | Plataforma recomendada |
|------|----------------------|
| Frontend | Netlify / Vercel — directorio `frontend`, build `npm run build` |
| Backend | Railway / Render / Fly.io — directorio `backend`, start `npm start` |
| Base de datos | Supabase (ya incluido) |

> Recuerda añadir las variables de entorno en el panel de cada plataforma.

---

## Tecnologías principales

- **React 19** con React Compiler (memoización automática)
- **MUI v9** (componentes UI)
- **Recharts** (gráficas de equity y estadísticas)
- **Zustand** (estado global del cliente)
- **Yup** (validación de formularios)
- **Driver.js** (tour de bienvenida)
- **Supabase** (PostgreSQL + Auth + Row Level Security)
- **Express 5** + **Helmet** + **CORS**
- **SCSS** con arquitectura ITCSS y nomenclatura BEM (`tt-`)

---

## SQL — Schema de Supabase

```sql
-- TABLAS
CREATE TABLE trades (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pair          TEXT NOT NULL DEFAULT '',
  risk          NUMERIC(10,2) NOT NULL DEFAULT 1,
  entry_point   NUMERIC(10,5) NOT NULL DEFAULT 0,
  take_profit   NUMERIC(10,5) NOT NULL DEFAULT 0,
  stop_loss     NUMERIC(10,5) NOT NULL DEFAULT 0,
  order_type    TEXT NOT NULL DEFAULT 'Market',
  signal_source TEXT NOT NULL DEFAULT 'M71',
  result        NUMERIC(10,2) NOT NULL DEFAULT 0,
  observations  TEXT DEFAULT '',
  created_at    DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_settings (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  initial_balance NUMERIC(12,2) NOT NULL DEFAULT 476,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trades_user_id   ON trades(user_id);
CREATE INDEX idx_trades_created_at ON trades(created_at);

-- ROW LEVEL SECURITY
ALTER TABLE trades        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trades_select_own" ON trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "trades_insert_own" ON trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trades_update_own" ON trades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "trades_delete_own" ON trades FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "settings_select_own" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "settings_upsert_own" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "settings_update_own" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
```
