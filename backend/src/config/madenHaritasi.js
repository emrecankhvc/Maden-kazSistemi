const DxfWriter = require('dxf-writer');

const madenHaritasiOlustur = () => {
  const d = new DxfWriter();

  // Katmanlar
  d.addLayer('tünel', DxfWriter.ACI.WHITE, 'CONTINUOUS');
  d.addLayer('galeri', DxfWriter.ACI.CYAN, 'CONTINUOUS');
  d.addLayer('sensör', DxfWriter.ACI.RED, 'CONTINUOUS');
  d.addLayer('etiket', DxfWriter.ACI.YELLOW, 'CONTINUOUS');

  d.setActiveLayer('tünel');

  // Ana tünel (yatay, soldan sağa)
  d.drawLine(0, 0, 200, 0);

  d.setActiveLayer('galeri');

  // Galeri 1 (yukarı)
  d.drawLine(80, 0, 80, 100);
  d.drawLine(80, 100, 300, 100);

  // Galeri 2 (düz devam)
  d.drawLine(200, 0, 400, 0);

  // Galeri 3 (aşağı)
  d.drawLine(80, 0, 80, -100);
  d.drawLine(80, -100, 300, -100);

  d.setActiveLayer('sensör');

  // Sensör konumları (daire)
  d.drawCircle(290, 100, 5);   // Sensör 1 - Galeri 1 sonu
  d.drawCircle(390, 0, 5);     // Sensör 2 - Galeri 2 sonu
  d.drawCircle(290, -100, 5);  // Sensör 3 - Galeri 3 sonu
  d.drawCircle(0, 0, 5);       // Sensör 4 - Ana giriş

  d.setActiveLayer('etiket');

  // Etiketler
  d.drawText(140, 110, 5, 0, 'GALERİ 1');
  d.drawText(280, 10, 5, 0, 'GALERİ 2');
  d.drawText(140, -115, 5, 0, 'GALERİ 3');
  d.drawText(-30, 10, 5, 0, 'ANA GİRİŞ');

  return d.toDxfString();
};

module.exports = madenHaritasiOlustur;