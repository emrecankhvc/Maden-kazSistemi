import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './App.css'

function App() {
  const [metan, setMetan] = useState(0)
  const [oksijen, setOksijen] = useState(0)
  const [durum, setDurum] = useState('NORMAL')
  const [baglanti, setBaglanti] = useState(false)
  const [gecmis, setGecmis] = useState([])
  const [alarmlar, setAlarmlar] = useState([])
  const [sonOlcum, setSonOlcum] = useState(null)
  const [baslangic, setBaslangic] = useState(null)
  const [istatistik, setIstatistik] = useState({ min: 0, max: 0, ort: 0 })
  const [toplamAlarm, setToplamAlarm] = useState(0)

  useEffect(() => {
    const ws = new WebSocket('ws://192.168.1.120:5000')

    ws.onopen = () => {
      setBaglanti(true)
      setBaslangic(new Date())
    }

    ws.onmessage = (event) => {
      const veri = JSON.parse(event.data)

      if (veri.type === 'HISTORY') {
        const formatli = veri.data.map(row => ({
          zaman: new Date(row.zaman).toLocaleTimeString(),
          metan: parseFloat(row.metan),
          oksijen: parseFloat(row.oksijen)
        }))
        setGecmis(formatli)

        // İstatistikleri hesapla
        const metanlar = veri.data.map(r => parseFloat(r.metan))
        setIstatistik({
          min: Math.min(...metanlar).toFixed(0),
          max: Math.max(...metanlar).toFixed(0),
          ort: (metanlar.reduce((a, b) => a + b, 0) / metanlar.length).toFixed(0)
        })

        // Geçmiş alarmları bul
        const eskiAlarmlar = veri.data
          .filter(row => parseFloat(row.metan) > 1000)
          .map(row => ({
            zaman: new Date(row.zaman).toLocaleTimeString(),
            tarih: new Date(row.zaman).toLocaleDateString(),
            metan: parseFloat(row.metan),
            durum: parseFloat(row.metan) > 2000 ? 'tehlike' : 'uyari'
          }))
        setAlarmlar(eskiAlarmlar.slice(-10))
        setToplamAlarm(eskiAlarmlar.length)
      }

      if (veri.type === 'LIVE') {
        setMetan(veri.metan)
        setOksijen(veri.oksijen)
        setDurum(veri.durum)
        setSonOlcum(new Date())

        setGecmis(prev => {
          const yeni = [...prev, {
            zaman: new Date().toLocaleTimeString(),
            metan: veri.metan,
            oksijen: veri.oksijen
          }]
          const yeniListe = yeni.slice(-20)

          // İstatistik güncelle
          const metanlar = yeniListe.map(r => r.metan)
          setIstatistik({
            min: Math.min(...metanlar).toFixed(0),
            max: Math.max(...metanlar).toFixed(0),
            ort: (metanlar.reduce((a, b) => a + b, 0) / metanlar.length).toFixed(0)
          })

          return yeniListe
        })

        if (veri.metan > 1000) {
          setToplamAlarm(prev => prev + 1)
          setAlarmlar(prev => {
            const yeni = [...prev, {
              zaman: new Date().toLocaleTimeString(),
              tarih: new Date().toLocaleDateString(),
              metan: veri.metan,
              durum: veri.metan > 2000 ? 'tehlike' : 'uyari'
            }]
            return yeni.slice(-10)
          })
        }
      }
    }

    ws.onclose = () => setBaglanti(false)
    return () => ws.close()
  }, [])

  const durumClass = durum === 'TEHLİKE' ? 'tehlike' : durum === 'UYARI' ? 'uyari' : 'normal'

  // Çalışma süresi hesapla
  const calismaStr = () => {
    if (!baslangic) return '--:--:--'
    const fark = Math.floor((new Date() - baslangic) / 1000)
    const s = Math.floor(fark / 3600).toString().padStart(2, '0')
    const d = Math.floor((fark % 3600) / 60).toString().padStart(2, '0')
    const sn = (fark % 60).toString().padStart(2, '0')
    return `${s}:${d}:${sn}`
  }

  const [sure, setSure] = useState('00:00:00')
  useEffect(() => {
    const timer = setInterval(() => setSure(calismaStr()), 1000)
    return () => clearInterval(timer)
  }, [baslangic])

  return (
    <div className="container">

      {/* Header */}
      <div className="header">
        <h1>⛏ MADEN İKAZ SİSTEMİ</h1>
        <div className={`baglanti ${baglanti ? 'bagli' : 'bagli-degil'}`}>
          {baglanti ? '● CANLI' : '● BAĞLANTI YOK'}
        </div>
      </div>

      {/* Ana Kartlar */}
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

      {/* İstatistik Kartları */}
      <div className="kartlar" style={{marginBottom: '16px'}}>
        <div className="kart normal">
          <div className="kart-baslik">Min Metan</div>
          <div className="kart-deger" style={{fontSize: '32px'}}>{istatistik.min}</div>
          <div className="kart-birim">PPM</div>
        </div>

        <div className="kart normal">
          <div className="kart-baslik">Max Metan</div>
          <div className="kart-deger" style={{fontSize: '32px'}}>{istatistik.max}</div>
          <div className="kart-birim">PPM</div>
        </div>

        <div className="kart normal">
          <div className="kart-baslik">Ortalama Metan</div>
          <div className="kart-deger" style={{fontSize: '32px'}}>{istatistik.ort}</div>
          <div className="kart-birim">PPM</div>
        </div>
      </div>

      {/* Grafik */}
      <div className="grafik-panel">
        <div className="grafik-baslik">Metan Seviyesi — Son 20 Ölçüm</div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={gecmis}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis dataKey="zaman" stroke="#555" tick={{fill: '#888', fontSize: 11}} />
            <YAxis stroke="#555" tick={{fill: '#888', fontSize: 11}} />
            <Tooltip
              contentStyle={{background: '#111', border: '1px solid #333', borderRadius: '8px'}}
              labelStyle={{color: '#888'}}
            />
            <Line type="monotone" dataKey="metan" stroke="#00ff88" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Alt Panel */}
      <div className="alt-panel">

        {/* Alarm Geçmişi */}
        <div className="alarm-panel">
          <div className="alarm-baslik">⚠ Alarm Geçmişi
            <span style={{float: 'right', color: '#ff4444'}}>Toplam: {toplamAlarm}</span>
          </div>
          {alarmlar.length === 0 ? (
            <p style={{color: '#555', fontSize: '14px'}}>Henüz alarm yok</p>
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

        {/* Sensör Durumu + Son Ölçüm */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          <div className="son-olcum-panel">
            <div className="son-olcum-label">Sensör Durumu</div>
            <div className="son-olcum-zaman" style={{fontSize: '20px', color: baglanti ? '#00ff88' : '#ff4444'}}>
              {baglanti ? '● AKTİF' : '● PASİF'}
            </div>
            <div className="son-olcum-tarih">Çalışma süresi: {sure}</div>
          </div>

          <div className="son-olcum-panel">
            <div className="son-olcum-label">Son Ölçüm Zamanı</div>
            <div className="son-olcum-zaman">
              {sonOlcum ? sonOlcum.toLocaleTimeString() : '--:--:--'}
            </div>
            <div className="son-olcum-tarih">
              {sonOlcum ? sonOlcum.toLocaleDateString('tr-TR', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}) : 'Bekleniyor...'}
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}

export default App