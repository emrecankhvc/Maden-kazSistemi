const WebSocket = require('ws');
const { getRecentLogs } = require('../services/sensorService');

let wss;

const initWebSocket = (server) => {
  wss = new WebSocket.Server({ noServer: true });

  wss.on('connection', async (ws) => {
    console.log('🚀 Dashboard bağlandı.');

    try {
      const logs = await getRecentLogs(20);
      ws.send(JSON.stringify({ type: 'HISTORY', data: logs }));
    } catch (err) {
      console.error('Geçmiş veri hatası:', err.message);
    }

    ws.on('close', () => {
      console.log('Dashboard bağlantısı kesildi.');
    });
  });

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });
};

const broadcast = (data) => {
  if (!wss) return;
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

module.exports = { initWebSocket, broadcast };