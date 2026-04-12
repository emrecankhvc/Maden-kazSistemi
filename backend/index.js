const { Pool } = require('pg');
const WebSocket = require('ws');

// 1. PostgreSQL Bağlantı Ayarları
const pool = new Pool({
  user: 'postgres',           // Varsayılan kullanıcı
  host: 'localhost',
  database: 'postgres',       // Varsayılan veritabanı
  password: '1556',   // KURULUMDA KOYDUĞUN ŞİFREYİ BURAYA YAZ!
  port: 5432,
});

// 2. Tabloyu Oluştur (SQL Standartı)
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
    console.error("❌ Veritabanı kurulum hatası:", err);
  }
};
setupDb();

const wss = new WebSocket.Server({ port: 5000 });

wss.on('connection', async (ws) => {
  console.log('🚀 Dashboard bağlandı.');

  // Sayfa açıldığında son 20 veriyi DB'den çekip gönder
  try {
    const res = await pool.query("SELECT * FROM maden_loglari ORDER BY id DESC LIMIT 20");
    ws.send(JSON.stringify({ type: 'HISTORY', data: res.rows.reverse() }));
  } catch (err) {
    console.log("Veri çekme hatası:", err);
  }

  ws.on('message', async (message) => {
    const dataStr = message.toString();
    const [m, o] = dataStr.split(',').map(Number);

    // Veritabanına Kaydet (Mühendislik Standartı)
    try {
      await pool.query("INSERT INTO maden_loglari (metan, oksijen) VALUES ($1, $2)", [m, o]);
      
      // Tüm frontend'lere canlı veriyi yay
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'LIVE', metan: m, oksijen: o }));
        }
      });
    } catch (err) {
      console.error("Kayıt Hatası:", err);
    }
  });
});

console.log('Backend 5000 portunda PostgreSQL ile yayında...');


const generateRandomData = (min,max) => {
  return parseFloat((Math.random() * (max-min) + min).toFixed(2));
}



const startSimulation = () => {
  console.log("Simülasyon başlatıldı...");

  setInterval(async () => {
    const randomMethane =  generateRandomData(100,550);
    const randomOxygen = generateRandomData(17,21);


    if (randomMethane >450)
    { console.log("⚠️ KRİTİK SEVİYE SİMÜLE EDİLİYOR!");   }




    try {
      await pool.query(
        "INSERT INTO maden_loglari (metan,oksijen) VALUES ($1, $2)",
        [randomMethane, randomOxygen]
      );

      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "LIVE",
            metan: randomMethane,
            oksijen: randomOxygen
          }));
        }
      });
    } catch (err) {
      console.error(err);
    }
  
}, 3000);
};

startSimulation(); 