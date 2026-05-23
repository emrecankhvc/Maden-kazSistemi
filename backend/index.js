require('dotenv').config();
const express = require('express');
const app = express();

const sensorRouter = require('./src/routes/sensor');
const { initWebSocket, broadcast } = require('./src/websocket/wsHandler');

app.use(express.json());

// Route'ları bağla
app.use('/api', sensorRouter);

// Sunucuyu başlat
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend ${PORT} portunda çalışıyor!`);
});

// WebSocket'i başlat
initWebSocket(server);

// broadcast'i dışarı ver (route'lar kullanacak)
module.exports = { broadcast };