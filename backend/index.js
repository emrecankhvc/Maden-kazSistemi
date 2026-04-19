const { Pool } = require('pg');
const WebSocket = require('ws');
const express = require('express'); // HTTP için ekledik
const app = express();

app.use(express.json()); // Gelen JSON verilerini okumak için

// 1. PostgreSQL Bağlantısı
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '1556',
  port: 5432,
});

// 2. Tablo Kurulumu
const setupDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS maden_loglari (
        id SERIAL PRIMARY KEY,
        metan DECIMAL,
        oksijen DECIMAL,
        zaman TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ PostgreSQL Tablosu Hazır!");
  } catch (err) {
    console.error("❌ Veritabanı hatası:", err);
  }
};
setupDb();

// 3. HTTP ENDPOINT (ESP32/Wokwi Buraya Veri Gönderecek)
app.post('/api/data', async (req, res) => {
  const { metan, oksijen } = req.body;
  console.log(`📡 ESP'den Veri Geldi -> Metan: ${metan}, Oksijen: ${oksijen}`);

  try {
    await pool.query("INSERT INTO maden_loglari (metan, oksijen) VALUES ($1, $2)", [metan, oksijen]);
    
    // Veriyi Dashboard'a (WebSocket) yönlendir
    broadcast({ type: 'LIVE', metan, oksijen });
    
    res.status(201).send("Veri kaydedildi");
  } catch (err) {
    console.error("Kayıt Hatası:", err);
    res.status(500).send("Hata oluştu");
  }
});

// 4. WebSocket (Dashboard İçin)
const wss = new WebSocket.Server({ noServer: true });

function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

wss.on('connection', async (ws) => {
  console.log('🚀 Dashboard bağlandı.');
  try {
    const res = await pool.query("SELECT * FROM maden_loglari ORDER BY id DESC LIMIT 20");
    ws.send(JSON.stringify({ type: 'HISTORY', data: res.rows.reverse() }));
  } catch (err) {
    console.log("Geçmiş veri hatası:", err);
  }
});

// 5. Sunucuyu Başlat (0.0.0.0 Dış Bağlantılar İçin Şart!)
const server = app.listen(5000, '0.0.0.0', () => {
  console.log('🚀 Backend 5000 portunda HER ŞEYE hazır!');
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});