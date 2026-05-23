const pool = require('../config/database');

const saveSensorData = async (metan, oksijen) => {
  
  // Veri doğrulama
  if (metan === undefined || oksijen === undefined) {
    throw new Error('Metan ve oksijen değerleri zorunlu!');
  }

  if (metan < 0 || metan > 10000) {
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

module.exports = { saveSensorData, getRecentLogs };