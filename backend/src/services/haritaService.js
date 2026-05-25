const pool = require('../config/database');
const madenHaritasiOlustur = require('../config/madenHaritasi');
const DxfParser = require('dxf-parser');
const fs = require('fs');
const path = require('path');

// Tabloyu oluştur
const setupHaritaDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS harita_elemanlar (
      id SERIAL PRIMARY KEY,
      tip VARCHAR(50),
      katman VARCHAR(50),
      x1 DECIMAL, y1 DECIMAL,
      x2 DECIMAL, y2 DECIMAL,
      radius DECIMAL,
      etiket VARCHAR(100)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sensor_konumlar (
      id SERIAL PRIMARY KEY,
      sensor_id INTEGER UNIQUE,
      konum_adi VARCHAR(100),
      x DECIMAL,
      y DECIMAL
    )
  `);

  console.log('✅ Harita tabloları hazır!');
};

// DXF oluştur, oku, veritabanına yaz
const haritayiYukle = async () => {
  // Önce tabloları temizle
  await pool.query('DELETE FROM harita_elemanlar');
  await pool.query('DELETE FROM sensor_konumlar');

  // DXF oluştur ve dosyaya yaz
  const dxfString = madenHaritasiOlustur();
  const dxfPath = path.join(__dirname, '../../maden.dxf');
  fs.writeFileSync(dxfPath, dxfString);
  console.log('✅ DXF dosyası oluşturuldu!');

  // DXF'i oku
  const parser = new DxfParser();
  const dxf = parser.parseSync(dxfString);

  // Elemanları veritabanına yaz
  for (const entity of dxf.entities) {
    if (entity.type === 'LINE') {
      await pool.query(
        'INSERT INTO harita_elemanlar (tip, katman, x1, y1, x2, y2) VALUES ($1, $2, $3, $4, $5, $6)',
        ['LINE', entity.layer, entity.vertices[0].x, entity.vertices[0].y, entity.vertices[1].x, entity.vertices[1].y]
      );
    } else if (entity.type === 'CIRCLE') {
      await pool.query(
        'INSERT INTO harita_elemanlar (tip, katman, x1, y1, radius) VALUES ($1, $2, $3, $4, $5)',
        ['CIRCLE', entity.layer, entity.center.x, entity.center.y, entity.radius]
      );
    }
  }

  // Sensör konumlarını yaz
  const sensorKonumlar = [
    { sensor_id: 1, konum_adi: 'Galeri 1 Sonu', x: 290, y: 100 },
    { sensor_id: 2, konum_adi: 'Galeri 2 Sonu', x: 390, y: 0 },
    { sensor_id: 3, konum_adi: 'Galeri 3 Sonu', x: 290, y: -100 },
    { sensor_id: 4, konum_adi: 'Ana Giriş',     x: 0,   y: 0 },
  ];

  for (const sk of sensorKonumlar) {
    await pool.query(
      'INSERT INTO sensor_konumlar (sensor_id, konum_adi, x, y) VALUES ($1, $2, $3, $4)',
      [sk.sensor_id, sk.konum_adi, sk.x, sk.y]
    );
  }

  console.log('✅ Harita veritabanına yüklendi!');
};

const getHaritaVerisi = async () => {
  const elemanlar = await pool.query('SELECT * FROM harita_elemanlar');
  const sensorler = await pool.query('SELECT * FROM sensor_konumlar');
  return {
    elemanlar: elemanlar.rows,
    sensorler: sensorler.rows
  };
};

module.exports = { setupHaritaDb, haritayiYukle, getHaritaVerisi };