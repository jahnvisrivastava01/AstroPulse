import React, { useState, useMemo, useEffect } from 'react';

const M = {
  heart_rate_bpm: { l: 'Heart rate', u: 'bpm', hi: 95, p: 'Rest, hydrate, recheck in 15 min.' },
  hrv_ms: { l: 'HRV', u: 'ms', lo: 42, p: 'Do paced breathing and recheck after rest.' },
  spo2_pct: { l: 'SpO2', u: '%', lo: 95.5, p: 'Check cabin CO2/ventilation; recheck with the oximeter.' },
  core_temp_c: { l: 'Core temp', u: 'C', hi: 37.6, p: 'Check cabin temperature and cooling; fever may signal infection.' },
  sleep_hours: { l: 'Sleep', u: 'h', lo: 5.8, p: 'Protect your sleep window and dim lights early.' },
  radiation_msv_hr: { l: 'Radiation', u: 'mSv/h', hi: 1.5, p: 'Follow the mission radiation protocol and notify the flight surgeon.' },
};
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
const slope = (a) => { const n = a.length, m = (n - 1) / 2, y = mean(a); let u = 0, d = 0; a.forEach((v, i) => { u += (i - m) * (v - y); d += (i - m) ** 2; }); return d ? u / d : 0; };

// Personal baseline = early mission record; drift = recent mean >= 2 SD from the astronaut's own baseline.
const HZ = {
  radiation: ['Space radiation', ['radiation_msv_hr']],
  isolation: ['Isolation & confinement', ['sleep_hours', 'hrv_ms']],
  distance: ['Distance from Earth', []],
  gravity: ['Altered gravity', ['heart_rate_bpm', 'hrv_ms']],
  closed: ['Hostile closed environment', ['spo2_pct', 'core_temp_c']],
};
// 0-100 risk per NASA HRP hazard from drift vs baseline + limit breaches (distance scales with comm delay).
function hazards(A, mood, delay) {
  const s = (k) => Math.min(100, Math.min(Math.abs(A.out[k].z), 4) * 20 + (A.out[k].breach ? 35 : 0));
  const o = {};
  for (const h in HZ) {
    const v = HZ[h][1].map(s);
    if (h === 'isolation' && mood) v.push((5 - mood) * 20);
    const raw = h === 'distance' ? delay * 3 + A.crit * 20 : v.reduce((a, b) => a + b, 0) / v.length;
    const sc = Math.min(100, Math.round(raw));
    o[h] = { n: HZ[h][0], sc, lvl: sc < 30 ? 0 : sc < 60 ? 1 : 2 };
  }
  return o;
}
function analyze(base, hist) {
  const out = {}; let crit = 0;
  for (const k in M) {
    const b = base.map((x) => x[k]), m = mean(b), s = Math.max(sd(b), Math.abs(m) * 0.02);
    const last = hist[hist.length - 1][k], z = (mean(hist.slice(-3).map((x) => x[k])) - m) / s, sl = slope(hist.slice(-8).map((x) => x[k]));
    const { hi, lo } = M[k], breach = (hi !== undefined && last > hi) || (lo !== undefined && last < lo);
    let eta = null;
    if (hi !== undefined && sl > 0 && last <= hi) eta = (hi - last) / sl;
    if (lo !== undefined && sl < 0 && last >= lo) eta = (last - lo) / -sl;
    if (breach) crit++;
    out[k] = { last, z, drift: Math.abs(z) >= 2, breach, eta: eta !== null && eta <= 48 ? eta : null };
  }
  return { out, crit };
}
const summarize = (A, mood) => Object.keys(M).map((k) => `${M[k].l} ${A.out[k].last}${M[k].u}${A.out[k].breach ? ' OUT OF RANGE' : ''}, ${A.out[k].z.toFixed(1)} SD vs personal baseline`).join('; ') + (mood ? `; mood ${mood}/5` : '');
function localAnswer(A) {
  const ks = Object.keys(M).filter((k) => A.out[k].breach || A.out[k].drift);
  if (!ks.length) return 'All readings are close to your personal baseline. Keep your exercise, sleep and hydration routine.';
  return (A.crit ? 'CONTACT FLIGHT SURGEON.\n' : '') + ks.map((k) => `- ${M[k].l}: ${A.out[k].last} ${M[k].u} (${A.out[k].breach ? 'out of range' : 'drifting'}, ${A.out[k].z.toFixed(1)} SD from your baseline). ${M[k].p}`).join('\n');
}
const post = (u, b) => fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
const card = 'rounded-2xl border border-slate-800 bg-slate-900/60 p-4';

