require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());

const sensorRouter = require('./src/routes/sensor');
const haritaRouter = require('./src/routes/harita');
const { initWebSocket, broadcast } = require('./src/websocket/wsHandler');
const { setupHaritaDb, haritayiYukle } = require('./src/services/haritaService');

app.use(express.json());

// Route'ları bağla
app.use('/api', sensorRouter);
app.use('/api', haritaRouter);

// Sunucuyu başlat
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Backend ${PORT} portunda çalışıyor!`);
  
  // Harita veritabanını kur ve yükle
  await setupHaritaDb();
  await haritayiYukle();
});

// WebSocket'i başlat
initWebSocket(server);

module.exports = { broadcast };