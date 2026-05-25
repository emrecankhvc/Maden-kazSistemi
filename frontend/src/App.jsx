import { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './App.css'

// ============ HARİTA BİLEŞENİ ============
function MadenHaritasi({ sensors }) {
  const [transform, setTransform] = useState({ x: 150, y: 250, scale: 1 })
  const [dragging, setDragging] = useState(false)
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 })
  const [gorunum, setGorunum] = useState('normal')
  const [hoveredSensor, setHoveredSensor] = useState(null)

  const zoomIn  = () => setTransform(t => ({ ...t, scale: Math.min(t.scale + 0.2, 3) }))
  const zoomOut = () => setTransform(t => ({ ...t, scale: Math.max(t.scale - 0.2, 0.3) }))
  const resetView = () => setTransform({ x: 150, y: 250, scale: 1 })

  const onMouseDown = (e) => { setDragging(true); setLastPos({ x: e.clientX, y: e.clientY }) }
  const onMouseMove = (e) => {
    if (!dragging) return
    setTransform(t => ({ ...t, x: t.x + (e.clientX - lastPos.x), y: t.y + (e.clientY - lastPos.y) }))
    setLastPos({ x: e.clientX, y: e.clientY })
  }
  const onMouseUp = () => setDragging(false)

  const getSensorRenk = (metan) => {
    if (metan > 2000) return '#ff4444'
    if (metan > 1000) return '#ffcc00'
    return '#00ff88'
  }

  // Tema renkleri
  const tema = {
    normal: { bg: '#0a0a0a', duvar: '#2a2a2a', ic: '#1a1a1a', izgara: '#111' },
    termal: { bg: '#0a0005', duvar: '#3a1500', ic: '#1a0800', izgara: '#1a0500' },
    gece:   { bg: '#000308', duvar: '#001133', ic: '#000820', izgara: '#000a1a' }
  }
  const t = tema[gorunum]

  // Tünel tanımları (dış ve iç koordinatlar)
  const tunel = {
    kalnlik: 20,
    renkDis: t.duvar,
    renkIc: t.ic,
  }

  // Tünel çizgi segmentleri
  const segmentler = [
    { x1: 0, y1: 0, x2: 200, y2: 0 },       // Ana tünel
    { x1: 100, y1: 0, x2: 100, y2: -120 },   // Galeri 1 dikey
    { x1: 100, y1: -120, x2: 350, y2: -120 }, // Galeri 1 yatay
    { x1: 200, y1: 0, x2: 400, y2: 0 },       // Galeri 2
    { x1: 100, y1: 0, x2: 100, y2: 120 },     // Galeri 3 dikey
    { x1: 100, y1: 120, x2: 350, y2: 120 },   // Galeri 3 yatay
  ]

  // Sensörün bağlı olduğu tünelin durumunu al
  const getSensorTunel = (sensorId) => {
    const s = sensors.find(s => s.id === sensorId)
    return s ? getSensorRenk(s.metan) : '#00ff88'
  }

  // Her galeri için tehlike rengi
  const galeri1Renk = getSensorTunel(1)
  const galeri2Renk = getSensorTunel(2)
  const galeri3Renk = getSensorTunel(3)
  const anaRenk = getSensorTunel(4)

  const segmentRenkler = [
    anaRenk, anaRenk,
    galeri1Renk, galeri1Renk,
    galeri2Renk,
    galeri3Renk, galeri3Renk,
  ]

  return (
    <div className="harita-panel">
      <div className="harita-baslik">⛏ Maden Ocağı Haritası — Canlı Sensör Durumu</div>

      <div className="harita-kontrol">
        <button className="harita-btn" onClick={zoomIn}>🔍 Yakınlaş</button>
        <button className="harita-btn" onClick={zoomOut}>🔎 Uzaklaş</button>
        <button className="harita-btn" onClick={resetView}>⌂ Sıfırla</button>
        <button className={`harita-btn ${gorunum === 'normal' ? 'aktif' : ''}`} onClick={() => setGorunum('normal')}>Normal</button>
        <button className={`harita-btn ${gorunum === 'termal' ? 'aktif' : ''}`} onClick={() => setGorunum('termal')}>🌡 Termal</button>
        <button className={`harita-btn ${gorunum === 'gece' ? 'aktif' : ''}`} onClick={() => setGorunum('gece')}>🌙 Gece</button>
      </div>

      <svg
        width="100%" height="550"
        style={{ background: t.bg, borderRadius: '8px', cursor: dragging ? 'grabbing' : 'grab', border: '1px solid #222' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <defs>
          {/* Kayalık doku */}
          <filter id="kaya">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
          {/* Glow efekti */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {/* Tehlike glow */}
          <filter id="glowRed">
            <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>

          {/* Izgara */}
          {[-200,-150,-100,-50,0,50,100,150,200,250,300,350,400,450].map(x => (
            <line key={`gx${x}`} x1={x} y1={-300} x2={x} y2={300} stroke={t.izgara} strokeWidth={0.5} />
          ))}
          {[-250,-200,-150,-100,-50,0,50,100,150,200,250].map(y => (
            <line key={`gy${y}`} x1={-100} y1={y} x2={500} y2={y} stroke={t.izgara} strokeWidth={0.5} />
          ))}

          {/* Tünel dış duvarları (kalın, kayalık efekti) */}
          {segmentler.map((s, i) => (
            <line key={`dis${i}`}
              x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
              stroke={t.duvar} strokeWidth={tunel.kalnlik + 8}
              strokeLinecap="round" filter="url(#kaya)"
            />
          ))}

          {/* Tünel iç alanı */}
          {segmentler.map((s, i) => (
            <line key={`ic${i}`}
              x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
              stroke={t.ic} strokeWidth={tunel.kalnlik}
              strokeLinecap="round"
            />
          ))}

          {/* Tehlike varsa tünel parlıyor */}
          {segmentler.map((s, i) => {
            const renk = segmentRenkler[i] || '#00ff88'
            if (renk === '#00ff88') return null
            return (
              <line key={`tehlike${i}`}
                x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                stroke={renk} strokeWidth={tunel.kalnlik - 4}
                strokeLinecap="round" opacity={0.15}
                filter="url(#glowRed)"
              />
            )
          })}

          {/* Tünel orta çizgisi (yol) */}
          {segmentler.map((s, i) => (
            <line key={`yol${i}`}
              x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
              stroke="#222" strokeWidth={2}
              strokeLinecap="round" strokeDasharray="8,8"
            />
          ))}

          {/* Etiketler */}
          <text x={200} y={-130} textAnchor="middle" fill="#555" fontSize="10">GALERİ 1</text>
          <text x={300} y={-10} textAnchor="middle" fill="#555" fontSize="10">GALERİ 2</text>
          <text x={200} y={140} textAnchor="middle" fill="#555" fontSize="10">GALERİ 3</text>
          <text x={50} y={-25} textAnchor="middle" fill="#555" fontSize="10">ANA TÜNEL</text>

          {/* Ana giriş kapısı */}
          <rect x={-20} y={-15} width={24} height={30} fill="#333" stroke="#555" strokeWidth={2} rx={3} />
          <rect x={-16} y={-11} width={7} height={22} fill="#222" stroke="#444" strokeWidth={1} rx={1} />
          <rect x={-7} y={-11} width={7} height={22} fill="#222" stroke="#444" strokeWidth={1} rx={1} />
          <text x={-8} y={30} textAnchor="middle" fill="#555" fontSize="9">GİRİŞ</text>

          {/* Sensörler */}
          {sensors.map(s => {
            const renk = getSensorRenk(s.metan)
            const isHovered = hoveredSensor === s.id
            return (
              <g key={s.id}
                onMouseEnter={() => setHoveredSensor(s.id)}
                onMouseLeave={() => setHoveredSensor(null)}
                style={{cursor: 'pointer'}}
              >
                {/* Dış halka animasyonu */}
                {s.metan > 1000 && (
                  <circle cx={s.x} cy={-s.y} r={18} fill="none" stroke={renk} strokeWidth={2} opacity={0.3}>
                    <animate attributeName="r" from="12" to="26" dur="1.5s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite"/>
                  </circle>
                )}

                {/* Sensör gövdesi */}
                <circle cx={s.x} cy={-s.y} r={12} fill="#111" stroke={renk} strokeWidth={2.5} filter="url(#glow)" />
                <circle cx={s.x} cy={-s.y} r={7} fill={renk} opacity={0.9} />

                {/* Sensör numarası */}
                <text x={s.x} y={-s.y + 4} textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">S{s.id}</text>

                {/* PPM değeri */}
                <text x={s.x} y={-s.y - 18} textAnchor="middle" fill={renk} fontSize="9" fontWeight="bold">{s.metan}</text>
                <text x={s.x} y={-s.y - 8} textAnchor="middle" fill="#888" fontSize="7">PPM</text>

                {/* Hover popup */}
                {isHovered && (
                  <g>
                    <rect x={s.x + 15} y={-s.y - 45} width={90} height={55} fill="#1a1a1a" stroke={renk} strokeWidth={1} rx={6} />
                    <text x={s.x + 60} y={-s.y - 30} textAnchor="middle" fill={renk} fontSize="9" fontWeight="bold">SENSÖR {s.id}</text>
                    <text x={s.x + 60} y={-s.y - 18} textAnchor="middle" fill="#aaa" fontSize="8">{s.konum}</text>
                    <text x={s.x + 60} y={-s.y - 6} textAnchor="middle" fill="#fff" fontSize="9">{s.metan} PPM</text>
                    <text x={s.x + 60} y={-s.y + 6} textAnchor="middle" fill={renk} fontSize="8">
                      {s.metan > 2000 ? '⚠ TEHLİKE' : s.metan > 1000 ? '⚡ UYARI' : '✓ NORMAL'}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* Koordinat merkezi */}
          <circle cx={0} cy={0} r={3} fill="#333" />

        </g>

        {/* Mini harita sağ altta */}
        <g transform="translate(20, 20)">
          <rect x={0} y={0} width={100} height={70} fill="#0d0d0d" stroke="#222" strokeWidth={1} rx={4} />
          <text x={50} y={12} textAnchor="middle" fill="#555" fontSize="7">MİNİ HARİTA</text>
          {segmentler.map((s, i) => (
            <line key={`mini${i}`}
              x1={s.x1 / 6 + 15} y1={s.y1 / 6 + 40}
              x2={s.x2 / 6 + 15} y2={s.y2 / 6 + 40}
              stroke="#333" strokeWidth={3} strokeLinecap="round"
            />
          ))}
          {sensors.map(s => (
            <circle key={s.id} cx={s.x / 6 + 15} cy={-s.y / 6 + 40} r={3} fill={getSensorRenk(s.metan)} />
          ))}
          {/* Viewport göstergesi */}
          <rect
            x={Math.max(0, 15 - transform.x / (6 * transform.scale))}
            y={Math.max(15, 40 - transform.y / (6 * transform.scale))}
            width={Math.min(100, 80 / transform.scale)}
            height={Math.min(55, 50 / transform.scale)}
            fill="none" stroke="#00ff8844" strokeWidth={1}
          />
        </g>

      </svg>

      <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '12px', color: '#888' }}>
        <span><span style={{color: '#00ff88'}}>●</span> Normal (&lt;1000 PPM)</span>
        <span><span style={{color: '#ffcc00'}}>●</span> Uyarı (1000-2000 PPM)</span>
        <span><span style={{color: '#ff4444'}}>●</span> Tehlike (&gt;2000 PPM)</span>
        <span style={{marginLeft: 'auto', color: '#555'}}>Sürükle • Zoom • Sensörün üstüne gel</span>
      </div>
    </div>
  )
}

// ============ ANA UYGULAMA ============
function App() {
  const [aktifTab, setAktifTab] = useState('dashboard')
  const [metan, setMetan] = useState(0)
  const [oksijen, setOksijen] = useState(0)
  const [durum, setDurum] = useState('NORMAL')
  const [baglanti, setBaglanti] = useState(false)
  const [tahliye, setTahliye] = useState(false)
  const [tahliyeZaman, setTahliyeZaman] = useState(null)
  const [gecmis, setGecmis] = useState([])
  const [alarmlar, setAlarmlar] = useState([])
  const [sonOlcum, setSonOlcum] = useState(null)
  const [baslangic, setBaslangic] = useState(null)
  const [sure, setSure] = useState('00:00:00')
  const [istatistik, setIstatistik] = useState({ min: 0, max: 0, ort: 0, count: 0 })
  const [toplamAlarm, setToplamAlarm] = useState(0)
  const [haritaVeri, setHaritaVeri] = useState(null)
  const [sensors, setSensors] = useState([
    { id: 1, konum: 'Galeri 1', metan: 0, x: 290, y: 100 },
    { id: 2, konum: 'Galeri 2', metan: 0, x: 390, y: 0 },
    { id: 3, konum: 'Galeri 3', metan: 0, x: 290, y: -100 },
    { id: 4, konum: 'Ana Giriş', metan: 0, x: 0, y: 0 },
  ])


  // Harita verisini çek
  useEffect(() => {
    fetch('http://192.168.1.120:5000/api/harita')
      .then(r => r.json())
      .then(veri => setHaritaVeri(veri))
      .catch(err => console.error('Harita verisi alınamadı:', err))
  }, [])

  // WebSocket
  useEffect(() => {
    const ws = new WebSocket('ws://192.168.1.120:5000')

    ws.onopen = () => { setBaglanti(true); setBaslangic(new Date()) }

    ws.onmessage = (event) => {
      const veri = JSON.parse(event.data)

      if (veri.type === 'HISTORY') {
        const formatli = veri.data.map(row => ({
          zaman: new Date(row.zaman).toLocaleString('tr-TR', {day:'2-digit', month:'2-digit', hour:'2-digit', year:'numeric', minute:'2-digit'}),
          metan: parseFloat(row.metan),
          oksijen: parseFloat(row.oksijen)
        }))
        setGecmis(formatli)
        const metanlar = veri.data.slice(-20).map(r => parseFloat(r.metan)).filter(m => !isNaN(m) && isFinite(m) && m > 0 && m < 50000)
if (metanlar.length > 0) {
  const minVal = metanlar.reduce((a, b) => Math.min(a, b), metanlar[0])
  const maxVal = metanlar.reduce((a, b) => Math.max(a, b), metanlar[0])
  const ortVal = Math.round(metanlar.slice(-20).reduce((a, b) => a + b, 0) / Math.min(metanlar.length, 20))
  setIstatistik({
    min: Math.round(minVal),
    max: Math.round(maxVal),
    ort: ortVal
  })
}
        const eskiAlarmlar = veri.data.filter(r => parseFloat(r.metan) > 1000).map(r => ({
          zaman: new Date(r.zaman).toLocaleTimeString(),
          tarih: new Date(r.zaman).toLocaleDateString(),
          metan: parseFloat(r.metan),
          durum: parseFloat(r.metan) > 2000 ? 'tehlike' : 'uyari'
        }))
        setAlarmlar(eskiAlarmlar.slice(-10))
        setToplamAlarm(eskiAlarmlar.length)
      }

      if (veri.type === 'LIVE') {
  setMetan(veri.metan)
  setOksijen(veri.oksijen)
  setDurum(veri.durum)
  setSonOlcum(new Date())
  setSensors(prev => prev.map(s => s.id === 1 ? { ...s, metan: veri.metan } : s))
  
  setGecmis(prev => {
    const yeni = [...prev, {
      zaman: new Date().toLocaleString('tr-TR', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'}),
      metan: veri.metan,
      oksijen: veri.oksijen
    }].slice(-20)
    return yeni
  })

  setIstatistik(prev => {
  const yeniMin = prev.count === 0 ? veri.metan : Math.min(prev.min, veri.metan)
  const yeniMax = prev.count === 0 ? veri.metan : Math.max(prev.max, veri.metan)
  return { min: yeniMin, max: yeniMax, ort: veri.metan, count: (prev.count || 0) + 1 }
})

  if (veri.metan > 1000) {
    setToplamAlarm(prev => prev + 1)
    setAlarmlar(prev => [...prev, {
      zaman: new Date().toLocaleTimeString(),
      tarih: new Date().toLocaleDateString(),
      metan: veri.metan,
      durum: veri.metan > 2000 ? 'tehlike' : 'uyari'
    }].slice(-10))
  }
}

      if (veri.type === 'SIMULE') {
        setSensors(prev => prev.map(s => {
          const sim = veri.sensors.find(ss => ss.id === s.id)
          return sim ? { ...s, metan: sim.metan } : s
        }))
      }

      if (veri.type === 'TAHLİYE') {
  setTahliye(true)
  setTahliyeZaman(new Date().toLocaleTimeString())
}
    }

    ws.onclose = () => setBaglanti(false)
    return () => ws.close()
  }, [])

  // Çalışma süresi
  useEffect(() => {
    if (!baslangic) return
    const timer = setInterval(() => {
      const fark = Math.floor((new Date() - baslangic) / 1000)
      const s = Math.floor(fark / 3600).toString().padStart(2, '0')
      const d = Math.floor((fark % 3600) / 60).toString().padStart(2, '0')
      const sn = (fark % 60).toString().padStart(2, '0')
      setSure(`${s}:${d}:${sn}`)
    }, 1000)
    return () => clearInterval(timer)
  }, [baslangic])
  
  const tahliyeBaslat = async () => {
  try {
    await fetch('http://192.168.1.120:5000/api/tahliye', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'maden123'
      }
    })
  } catch (err) {
    console.error('Tahliye hatası:', err)
  }
}

  const durumClass = durum === 'TEHLİKE' ? 'tehlike' : durum === 'UYARI' ? 'uyari' : 'normal'

  return (
    <div className="container">

      {/* Header */}
      <div className="header">
        <h1>⛏ MADEN İKAZ SİSTEMİ</h1>
        <div className={`baglanti ${baglanti ? 'bagli' : 'bagli-degil'}`}>
          {baglanti ? '● CANLI' : '● BAĞLANTI YOK'}
        </div>
      </div>

    {/* Tahliye Banner */}
{tahliye && (
  <>
    <div className="tahliye-overlay" />
    <div className="tahliye-banner">
      🚨 TAHLİYE BAŞLATILDI — {tahliyeZaman} — TÜM PERSONELİ TAHLİYE EDİN! 🚨
    </div>
  </>
)}

{/* Tahliye Butonu */}
<button className="tahliye-btn" onClick={tahliyeBaslat}>
  🚨 ACİL TAHLİYE BAŞLAT
</button>
{tahliye && (
  <button className="tahliye-sifirla-btn" onClick={() => setTahliye(false)}>
    Tahliye Alarmını Sıfırla
  </button>
)}
  

      {/* Tab Navigasyon */}
      <div className="tabs">
        <button className={`tab ${aktifTab === 'dashboard' ? 'aktif' : ''}`} onClick={() => setAktifTab('dashboard')}>📊 Dashboard</button>
        <button className={`tab ${aktifTab === 'harita' ? 'aktif' : ''}`} onClick={() => setAktifTab('harita')}>🗺 Harita</button>
        <button className={`tab ${aktifTab === 'alarmlar' ? 'aktif' : ''}`} onClick={() => setAktifTab('alarmlar')}>⚠ Alarmlar</button>
        <button className={`tab ${aktifTab === 'istatistik' ? 'aktif' : ''}`} onClick={() => setAktifTab('istatistik')}>📈 İstatistik</button>
      </div>

      {/* DASHBOARD SAYFASI */}
      {aktifTab === 'dashboard' && (
        <>
          <div className="kartlar">
            <div className={`kart ${durumClass}`}>
              <div className="kart-baslik">Metan Seviyesi</div>
              <div className="kart-deger">{metan}</div>
              <div className="kart-birim">PPM</div>
            </div>
            <div className="kart normal">
              <div className="kart-baslik">Oksijen Seviyesi</div>
              <div className="kart-deger">{oksijen}</div>
              <div className="kart-birim">%</div>
            </div>
            <div className={`kart ${durumClass}`}>
              <div className="kart-baslik">Durum</div>
              <div className={`kart-deger durum-${durumClass}`} style={{fontSize: '28px'}}>
                {durum === 'TEHLİKE' ? '⚠ TEHLİKE' : durum === 'UYARI' ? '⚡ UYARI' : '✓ NORMAL'}
              </div>
              <div className="kart-birim">
                {durum === 'TEHLİKE' ? 'Derhal tahliye!' : durum === 'UYARI' ? 'Dikkat gerekli' : 'Güvenli ortam'}
              </div>
            </div>
          </div>

          <div className="grafik-panel">
            <div className="grafik-baslik">Metan Seviyesi — Son 20 Ölçüm</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={gecmis}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="zaman" stroke="#555" tick={{fill: '#888', fontSize: 11}} />
                <YAxis stroke="#555" tick={{fill: '#888', fontSize: 11}} />
                <Tooltip contentStyle={{background: '#111', border: '1px solid #333', borderRadius: '8px'}} labelStyle={{color: '#888'}} />
                <Line type="monotone" dataKey="metan" stroke="#00ff88" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="alt-panel">
            <div className="son-olcum-panel">
              <div className="son-olcum-label">Sensör Durumu</div>
              <div className="son-olcum-zaman" style={{fontSize: '20px', color: baglanti ? '#00ff88' : '#ff4444'}}>
                {baglanti ? '● AKTİF' : '● PASİF'}
              </div>
              <div className="son-olcum-tarih">Çalışma: {sure}</div>
            </div>
            <div className="son-olcum-panel">
              <div className="son-olcum-label">Son Ölçüm</div>
              <div className="son-olcum-zaman">{sonOlcum ? sonOlcum.toLocaleTimeString() : '--:--:--'}</div>
              <div className="son-olcum-tarih">
                {sonOlcum ? sonOlcum.toLocaleDateString('tr-TR', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}) : 'Bekleniyor...'}
              </div>
            </div>
          </div>
        </>
      )}

      {/* HARİTA SAYFASI */}
      {aktifTab === 'harita' && (
        <MadenHaritasi sensors={sensors} haritaVeri={haritaVeri} />
      )}

      {/* ALARMLAR SAYFASI */}
      {aktifTab === 'alarmlar' && (
        <div className="alarm-panel">
          <div className="alarm-baslik">
            ⚠ Alarm Geçmişi
            <span style={{float: 'right', color: '#ff4444'}}>Toplam: {toplamAlarm}</span>
          </div>
          {alarmlar.length === 0 ? (
            <p style={{color: '#555', fontSize: '14px', marginTop: '16px'}}>Henüz alarm yok</p>
          ) : (
            <ul className="alarm-liste">
              {alarmlar.map((alarm, index) => (
                <li key={index} className={`alarm-item ${alarm.durum}`}>
                  <span>{alarm.durum === 'tehlike' ? '🔴' : '🟡'} {alarm.metan} PPM</span>
                  <span className="alarm-zaman">{alarm.tarih} {alarm.zaman}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* İSTATİSTİK SAYFASI */}
      {aktifTab === 'istatistik' && (
        <div className="istatistik-grid">
          <div className="istatistik-kart">
            <div className="istatistik-baslik">Minimum Metan</div>
            <div className="istatistik-deger">{parseInt(istatistik.min) || 0}</div>
            <div className="istatistik-birim">PPM</div>
          </div>
          <div className="istatistik-kart">
            <div className="istatistik-baslik">Maximum Metan</div>
            <div className="istatistik-deger" style={{color: '#ff4444'}}>{parseInt(istatistik.max) || 0}</div>
            <div className="istatistik-birim">PPM</div>
          </div>
          <div className="istatistik-kart">
            <div className="istatistik-baslik">Anlık Metan</div>
            <div className="istatistik-deger" style={{color: '#ffcc00'}}>{parseInt(istatistik.ort) || 0}</div>
            <div className="istatistik-birim">PPM</div>
          </div>
          <div className="istatistik-kart">
            <div className="istatistik-baslik">Toplam Alarm</div>
            <div className="istatistik-deger" style={{color: '#ff4444'}}>{toplamAlarm}</div>
            <div className="istatistik-birim">Adet</div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App