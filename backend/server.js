require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { applySchema } = require('./db/client');
const authRoutes = require('./routes/auth');
const reservationsRoutes = require('./routes/reservations');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Sicurezza di base -----------------------------------------------------
app.use(helmet());

// --- CORS: limitato ai domini del frontend (separati da virgola in .env) ---
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // consente richieste senza origin (es. curl/healthcheck) e quelle in lista
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origine non consentita dal CORS.'));
  },
}));

app.use(express.json({ limit: '20kb' }));

// --- Routes ------------------------------------------------------------
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'giulivo-backend' }));
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationsRoutes);

// --- 404 ------------------------------------------------------------------
app.use((req, res) => res.status(404).json({ message: 'Risorsa non trovata.' }));

// --- Error handler generico -------------------------------------------
app.use((err, req, res, next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ message: 'Errore interno del server.' });
});

async function start() {
  try {
    await applySchema();
    console.log('[db] schema applicato correttamente.');
  } catch (err) {
    console.error('[db] errore applicando lo schema:', err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Giulivo backend in ascolto sulla porta ${PORT}`);
  });
}

start();
