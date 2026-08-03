const express = require('express');
const cors = require('cors');
const DataEngine = require('./data-engine');

const app = express();
app.use(cors());

const engine = new DataEngine(['NIFTY', 'BANKNIFTY', 'SENSEX', 'XAUUSD']);

app.get('/', (req, res) => res.json({ ok: true, service: 'algo-desk-backend' }));

app.get('/api/config', (req, res) => {
  res.json({
    assets: engine.assets,
    note: 'Simulated desk dashboard — synthetic data only, not connected to any real broker/exchange/firm feed.'
  });
});

// Poll this every few seconds from the PWA (same pattern as the rest of your terminals —
// no WebSocket/always-on connection needed, works fine on Render free tier).
app.get('/api/desk-data', (req, res) => {
  res.json({ success: true, generatedAt: new Date().toISOString(), data: engine.snapshot() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('Algo Desk backend running on port ' + PORT));
