import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function App() {
  const [current, setCurrent] = useState({ methane: 0, oxygen: 21 });
  const [history, setHistory] = useState([]); 
  const [status, setStatus] = useState("Bağlanıyor...");

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:5000');

    socket.onopen = () => setStatus("Sistem Aktif ✅");
    socket.onclose = () => setStatus("Bağlantı Koptu ❌");

    socket.onmessage = (event) => {
      // YENİ: Backend'den gelen JSON verisini ayrıştırıyoruz
      const response = JSON.parse(event.data);

      // DURUM 1: Sayfa ilk açıldığında Veritabanından gelen geçmiş veriler
      if (response.type === 'HISTORY') {
        const historyData = response.data.map(item => ({
          // DB'den gelen 'zaman' bilgisini saat formatına çeviriyoruz
          time: new Date(item.zaman).toLocaleTimeString().split(' ')[0],
          methane: Number(item.metan),
          oxygen: Number(item.oksijen)
        }));
        setHistory(historyData);
      } 
      
      // DURUM 2: WebSocket King veya ESP32'den gelen canlı veri
      else if (response.type === 'LIVE') {
        const time = new Date().toLocaleTimeString().split(' ')[0];
        
        // Verileri sayıya çevirerek (Number) NaN hatasını engelliyoruz
        const m = Number(response.metan);
        const o = Number(response.oksijen);

        setCurrent({ methane: m, oxygen: o });

        // Grafiğe yeni veriyi ekle, son 20 taneyi göster
        setHistory(prev => [...prev, { time, methane: m, oxygen: o }].slice(-20));
      }
    };

    return () => socket.close();
  }, []);

  const isMethaneDanger = current.methane > 400;
  const isOxygenDanger = current.oxygen < 19;
  const isSystemDanger = isMethaneDanger || isOxygenDanger;

  return (
    <div style={{ 
      backgroundColor: isSystemDanger ? '#450a0a' : '#0f172a', 
      color: 'white', minHeight: '100vh', padding: '20px', transition: 'all 0.5s' 
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ letterSpacing: '2px' }}>MADEN ERKEN İKAZ SİSTEMİ (DB DESTEKLİ)</h2>
          <div style={{ 
            padding: '10px 20px', borderRadius: '20px', fontWeight: 'bold',
            backgroundColor: isSystemDanger ? '#ef4444' : '#22c55e' 
          }}>
            {status}
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          
          <div style={{ background: '#1e293b', padding: '25px', borderRadius: '15px', borderLeft: `8px solid ${isMethaneDanger ? '#ef4444' : '#f97316'}` }}>
            <h4 style={{ margin: 0, color: '#94a3b8' }}>METAN (CH4)</h4>
            <h1 style={{ fontSize: '48px', margin: '10px 0' }}>{current.methane} <small style={{fontSize: '18px'}}>ppm</small></h1>
            {isMethaneDanger && <div style={{color: '#fca5a5', fontWeight: 'bold'}}>⚠️ KRİTİK SEVİYE!</div>}
          </div>

          <div style={{ background: '#1e293b', padding: '25px', borderRadius: '15px', borderLeft: `8px solid ${isOxygenDanger ? '#ef4444' : '#06b6d4'}` }}>
            <h4 style={{ margin: 0, color: '#94a3b8' }}>OKSİJEN (O2)</h4>
            <h1 style={{ fontSize: '48px', margin: '10px 0' }}>%{current.oxygen}</h1>
            {isOxygenDanger && <div style={{color: '#fca5a5', fontWeight: 'bold'}}>⚠️ DÜŞÜK OKSİJEN!</div>}
          </div>
        </div>

        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '15px', height: '400px' }}>
          <h3 style={{ marginBottom: '20px', color: '#94a3b8' }}>CANLI ANALİZ GRAFİĞİ</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="methane" stroke="#f97316" strokeWidth={3} dot={true} isAnimationActive={true} />
              <Line type="monotone" dataKey="oxygen" stroke="#06b6d4" strokeWidth={3} dot={true} isAnimationActive={true} />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

export default App;