export default function SelfCareHub({ history, baseline, apiBase, onCheckIn }) {
  // Adaptive baseline: starts from the early-mission record and absorbs only healthy readings (readiness >= 75),
  // so real drift stays visible. Recalibrate/reset are explicit crew actions.
  const [pool, setPool] = useState(baseline);
  useEffect(() => { const l = history[history.length - 1]; if ((l.readiness_score ?? 0) >= 75) setPool((p) => [...p, l].slice(-60)); }, [history]);
  const A = useMemo(() => analyze(pool, history), [pool, history]);
  const [online, setOnline] = useState(navigator.onLine), [now, setNow] = useState(Date.now());
  const [delay, setDelay] = useState(12), [mood, setMood] = useState(null);
  const [msgs, setMsgs] = useState(() => { try { return JSON.parse(localStorage.getItem('ap_msgs')) || []; } catch { return []; } });
  const [chat, setChat] = useState([]), [q, setQ] = useState(''), [busy, setBusy] = useState(false);
  const [voiceNote, setVoiceNote] = useState(''), [listening, setListening] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000), on = () => setOnline(true), off = () => setOnline(false);
    addEventListener('online', on); addEventListener('offline', off);
    return () => { clearInterval(t); removeEventListener('online', on); removeEventListener('offline', off); };
  }, []);
  useEffect(() => { localStorage.setItem('ap_msgs', JSON.stringify(msgs)); }, [msgs]);
  useEffect(() => { // flush queued reports when the link returns
    if (!online) return;
    msgs.filter((m) => !m.sync).forEach((m) => post(`${apiBase}/api/ground`, { id: m.id, text: m.text, delay_min: m.delay })
      .then(() => setMsgs((x) => x.map((y) => (y.id === m.id ? { ...y, sync: true } : y)))).catch(() => {}));
  }, [online, msgs.length]);

  const toggleVoiceLog = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceNote('Speech recognition unavailable in this browser — type note manually.');
      return;
    }
    if (listening) { setListening(false); return; }
    const rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.interimResults = false;
    setListening(true);
    rec.onresult = (ev) => {
      const transcript = ev.results[0][0].transcript;
      setVoiceNote((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  const submit = (e) => {
    e.preventDefault(); const p = {};
    new FormData(e.target).forEach((v, k) => { if (v !== '' && k !== 'mood') p[k] = +v; else if (k === 'mood' && v !== '') setMood(+v); });
    onCheckIn(p); e.target.reset();
  };
  const ask = async (t) => {
    if (!t.trim()) return; setChat((c) => [...c, { r: 'u', t }]); setQ(''); setBusy(true);
    let a = null, src = 'on-device';
    if (online) try { const r = await post(`${apiBase}/api/assistant`, { question: t, summary: summarize(A, mood), crit: A.crit }); a = (await r.json()).answer; if (a) src = 'Gemini + guardrails'; } catch {}
    setChat((c) => [...c, { r: 'a', t: a || localAnswer(A), src }]); setBusy(false);
  };
  const report = () => setMsgs((m) => [{ id: String(Date.now()), text: `Crew health report: ${summarize(A, mood)}${voiceNote ? ` | Voice Log: ${voiceNote}` : ''}`, delay, sent: Date.now(), sync: false }, ...m]);
  const eta = (m) => { const s = Math.max(0, Math.ceil((m.sent + m.delay * 6e4 - now) / 1000)); return s ? `In transit, ETA ${Math.floor(s / 60)}m ${s % 60}s` : 'Delivered to ground'; };
  const HZS = hazards(A, mood, delay);
  const flags = Object.keys(M).filter((k) => A.out[k].breach || A.out[k].drift || A.out[k].eta !== null);
  const inp = 'bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-sm w-full';

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
      <div className="lg:col-span-12">
        <h2 className="font-semibold text-white mb-2">NASA HRP hazard risk <span className="text-rose-500 text-xs font-normal">(0-100)</span></h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.values(HZS).map((h) => (
            <div key={h.n} className={card}>
              <div className="text-xs text-slate-400">{h.n}</div>
              <div className="text-2xl font-semibold text-white">{h.sc}<span className="text-xs text-slate-500"> /100</span></div>
              <div className="h-1.5 rounded bg-slate-800 overflow-hidden mt-1"><div className={`h-full ${['bg-emerald-400', 'bg-amber-400', 'bg-rose-500'][h.lvl]}`} style={{ width: `${h.sc}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="lg:col-span-7 space-y-6">
        <div className={card}>
          <h2 className="font-semibold text-white">Early warnings vs your personal baseline</h2>
          <p className="text-xs text-slate-400 mb-1">Drift of 2+ SD from your own baseline is flagged even inside textbook ranges.</p>
          <div className="text-xs text-slate-500 mb-3 flex flex-wrap items-center gap-2">
            Baseline: {pool.length} healthy readings.
            <button onClick={() => setPool(history.slice(-12))} className="border border-slate-700 rounded-full px-2 py-0.5 text-slate-300">Recalibrate to now</button>
            <button onClick={() => setPool(baseline)} className="border border-slate-700 rounded-full px-2 py-0.5 text-slate-300">Reset to mission baseline</button>
            <span>Recalibrate only when you feel well or the flight surgeon agrees.</span>
          </div>
          {flags.length ? flags.map((k) => (
            <div key={k} className="py-2 border-b border-slate-800 last:border-0 text-sm">
              <span className={`text-[10px] px-2 py-0.5 rounded-full mr-2 ${A.out[k].breach ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>{A.out[k].breach ? 'Attention' : 'Watch'}</span>
              <b>{M[k].l} {A.out[k].last} {M[k].u}</b>
              <span className="text-slate-400"> {A.out[k].z.toFixed(1)} SD from baseline{A.out[k].eta !== null && !A.out[k].breach ? `, may cross its limit in ~${A.out[k].eta.toFixed(0)} h` : ''}</span>
              <div className="text-xs text-slate-500">{M[k].p}</div>
            </div>
          )) : <p className="text-sm text-slate-400">No drift detected.</p>}
        </div>
        <div className={card}>
          <h2 className="font-semibold text-white">Crew self check-in</h2>
          <p className="text-xs text-slate-400 mb-3">Enter manual measurements (leave blank to skip). Pauses the simulated stream so your values persist.</p>
          <form onSubmit={submit} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[['heart_rate_bpm', 'Heart rate (bpm)'], ['hrv_ms', 'HRV (ms)'], ['spo2_pct', 'SpO2 (%)'], ['core_temp_c', 'Temp (C)'], ['sleep_hours', 'Sleep (h)'], ['mood', 'Mood (1-5)']].map(([k, l]) => (
              <label key={k} className="text-xs text-slate-400 flex flex-col gap-1">{l}<input name={k} type="number" step="any" className={inp} /></label>
            ))}
            <div className="col-span-2 sm:col-span-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Hands-Free Crew Audio Log (Optional)</span>
                <button
                  type="button"
                  onClick={toggleVoiceLog}
                  className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${
                    listening
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                      : 'border-slate-700 text-cyan-400 hover:border-cyan-500/50'
                  }`}
                >
                  {listening ? '● Listening...' : '🎙 Voice Check-In'}
                </button>
              </div>
              <input
                value={voiceNote}
                onChange={(e) => setVoiceNote(e.target.value)}
                placeholder="Speak or type subjective symptoms / EVA notes..."
                className={inp}
              />
            </div>
            <button className="col-span-2 sm:col-span-3 bg-cyan-500 text-slate-950 font-semibold rounded-lg py-2 text-sm">Save check-in</button>
          </form>
        </div>
      </div>
      <div className="lg:col-span-5 space-y-6">
        <div className={card}>
          <h2 className="font-semibold text-white">On-board assistant</h2>
          <div className="my-3 space-y-2 max-h-72 overflow-auto min-h-[120px]">
            {chat.map((m, i) => (
              <div key={i} className={`text-sm whitespace-pre-wrap rounded-xl px-3 py-2 max-w-[92%] ${m.r === 'u' ? 'bg-cyan-500 text-slate-950 ml-auto' : 'bg-slate-950 border border-slate-800'}`}>
                {m.t}{m.src && <div className="text-[10px] text-slate-500 mt-1">Source: {m.src}</div>}
              </div>
            ))}
            {busy && <div className="text-xs text-slate-500">Thinking...</div>}
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {['What should I do today?', 'Do I need the flight surgeon?'].map((s) => <button key={s} onClick={() => ask(s)} className="text-xs border border-slate-700 rounded-full px-3 py-1 text-slate-300">{s}</button>)}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about your readings" className={inp} />
            <button className="bg-cyan-500 text-slate-950 rounded-lg px-3 text-sm font-semibold">Ask</button>
          </form>
        </div>
        <div className={card}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="font-semibold text-white">Ground link</h2>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${online ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>{online ? 'Online' : 'Offline: autonomous mode'}</span>
          </div>
          <div className="flex gap-2 my-3">
            <select value={delay} onChange={(e) => setDelay(+e.target.value)} className={inp}>
              <option value={0}>Station (about 0 min)</option><option value={4}>Mars close (4 min)</option><option value={12}>Mars average (12 min)</option><option value={24}>Mars far (24 min)</option>
            </select>
            <button onClick={report} className="bg-cyan-500 text-slate-950 rounded-lg px-3 text-sm font-semibold whitespace-nowrap">Send report</button>
          </div>
          {msgs.slice(0, 4).map((m) => <div key={m.id} className="text-xs text-slate-400 py-1 border-b border-slate-800 last:border-0">{new Date(m.sent).toLocaleTimeString()}: {eta(m)}{m.sync ? '' : ' (queued)'}</div>)}
        </div>
      </div>
    </section>
  );
}
