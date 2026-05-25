const pool = require('../config/database');

const saveSensorData = async (metan, oksijen) => {
  
  // Veri doğrulama
  if (metan === undefined || oksijen === undefined) {
    throw new Error('Metan ve oksijen değerleri zorunlu!');
  }

  if (metan < 0 || metan > 50000) {
    throw new Error('Metan değeri geçersiz!');
  }

  // Tehlike seviyesi belirleme
  let durum;
  if (metan > 2000) {
    durum = 'TEHLİKE';
  } else if (metan > 1000) {
    durum = 'UYARI';
  } else {
    durum = 'NORMAL';
  }

  // Veritabanına kaydet
  const result = await pool.query(
    'INSERT INTO maden_loglari (metan, oksijen) VALUES ($1, $2) RETURNING *',
    [metan, oksijen]
  );

  return { kayit: result.rows[0], durum };
};

const getRecentLogs = async (limit = 20) => {
  const result = await pool.query(
    'SELECT * FROM maden_loglari ORDER BY id DESC LIMIT $1',
    [limit]
  );
  return result.rows.reverse();
};

const getSimulatedSensors = () => {
  return [
    { id: 2, konum: 'Galeri 2', metan: Math.floor(Math.random() * 400) + 200, oksijen: 21 },
    { id: 3, konum: 'Galeri 3', metan: Math.floor(Math.random() * 400) + 200, oksijen: 21 },
    { id: 4, konum: 'Ana Giris', metan: Math.floor(Math.random() * 300) + 150, oksijen: 21 },
  ]
}

module.exports = { saveSensorData, getRecentLogs, getSimulatedSensors }