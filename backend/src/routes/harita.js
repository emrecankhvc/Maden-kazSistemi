const express = require('express');
const router = express.Router();
const { getHaritaVerisi } = require('../services/haritaService');

router.get('/harita', async (req, res) => {
  try {
    const veri = await getHaritaVerisi();
    res.json(veri);
  } catch (err) {
    console.error('Harita verisi hatası:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;