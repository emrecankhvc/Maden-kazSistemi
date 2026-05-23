const express = require('express');
const router = express.Router();
const apiKeyAuth = require('../middleware/auth');
const { saveSensorData } = require('../services/sensorService');

router.post('/data', apiKeyAuth, async (req, res) => {
  const { metan, oksijen } = req.body;

  try {
    const { kayit, durum } = await saveSensorData(metan, oksijen);
    
    // Dashboard'a canlı gönder
    const { broadcast } = require('../../index');
    broadcast({ type: 'LIVE', metan: kayit.metan, oksijen: kayit.oksijen, durum, zaman: kayit.zaman });

    res.status(201).json({ mesaj: 'Veri kaydedildi', durum, kayit });
  } catch (err) {
    console.error('Kayıt hatası:', err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;