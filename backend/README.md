# Trading Journal — Backend

API REST con Express.js que actúa como intermediario entre el frontend y Supabase.  
Usa la `service_role key` para operar con privilegios completos sobre la base de datos,
pero valida el JWT del usuario en cada petición.

## Stack

| Librería | Uso |
|----------|-----|
| Express 5 | Framework HTTP |
| @supabase/supabase-js | Queries a la DB + verificación de JWT |
| Helmet | Cabeceras de seguridad HTTP |
| CORS | Permite peticiones desde el frontend |
| dotenv | Variables de entorno |
| nodemon | Recarga automática en desarrollo |

## Estructura `src/`

```
src/
├── config/
│   └── supabase.js        → instancia con service_role_key
├── controllers/
│   ├── auth.controller.js → GET /api/auth/me
│   └── trades.controller.js → CRUD de operaciones
├── middleware/
│   ├── auth.js            → verifica JWT → adjunta req.user
│   └── errorHandler.js    → catch-all → responde JSON { error }
└── routes/
    ├── index.js            → monta /auth y /trades
    ├── auth.routes.js
    └── trades.routes.js
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/auth/me` | Devuelve el usuario autenticado |
| GET | `/api/trades` | Lista todas las operaciones del usuario |
| POST | `/api/trades` | Crea una nueva operación |
| PATCH | `/api/trades/:id` | Actualiza una operación existente |
| DELETE | `/api/trades/:id` | Elimina una operación |

Todos los endpoints de `/api/trades` requieren el header:
```
Authorization: Bearer <supabase-jwt>
```

## Variables de entorno

Crea `apps/backend/.env` con:

```
PORT=3001
SUPABASE_URL=https://<proyecto>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   ← NUNCA en el frontend ni en git
FRONTEND_URL=http://localhost:5175
```

## Comandos

```bash
npm run dev    # Express con nodemon (recarga automática)
npm start      # Producción
```

## Despliegue en Railway / Render

1. Conecta el repositorio.
2. **Root directory**: `apps/backend`
3. **Start command**: `npm start`
4. Añade las cuatro variables de entorno en el panel de la plataforma.
5. Actualiza `FRONTEND_URL` con la URL real de Netlify una vez desplegado el frontend.
