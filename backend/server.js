import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import router from './src/routes/index.js';
import errorHandler from './src/middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5175',
  credentials: true,
}));
app.use(express.json());

app.use('/api', router);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
