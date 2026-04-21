import { useState, useEffect } from 'react';
import { guardarSesion, getUltimaSesion, getHistorial } from './supabase';

const COLOR_MAP = { 'Rutina 1': '#f97316', 'Rutina 2': '#a855f7', 'Rutina 3': '#3b82f6' };
const CARDIO_OPTIONS = [
  { id: 'escalera', label: 'Escalera', icon: '🪜', unit: 'min' },
  { id: 'cinta', label: 'Cinta', icon: '🏃', unit: 'min' },
  { id: 'bici', label: 'Bici', icon: '🚴', unit: 'min' },
  { id: 'eliptica', label: 'Elíptica', icon: '⚙️', unit: 'min' },
  { id: 'remo', label: 'Remo', icon: '🚣', unit: 'min' },
  { id: 'caminar', label: 'Caminar', icon: '🚶', unit: 'km' },
];
const INTENSIDAD = ['Suave', 'Moderada', 'Alta', 'Máxima'];
const ORDEN_RUTINAS = ['Rutina 1', 'Rutina 2', 'Rutina 3'];
const RUTINAS = {
  'Rutina 1': [
    { nombre: 'Leg Press', series: [{ pesoRef: 80, repsRef: 12 }, { pesoRef: 80, repsRef: 12 }, { pesoRef: 80, repsRef: 12 }] },
    { nombre: 'Low Row', series: [{ pesoRef: 62.5, repsRef: 12 }, { pesoRef: 62.5, repsRef: 12 }, { pesoRef: 62.5, repsRef: 10 }] },
    { nombre: 'Leg Extension', series: [{ pesoRef: 42.5, repsRef: 12 }, { pesoRef: 42.5, repsRef: 12 }, { pesoRef: 42.5, repsRef: 10 }] },
    { nombre: 'Leg Curl', series: [{ pesoRef: 30, repsRef: 12 }, { pesoRef: 35, repsRef: 12 }, { pesoRef: 40, repsRef: 10 }] },
    { nombre: 'Plancha', series: [{ pesoRef: null, repsRef: 40 }, { pesoRef: null, repsRef: 40 }, { pesoRef: null, repsRef: 40 }] },
  ],
  'Rutina 2': [
    { nombre: 'Shoulder Press', series: [{ pesoRef: 17.5, repsRef: 12 }, { pesoRef: 22.5, repsRef: 12 }, { pesoRef: 22.5, repsRef: 12 }] },
    { nombre: 'Delts Machine', series: [{ pesoRef: 22.5, repsRef: 12 }, { pesoRef: 22.5, repsRef: 12 }, { pesoRef: 22.5, repsRef: 10 }] },
    { nombre: 'Curl Scott', series: [{ pesoRef: 10, repsRef: 12 }, { pesoRef: 15, repsRef: 12 }, { pesoRef: 15, repsRef: 12 }] },
    { nombre: 'Arm Extension', series: [{ pesoRef: 27.5, repsRef: 12 }, { pesoRef: 37.5, repsRef: 12 }, { pesoRef: 42.5, repsRef: 12 }] },
  ],
  'Rutina 3': [
    { nombre: 'Pectoral', series: [{ pesoRef: 32.5, repsRef: 12 }, { pesoRef: 32.5, repsRef: 12 }, { pesoRef: 32.5, repsRef: 10 }] },
    { nombre: 'Vertical Traction', series: [{ pesoRef: 50, repsRef: 12 }, { pesoRef: 50, repsRef: 12 }, { pesoRef: 50, repsRef: 10 }] },
    { nombre: 'Incline Chest Press', series: [{ pesoRef: 15, repsRef: 12 }, { pesoRef: 15, repsRef: 12 }, { pesoRef: 15, repsRef: 10 }] },
    { nombre: 'Plancha', series: [{ pesoRef: null, repsRef: 40 }, { pesoRef: null, repsRef: 40 }, { pesoRef: null, repsRef: 40 }] },
  ],
};
const EJERCICIOS_CONOCIDOS = ['Arm Extension','Leg Press','Low Row','Leg Extension','Leg Curl','Plancha','Pectoral','Vertical Traction','Chest Press','Incline Chest Press','Shoulder Press','Delts Machine','Curl Scott'];
const getSiguienteRutina = (ultima) => { if (!ultima) return 'Rutina 1'; const idx = ORDEN_RUTINAS.indexOf(ultima); return ORDEN_RUTINAS[(idx + 1) % ORDEN_RUTINAS.length]; };
const buildRegistros = (ejercicios) => { const d = {}; ejercicios.forEach((ej) => { d[ej.nombre] = ej.series.map((s) => ({ peso: s.pesoRef ? String(s.pesoRef) : '', reps: String(s.repsRef), hecho: false })); }); return d; };
const inp = (disabled) => ({ background: '#111', border: `1px solid ${disabled ? '#1e1e1e' : '#333'}`, borderRadius: 8, color: disabled ? '#444' : '#fff', fontSize: 14, fontWeight: 600, textAlign: 'center', padding: '6px 4px', width: '100%', boxSizing: 'border-box' });

function Pill({ label, active, color, small, onClick }) {
  return <button onClick={onClick} style={{ padding: small ? '5px 7px' : '7px 13px', borderRadius: 99, fontSize: small ? 11 : 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: active ? color : '#222', border: `1px solid ${active ? color : '#333'}`, color: active ? '#fff' : '#888' }}>{label}</button>;
}
function Lbl({ children }) {
  return <div style={{ fontSize: 11, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>{children}</div>;
}
function Block({ title, sub, action, children }) {
  return (
    <div style={{ background: '#1a1a1a', borderRadius: 14, marginBottom: 16, overflow: 'hidden', border: '1px solid #2a2a2a' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{title}</span>
          {sub && <span style={{ fontSize: 12, color: '#555' }}>{sub}</span>}
        </div>
        {action}
      </div>
      <div style={{ padding: '12px 16px' }}>{children}</div>
    </div>
  );
}
function EjCard({ nombre, seriesRef, rows, color, extra, onChange, onToggle, onAddSerie, onRemoveSerie, onRemoveEj }) {
  return (
    <div style={{ background: '#1a1a1a', borderRadius: 14, marginBottom: 16, overflow: 'hidden', border: `1px solid ${extra ? '#3a2a4a' : '#2a2a2a'}` }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{nombre}{extra && <span style={{ fontSize: 11, color: '#666', fontWeight: 400 }}> — extra</span>}</span>
        {extra && onRemoveEj && <button onClick={onRemoveEj} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16, padding: 0 }}>✕</button>}
      </div>
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr 1fr 34px 24px', gap: 6, marginBottom: 8, fontSize: 10, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
          <div/><div style={{ textAlign: 'center' }}>{extra ? '—' : 'Ref.'}</div><div style={{ textAlign: 'center' }}>Peso</div><div style={{ textAlign: 'center' }}>Reps</div><div style={{ textAlign: 'center' }}>✓</div><div/>
        </div>
        {rows.map((reg, i) => {
          const ref = seriesRef[i];
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr 1fr 34px 24px', gap: 6, marginBottom: 8, alignItems: 'center', opacity: reg.hecho ? 0.4 : 1, transition: 'opacity 0.2s' }}>
              <div style={{ fontSize: 11, color, fontWeight: 700, textAlign: 'center' }}>S{i+1}</div>
              <div style={{ textAlign: 'center', fontSize: 11, color: '#444' }}>{ref ? `${ref.pesoRef ?? '—'}×${ref.repsRef}` : '—'}</div>
              <input type="number" value={reg.peso} onChange={(e) => onChange(i,'peso',e.target.value)} disabled={reg.hecho} placeholder="kg" style={inp(reg.hecho)}/>
              <input type="number" value={reg.reps} onChange={(e) => onChange(i,'reps',e.target.value)} disabled={reg.hecho} style={inp(reg.hecho)}/>
              <button onClick={() => onToggle(i)} style={{ background: reg.hecho ? '#22c55e' : '#222', border: `1px solid ${reg.hecho ? '#22c55e' : '#444'}`, borderRadius: 8, color: reg.hecho ? '#fff' : '#555', fontSize: 14, cursor: 'pointer', height: 32, width: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>✓</button>
              <button onClick={() => rows.length > 1 && onRemoveSerie(i)} style={{ background: 'none', border: 'none', color: rows.length > 1 ? '#555' : '#222', cursor: rows.length > 1 ? 'pointer' : 'default', fontSize: 18, padding: 0, lineHeight: 1 }}>−</button>
            </div>
          );
        })}
        <button onClick={onAddSerie} style={{ width: '100%', marginTop: 4, padding: '7px', background: '#111', border: `1px dashed ${color}44`, borderRadius: 8, color, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Serie</button>
      </div>
    </div>
  );
}
function ResumenEj({ nombre, rows, color }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 6 }}>{nombre}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr>{['Serie','Peso','Reps','Vol.','✓'].map((h) => <th key={h} style={{ color: '#555', fontWeight: 600, padding: '4px 6px', textAlign: 'center', fontSize: 11 }}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((s, i) => {
            const vol = s.peso && s.reps ? (parseFloat(s.peso)*parseInt(s.reps)).toFixed(0) : '—';
            return (
              <tr key={i} style={{ borderTop: '1px solid #222' }}>
                <td style={{ color, fontWeight: 700, padding: '5px 6px', textAlign: 'center' }}>S{i+1}</td>
                <td style={{ color: '#fff', padding: '5px 6px', textAlign: 'center' }}>{s.peso ? `${s.peso}kg` : '—'}</td>
                <td style={{ color: '#fff', padding: '5px 6px', textAlign: 'center' }}>{s.reps}</td>
                <td style={{ color: '#888', padding: '5px 6px', textAlign: 'center' }}>{vol}</td>
                <td style={{ textAlign: 'center', padding: '5px 6px' }}><span style={{ color: s.hecho ? '#22c55e' : '#ef4444' }}>{s.hecho ? '✓' : '✗'}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HomeScreen({ onEntrenar, onHistorial, rutinaKey, ultimaData, loading }) {
  const COLOR = rutinaKey ? COLOR_MAP[rutinaKey] : '#f97316';
  const nombres = { 'Rutina 1': 'Pierna + Espalda 🦵', 'Rutina 2': 'Hombros + Bíceps 💪', 'Rutina 3': 'Pecho + Espalda alta 🏋️' };
  return (
    <div style={{ background: '#0f0f0f', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ fontSize: 56, marginBottom: 8 }}>💪</div>
      <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 900, margin: '0 0 4px', letterSpacing: -1 }}>DuroGym</h1>
      <div style={{ color: '#555', fontSize: 13, marginBottom: 40 }}>by Daniel</div>
      {loading ? <div style={{ color: '#555', fontSize: 14 }}>Cargando...</div> : (
        <div style={{ width: '100%', maxWidth: 340 }}>
          <div style={{ background: '#1a1a1a', borderRadius: 18, padding: 20, marginBottom: 12, border: `1px solid ${COLOR}44` }}>
            <div style={{ fontSize: 11, color: COLOR, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Toca hoy</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{nombres[rutinaKey]}</div>
            {ultimaData && <div style={{ fontSize: 12, color: '#555' }}>Última sesión: {new Date(ultimaData.fecha).toLocaleDateString('es-ES')} · {ultimaData.nota}/10</div>}
          </div>
          <button onClick={onEntrenar} style={{ width: '100%', padding: '18px', marginBottom: 10, background: `linear-gradient(135deg, ${COLOR}, ${COLOR}bb)`, border: 'none', borderRadius: 14, color: '#fff', fontSize: 17, fontWeight: 800, cursor: 'pointer' }}>Empezar entrenamiento →</button>
          <button onClick={onHistorial} style={{ width: '100%', padding: '16px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14, color: '#888', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>📊 Ver historial</button>
        </div>
      )}
    </div>
  );
}

function HistorialScreen({ onBack }) {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandida, setExpandida] = useState(null);
  useEffect(() => { getHistorial().then((data) => { setSesiones(data || []); setLoading(false); }); }, []);
  return (
    <div style={{ background: '#0f0f0f', minHeight: '100vh', padding: '20px 16px', fontFamily: 'Inter, sans-serif', color: '#eee' }}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={onBack} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, color: '#888', fontSize: 20, cursor: 'pointer', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>Historial</h1>
        </div>
        {loading && <div style={{ textAlign: 'center', color: '#555', padding: 40 }}>Cargando...</div>}
        {!loading && sesiones.length === 0 && <div style={{ textAlign: 'center', color: '#555', padding: 40 }}>No hay sesiones guardadas aún</div>}
        {sesiones.map((s) => {
          const COLOR = COLOR_MAP[s.rutina] || '#f97316';
          const isOpen = expandida === s.id;
          const cardioPrevio = s.cardio?.filter((c) => c.momento === 'previo') || [];
          const cardioFinal = s.cardio?.filter((c) => c.momento === 'final') || [];
          return (
            <div key={s.id} style={{ background: '#1a1a1a', borderRadius: 14, marginBottom: 12, overflow: 'hidden', border: `1px solid ${isOpen ? COLOR+'55' : '#2a2a2a'}` }}>
              <button onClick={() => setExpandida(isOpen ? null : s.id)} style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 11, color: COLOR, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>{s.rutina}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{new Date(s.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.nota >= 8 ? '#22c55e' : s.nota >= 6 ? COLOR : '#ef4444' }}>{s.nota}<span style={{ fontSize: 12 }}>/10</span></div>
                  <div style={{ color: '#444', fontSize: 18 }}>{isOpen ? '▲' : '▼'}</div>
                </div>
              </button>
              {isOpen && (
                <div style={{ padding: '0 16px 16px' }}>
                  {cardioPrevio.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Cardio previo</div>
                      {cardioPrevio.map((c, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#aaa', padding: '3px 0' }}><span>{c.tipo}</span><span style={{ color: '#666' }}>{c.cantidad} {c.unidad} · {c.intensidad}</span></div>)}
                    </div>
                  )}
                  {s.ejercicios?.map((ej) => (
                    <div key={ej.id} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: COLOR, marginBottom: 4 }}>{ej.nombre}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                        {ej.series?.sort((a,b) => a.numero_serie - b.numero_serie).map((sr) => (
                          <div key={sr.id} style={{ background: '#111', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: '#555', marginBottom: 2 }}>S{sr.numero_serie}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: sr.completada ? '#fff' : '#444' }}>{sr.peso ? `${sr.peso}kg` : '—'} × {sr.reps || '—'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {cardioFinal.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 11, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Cardio final</div>
                      {cardioFinal.map((c, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#aaa', padding: '3px 0' }}><span>{c.tipo}</span><span style={{ color: '#666' }}>{c.cantidad} {c.unidad} · {c.intensidad}</span></div>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [rutinaKey, setRutinaKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [cardio, setCardio] = useState(CARDIO_OPTIONS.map((c) => ({ ...c, selected: false, cantidad: '', intensidad: 'Moderada' })));
  const [registros, setRegistros] = useState({});
  const [extras, setExtras] = useState([]);
  const [cardioFinal, setCardioFinal] = useState({ activo: false, tipo: 'Cinta', minutos: '', intensidad: 'Alta' });
  const [resumen, setResumen] = useState(null);
  const [nota, setNota] = useState(null);
  const [showAddExtra, setShowAddExtra] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newCustom, setNewCustom] = useState('');
  const [newSeries, setNewSeries] = useState(3);
  const [ultimaData, setUltimaData] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        let ultimaRutina = null, ultimaFecha = null;
        for (const r of ORDEN_RUTINAS) {
          const data = await getUltimaSesion(r);
          if (data && (!ultimaFecha || data.fecha > ultimaFecha)) { ultimaFecha = data.fecha; ultimaRutina = r; }
        }
        const siguiente = getSiguienteRutina(ultimaRutina);
        setRutinaKey(siguiente);
        const ultima = await getUltimaSesion(siguiente);
        setUltimaData(ultima);
        const ejerciciosBase = RUTINAS[siguiente];
        if (ultima && ultima.ejercicios) {
          const data = {};
          ejerciciosBase.forEach((ej) => {
            const ejAnt = ultima.ejercicios.find((e) => e.nombre === ej.nombre);
            data[ej.nombre] = ej.series.map((s, i) => {
              const srAnt = ejAnt?.series?.find((sr) => sr.numero_serie === i+1);
              return { peso: srAnt?.peso ? String(srAnt.peso) : (s.pesoRef ? String(s.pesoRef) : ''), reps: srAnt?.reps ? String(srAnt.reps) : String(s.repsRef), hecho: false };
            });
          });
          setRegistros(data);
        } else {
          setRegistros(buildRegistros(ejerciciosBase));
        }
      } catch(e) {
        setRutinaKey('Rutina 1');
        setRegistros(buildRegistros(RUTINAS['Rutina 1']));
      }
      setLoading(false);
    }
    init();
  }, []);

  if (screen === 'historial') return <HistorialScreen onBack={() => setScreen('home')} />;
  if (screen === 'home') return <HomeScreen onEntrenar={() => setScreen('workout')} onHistorial={() => setScreen('historial')} rutinaKey={rutinaKey} ultimaData={ultimaData} loading={loading} />;

  const COLOR = rutinaKey ? COLOR_MAP[rutinaKey] : '#f97316';
  const ejerciciosBase = rutinaKey ? RUTINAS[rutinaKey] : [];
  const toggleCardio = (id) => setCardio((p) => p.map((c) => c.id===id ? {...c,selected:!c.selected} : c));
  const updateCardio = (id,k,v) => setCardio((p) => p.map((c) => c.id===id ? {...c,[k]:v} : c));
  const changeBase = (nombre,idx,k,v) => setRegistros((p) => ({...p,[nombre]:p[nombre].map((s,i) => i===idx?{...s,[k]:v}:s)}));
  const toggleBase = (nombre,idx) => setRegistros((p) => ({...p,[nombre]:p[nombre].map((s,i) => i===idx?{...s,hecho:!s.hecho}:s)}));
  const addSerieBase = (nombre) => setRegistros((p) => { const last=p[nombre][p[nombre].length-1]; return {...p,[nombre]:[...p[nombre],{peso:last?.peso||'',reps:last?.reps||'12',hecho:false}]}; });
  const removeSerieBase = (nombre,idx) => setRegistros((p) => ({...p,[nombre]:p[nombre].filter((_,i)=>i!==idx)}));
  const changeExtra = (nombre,idx,k,v) => setExtras((p) => p.map((e) => e.nombre===nombre?{...e,series:e.series.map((s,i)=>i===idx?{...s,[k]:v}:s)}:e));
  const toggleExtra = (nombre,idx) => setExtras((p) => p.map((e) => e.nombre===nombre?{...e,series:e.series.map((s,i)=>i===idx?{...s,hecho:!s.hecho}:s)}:e));
  const addSerieExtra = (nombre) => setExtras((p) => p.map((e) => { if(e.nombre!==nombre)return e; const last=e.series[e.series.length-1]; return {...e,series:[...e.series,{peso:last?.peso||'',reps:last?.reps||'12',hecho:false}]}; }));
  const removeSerieExtra = (nombre,idx) => setExtras((p) => p.map((e) => e.nombre!==nombre?e:{...e,series:e.series.filter((_,i)=>i!==idx)}));
  const removeExtra = (nombre) => setExtras((p) => p.filter((e) => e.nombre!==nombre));
  const addExtra = () => {
    const nombre = newNombre==='__custom__' ? newCustom.trim() : newNombre;
    if(!nombre||extras.find((e)=>e.nombre===nombre))return;
    setExtras((p)=>[...p,{nombre,series:Array.from({length:newSeries},()=>({peso:'',reps:'12',hecho:false}))}]);
    setShowAddExtra(false); setNewNombre(''); setNewCustom(''); setNewSeries(3);
  };
  const calcNota = () => {
    let tot=0,comp=0,mej=0;
    ejerciciosBase.forEach((ej) => { registros[ej.nombre]?.forEach((reg,i) => { tot++; if(reg.hecho)comp++; const ref=ej.series[i]?(ej.series[i].pesoRef||0)*ej.series[i].repsRef:0; if((parseFloat(reg.peso)||0)*(parseInt(reg.reps)||0)>=ref)mej++; }); });
    extras.forEach((ex) => ex.series.forEach((s) => { tot++; if(s.hecho){comp++;mej++;} }));
    return Math.min(10,Math.round(((comp/tot)*7+(mej/tot)*3)*10)/10);
  };
  const generarResumen = () => { const n=calcNota(); setNota(n); setResumen({reg:registros,ext:extras,cf:cardioFinal,cv:cardio.filter((c)=>c.selected)}); };
  const guardar = async () => {
    setGuardando(true);
    try {
      const cardioData = [];
      cardio.filter((c)=>c.selected).forEach((c) => { cardioData.push({momento:'previo',tipo:c.label,cantidad:parseFloat(c.cantidad)||null,unidad:c.unit,intensidad:c.intensidad}); });
      if(cardioFinal.activo&&cardioFinal.minutos) cardioData.push({momento:'final',tipo:cardioFinal.tipo,cantidad:parseFloat(cardioFinal.minutos),unidad:'min',intensidad:cardioFinal.intensidad});
      const ejerciciosData = [];
      ejerciciosBase.forEach((ej) => { ejerciciosData.push({nombre:ej.nombre,esExtra:false,series:registros[ej.nombre]||[]}); });
      extras.forEach((ex) => { ejerciciosData.push({nombre:ex.nombre,esExtra:true,series:ex.series}); });
      await guardarSesion({fecha:new Date().toISOString().split('T')[0],rutina:rutinaKey,nota,cardio:cardioData,ejercicios:ejerciciosData});
      setGuardado(true);
    } catch(e) { alert('Error al guardar.'); }
    setGuardando(false);
  };
  const cardioSel = cardio.filter((c)=>c.selected);
  const totalHecho = Object.values(registros).flat().filter((s)=>s.hecho).length+extras.flatMap((e)=>e.series).filter((s)=>s.hecho).length;
  const totalSeries = Object.values(registros).flat().length+extras.flatMap((e)=>e.series).length;

  return (
    <div style={{ fontFamily:'Inter, sans-serif', background:'#0f0f0f', minHeight:'100vh', padding:'20px 16px', color:'#eee' }}>
      <div style={{ maxWidth:500, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <button onClick={()=>setScreen('home')} style={{ background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:10, color:'#888', fontSize:20, cursor:'pointer', width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>←</button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color:COLOR, fontWeight:700, letterSpacing:2, textTransform:'uppercase' }}>{rutinaKey}</div>
            <div style={{ fontSize:17, fontWeight:800, color:'#fff' }}>{rutinaKey==='Rutina 1'?'Pierna + Espalda 🦵':rutinaKey==='Rutina 2'?'Hombros + Bíceps 💪':'Pecho + Espalda alta 🏋️'}</div>
          </div>
          <div style={{ fontSize:13, color:'#555' }}>{totalHecho}/{totalSeries}</div>
        </div>
        <div style={{ height:5, background:'#222', borderRadius:99, marginBottom:20, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${totalSeries>0?(totalHecho/totalSeries)*100:0}%`, background:`linear-gradient(90deg,${COLOR},${COLOR}aa)`, borderRadius:99, transition:'width 0.4s' }}/>
        </div>
        <Block title="Cardio previo" sub="— opcional">
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
            {CARDIO_OPTIONS.map((c)=>{const sel=cardio.find((x)=>x.id===c.id).selected;return <Pill key={c.id} label={`${c.icon} ${c.label}`} active={sel} color={COLOR} onClick={()=>toggleCardio(c.id)}/>;  })}
          </div>
          {cardioSel.length===0&&<div style={{fontSize:13,color:'#444',textAlign:'center'}}>Selecciona uno o varios</div>}
          {cardioSel.map((c)=>(
            <div key={c.id} style={{background:'#111',borderRadius:10,padding:'12px 14px',marginBottom:10,border:'1px solid #222'}}>
              <div style={{fontSize:13,fontWeight:700,color:COLOR,marginBottom:10}}>{c.icon} {c.label}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div><Lbl>{c.unit==='km'?'Distancia (km)':'Tiempo (min)'}</Lbl><input type="number" placeholder={c.unit==='km'?'3':'10'} value={c.cantidad} onChange={(e)=>updateCardio(c.id,'cantidad',e.target.value)} style={{...inp(false),padding:'8px'}}/></div>
                <div><Lbl>Intensidad</Lbl><div style={{display:'flex',gap:4}}>{INTENSIDAD.map((n)=><Pill key={n} label={n} active={c.intensidad===n} color={COLOR} small onClick={()=>updateCardio(c.id,'intensidad',n)}/>)}</div></div>
              </div>
            </div>
          ))}
        </Block>
        {ejerciciosBase.map((ej)=>(
          <EjCard key={ej.nombre} nombre={ej.nombre} seriesRef={ej.series} rows={registros[ej.nombre]||[]} color={COLOR}
            onChange={(i,k,v)=>changeBase(ej.nombre,i,k,v)} onToggle={(i)=>toggleBase(ej.nombre,i)}
            onAddSerie={()=>addSerieBase(ej.nombre)} onRemoveSerie={(i)=>removeSerieBase(ej.nombre,i)}/>
        ))}
        {extras.map((ex)=>(
          <EjCard key={ex.nombre} nombre={ex.nombre} extra seriesRef={[]} rows={ex.series} color={COLOR}
            onChange={(i,k,v)=>changeExtra(ex.nombre,i,k,v)} onToggle={(i)=>toggleExtra(ex.nombre,i)}
            onAddSerie={()=>addSerieExtra(ex.nombre)} onRemoveSerie={(i)=>removeSerieExtra(ex.nombre,i)}
            onRemoveEj={()=>removeExtra(ex.nombre)}/>
        ))}
        {!showAddExtra ? (
          <button onClick={()=>setShowAddExtra(true)} style={{width:'100%',padding:'13px',background:'#1a1a1a',border:`1px dashed ${COLOR}55`,borderRadius:14,color:COLOR,fontSize:14,fontWeight:700,cursor:'pointer',marginBottom:16}}>+ Añadir ejercicio extra</button>
        ) : (
          <div style={{background:'#1a1a1a',borderRadius:14,padding:16,border:`1px solid ${COLOR}55`,marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700,color:'#fff',marginBottom:12}}>Añadir ejercicio extra</div>
            <Lbl>Seleccionar</Lbl>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:10}}>
              {EJERCICIOS_CONOCIDOS.filter((n)=>!ejerciciosBase.find((e)=>e.nombre===n)&&!extras.find((e)=>e.nombre===n)).map((n)=>(
                <Pill key={n} label={n} active={newNombre===n} color={COLOR} onClick={()=>setNewNombre(n)}/>
              ))}
              <Pill label="✏️ Nuevo" active={newNombre==='__custom__'} color="#f97316" onClick={()=>setNewNombre('__custom__')}/>
            </div>
            {newNombre==='__custom__'&&<input type="text" placeholder="Nombre del ejercicio" value={newCustom} onChange={(e)=>setNewCustom(e.target.value)} style={{...inp(false),padding:'9px',marginBottom:10,textAlign:'left'}}/>}
            <Lbl>Nº de series</Lbl>
            <div style={{display:'flex',gap:8,marginBottom:14}}>
              {[2,3,4,5].map((n)=><button key={n} onClick={()=>setNewSeries(n)} style={{flex:1,padding:'8px',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer',background:newSeries===n?COLOR:'#222',border:`1px solid ${newSeries===n?COLOR:'#333'}`,color:newSeries===n?'#fff':'#888'}}>{n}</button>)}
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>{setShowAddExtra(false);setNewNombre('');setNewCustom('');}} style={{flex:1,padding:'10px',background:'#222',border:'1px solid #333',borderRadius:10,color:'#888',fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancelar</button>
              <button onClick={addExtra} style={{flex:2,padding:'10px',background:COLOR,border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Añadir</button>
            </div>
          </div>
        )}
        <Block title="Cardio final" action={<Pill label={cardioFinal.activo?'Activado ✓':'Añadir'} active={cardioFinal.activo} color={COLOR} onClick={()=>setCardioFinal((p)=>({...p,activo:!p.activo}))}/>}>
          {cardioFinal.activo&&(
            <>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                <div><Lbl>Tipo</Lbl><select value={cardioFinal.tipo} onChange={(e)=>setCardioFinal((p)=>({...p,tipo:e.target.value}))} style={{...inp(false),padding:'8px'}}>{['Cinta','Escalera','Bici','Elíptica','Remo'].map((t)=><option key={t}>{t}</option>)}</select></div>
                <div><Lbl>Tiempo (min)</Lbl><input type="number" placeholder="12" value={cardioFinal.minutos} onChange={(e)=>setCardioFinal((p)=>({...p,minutos:e.target.value}))} style={{...inp(false),padding:'8px'}}/></div>
              </div>
              <Lbl>Intensidad</Lbl>
              <div style={{display:'flex',gap:6}}>{INTENSIDAD.map((n)=><Pill key={n} label={n} active={cardioFinal.intensidad===n} color={COLOR} onClick={()=>setCardioFinal((p)=>({...p,intensidad:n}))}/>)}</div>
            </>
          )}
        </Block>
        {!resumen&&<button onClick={generarResumen} style={{width:'100%',padding:'16px',background:`linear-gradient(135deg,${COLOR},${COLOR}aa)`,border:'none',borderRadius:14,color:'#fff',fontSize:16,fontWeight:800,cursor:'pointer',marginBottom:20}}>Generar resumen 📊</button>}
        {resumen&&(
          <div style={{background:'#1a1a1a',borderRadius:14,padding:20,border:'1px solid #2a2a2a',marginBottom:20}}>
            <h2 style={{fontSize:18,fontWeight:800,color:'#fff',marginTop:0,marginBottom:16}}>Resumen</h2>
            {resumen.cv.length>0&&(
              <div style={{marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:700,color:COLOR,marginBottom:8}}>Cardio previo</div>
                {resumen.cv.map((c)=><div key={c.id} style={{display:'flex',justifyContent:'space-between',fontSize:13,color:'#ccc',padding:'4px 0',borderBottom:'1px solid #222'}}><span>{c.icon} {c.label}</span><span style={{color:'#888'}}>{c.cantidad||'—'} {c.unit} · {c.intensidad}</span></div>)}
              </div>
            )}
            {ejerciciosBase.map((ej)=><ResumenEj key={ej.nombre} nombre={ej.nombre} rows={resumen.reg[ej.nombre]||[]} color={COLOR}/>)}
            {resumen.ext.map((ex)=><ResumenEj key={ex.nombre} nombre={`${ex.nombre} ✦`} rows={ex.series} color={COLOR}/>)}
            {resumen.cf.activo&&resumen.cf.minutos&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:700,color:COLOR,marginBottom:6}}>Cardio final</div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:'#ccc'}}><span>🏃 {resumen.cf.tipo}</span><span style={{color:'#888'}}>{resumen.cf.minutos} min · {resumen.cf.intensidad}</span></div>
              </div>
            )}
            <div style={{textAlign:'center',background:'#111',borderRadius:12,padding:16,marginBottom:16}}>
              <div style={{fontSize:11,color:'#555',marginBottom:4,textTransform:'uppercase',letterSpacing:1}}>Puntuación</div>
              <div style={{fontSize:48,fontWeight:900,color:nota>=8?'#22c55e':nota>=6?COLOR:'#ef4444'}}>{nota}<span style={{fontSize:20}}>/10</span></div>
              <div style={{fontSize:13,color:'#888',marginTop:4}}>{nota>=9?'¡Sesión brutal! 🔥':nota>=7?'Buen trabajo 💪':nota>=5?'Sesión correcta ⚡':'Día flojo 😤'}</div>
            </div>
            {!guardado?(
              <button onClick={guardar} disabled={guardando} style={{width:'100%',padding:'14px',background:guardando?'#333':'#22c55e',border:'none',borderRadius:12,color:'#fff',fontSize:15,fontWeight:800,cursor:guardando?'default':'pointer'}}>{guardando?'Guardando...':'💾 Guardar sesión'}</button>
            ):(
              <div style={{textAlign:'center',padding:'14px',background:'#22c55e22',border:'1px solid #22c55e',borderRadius:12,color:'#22c55e',fontSize:14,fontWeight:700}}>✅ Sesión guardada — <span style={{cursor:'pointer',textDecoration:'underline'}} onClick={()=>setScreen('home')}>Volver al inicio</span></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
