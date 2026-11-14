import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Heart,
  ShieldAlert,
  Radio,
  Thermometer,
  Moon,
  Wind,
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Cpu,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import snapshotData from './data/telemetrySnapshot.json';
import BodySystemMap from './components/BodySystemMap';
import SelfCareHub from './components/SelfCareHub';

const API_BASE = 'http://localhost:8000';

// Local ML-equivalent scoring engine so the app works 100% standalone or with FastAPI
function evaluateVitalsLocal(v) {
  const penalty =
    Math.max(0, (v.heart_rate_bpm - 85) * 0.6) +
    Math.max(0, (55 - v.hrv_ms) * 0.7) +
    Math.max(0, (96.5 - v.spo2_pct) * 6.0) +
    Math.max(0, (v.core_temp_c - 37.4) * 18.0) +
    Math.max(0, (v.radiation_msv_hr - 1.2) * 6.5) +
    Math.max(0, (6.5 - v.sleep_hours) * 5.5);

  const score = Math.max(12, Math.min(100, Math.round(100 - penalty)));
  const recs = [];
  const affected = [];

  if (v.heart_rate_bpm > 95 || v.hrv_ms < 42) {
    affected.push('cardiovascular');
    recs.push({
      severity: v.heart_rate_bpm > 115 ? 'critical' : 'warning',
      system: 'Cardiovascular',
      title: 'Elevated Cardiac Strain / Low HRV',
      action: 'Initiate 15-min guided paced breathing protocol & hydrate and recheck; contact the flight surgeon if it persists.'
    });
  }
  if (v.radiation_msv_hr > 1.5) {
    affected.push('radiation');
    recs.push({
      severity: 'critical',
      system: 'Radiation Shielding',
      title: 'Solar Particle Event (SPE) Flux Spike',
      action: 'Relocate crew immediately to water-wall storm shelter module; initiate radioprotective protocol.'
    });
  }
  if (v.sleep_hours < 5.8) {
    affected.push('circadian');
    recs.push({
      severity: 'warning',
      system: 'Circadian & Neurocognitive',
      title: 'Cumulative Sleep Debt Detected',
      action: 'Shift cabin LED lighting to warm 2700K spectrum; defer high-precision robotic arm operations.'
    });
  }
  if (v.spo2_pct < 95.5) {
    affected.push('respiratory');
    recs.push({
      severity: v.spo2_pct < 94.0 ? 'critical' : 'warning',
      system: 'Respiratory & ECLSS',
      title: 'Hypoxic Drift / Elevated Suit CO2',
      action: 'Inspect CO2 scrubber cartridge and cross-verify pulse oximetry sensor calibration.'
    });
  }
  if (v.core_temp_c > 37.6) {
    affected.push('thermoregulation');
    recs.push({
      severity: 'warning',
      system: 'Thermoregulation',
      title: 'Elevated Core Thermal Load',
      action: 'Set Liquid Cooling and Ventilation Garment (LCVG) loop to HIGH flow.'
    });
  }

  if (recs.length === 0) {
    recs.push({
      severity: 'optimal',
      system: 'All Systems Nominal',
      title: 'Crew Member Cleared for Nominal Ops & EVA',
      action: 'Maintain standard 90-min ARED resistance countermeasure routine and hydration baseline.'
    });
  }

  const status = score < 55 ? 'CRITICAL' : score < 75 ? 'WARNING' : 'OPTIMAL';
  return { readiness_score: score, status, affected_systems: affected, recommendations: recs };
}

export default function App() {
  const crewIds = Object.keys(snapshotData);
  const [selectedId, setSelectedId] = useState(crewIds[0]);
  const [viewMode, setViewMode] = useState('surgeon'); // 'surgeon' | 'crew'
  const [isLive, setIsLive] = useState(true);
  const [activeEvent, setActiveEvent] = useState(null); // null | 'solar_flare' | 'eva_strain' | 'sleep_debt'
  const [backendConnected, setBackendConnected] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('ap_theme') || 'dark');
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('ap_theme', theme); }, [theme]);

  const selectedCrew = snapshotData[selectedId];
  const [history, setHistory] = useState(selectedCrew.history);

  // Check if FastAPI backend is reachable
  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((res) => res.ok && setBackendConnected(true))
      .catch(() => setBackendConnected(false));
  }, []);

  // Reset history when switching astronaut
  useEffect(() => {
    setHistory(snapshotData[selectedId].history);
    setActiveEvent(null);
  }, [selectedId]);

  // Real-time simulated telemetry stream tick every 2.5 seconds
  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      setHistory((prev) => {
        const last = prev[prev.length - 1];
        const jitter = (range) => (Math.random() - 0.5) * range;

        let targetHr = selectedCrew.base_hr + jitter(5);
        let targetHrv = selectedCrew.base_hrv + jitter(6);
        let targetSpo2 = selectedCrew.base_spo2 + jitter(0.4);
        let targetTemp = selectedCrew.base_temp + jitter(0.12);
        let targetRad = 0.52 + Math.abs(jitter(0.15));
        let targetSleep = 7.1 + jitter(0.3);

        if (activeEvent === 'solar_flare') {
          targetRad = 4.35 + Math.abs(jitter(0.4));
          targetHr += 18;
          targetHrv -= 20;
        } else if (activeEvent === 'eva_strain') {
          targetHr = 128 + jitter(8);
          targetHrv = 31 + jitter(4);
          targetSpo2 = 94.3 + jitter(0.5);
          targetTemp = 38.1 + jitter(0.15);
        } else if (activeEvent === 'sleep_debt') {
          targetSleep = 4.4;
          targetHr += 14;
          targetHrv = 38 + jitter(4);
        }

        const nextPoint = {
          mission_day: last.mission_day,
          hour: (last.hour + 1) % 24,
          heart_rate_bpm: Number(targetHr.toFixed(1)),
          hrv_ms: Number(Math.max(15, targetHrv).toFixed(1)),
          spo2_pct: Number(Math.min(100, Math.max(90, targetSpo2)).toFixed(1)),
          core_temp_c: Number(targetTemp.toFixed(2)),
          radiation_msv_hr: Number(targetRad.toFixed(2)),
          cumulative_rad_msv: Number((last.cumulative_rad_msv + targetRad * 0.05).toFixed(2)),
          sleep_hours: Number(targetSleep.toFixed(1)),
        };
        const evalRes = evaluateVitalsLocal(nextPoint);
        nextPoint.readiness_score = evalRes.readiness_score;

        return [...prev.slice(1), nextPoint];
      });
    }, 2500);

    return () => clearInterval(timer);
  }, [isLive, activeEvent, selectedCrew]);

  const currentVitals = history[history.length - 1];
  const aiAnalysis = useMemo(() => evaluateVitalsLocal(currentVitals), [currentVitals]);

  const triggerScenario = (scenario) => {
    setActiveEvent(scenario);
    setHistory((prev) => {
      const last = prev[prev.length - 1];
      const updated = { ...last };
      if (scenario === 'solar_flare') {
        updated.radiation_msv_hr = 4.42;
        updated.heart_rate_bpm = 84;
        updated.hrv_ms = 46;
      } else if (scenario === 'eva_strain') {
        updated.heart_rate_bpm = 132;
        updated.hrv_ms = 29;
        updated.spo2_pct = 94.1;
        updated.core_temp_c = 38.2;
      } else if (scenario === 'sleep_debt') {
        updated.sleep_hours = 4.3;
        updated.hrv_ms = 36;
        updated.heart_rate_bpm = 79;
      } else {
        updated.heart_rate_bpm = selectedCrew.base_hr;
        updated.hrv_ms = selectedCrew.base_hrv;
        updated.spo2_pct = selectedCrew.base_spo2;
        updated.core_temp_c = selectedCrew.base_temp;
        updated.radiation_msv_hr = 0.52;
        updated.sleep_hours = 7.2;
      }
      updated.readiness_score = evaluateVitalsLocal(updated).readiness_score;
      return [...prev.slice(0, -1), updated];
    });
  };

  const statusColor =
    aiAnalysis.status === 'CRITICAL'
      ? 'text-rose-400 border-rose-500/40 bg-rose-500/10'
      : aiAnalysis.status === 'WARNING'
      ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
      : 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';

  return (
    <div className="min-h-screen bg-[var(--bg)] text-slate-100 flex flex-col">
      {/* Top Mission Control Bar */}
      <header className="border-b border-slate-800/90 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="w-full px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight text-white">
                  ASTROPULSE <span className="text-rose-500 font-mono text-sm">// ARTEMIS-IV</span>
                </h1>
                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {backendConnected ? 'FastAPI ML Live' : 'Edge AI Telemetry'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Autonomous Crew Biometric & Predictive Readiness Monitor
              </p>
            </div>
          </div>

          {/* Interactive Scenario Triggers for Live Demo */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Simulate Event:</span>
            <button
              onClick={() => triggerScenario('solar_flare')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition ${
                activeEvent === 'solar_flare'
                  ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-rose-300 border-rose-500/30'
              }`}
            >
              <Radio className="w-3.5 h-3.5" /> Solar Flare
            </button>
            <button
              onClick={() => triggerScenario('eva_strain')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition ${
                activeEvent === 'eva_strain'
                  ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/30'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> EVA Exhaustion
            </button>
            <button
              onClick={() => triggerScenario('sleep_debt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition ${
                activeEvent === 'sleep_debt'
                  ? 'bg-indigo-600 text-white border-indigo-400'
                  : 'bg-slate-900 hover:bg-slate-800 text-indigo-300 border-indigo-500/30'
              }`}
            >
              <Moon className="w-3.5 h-3.5" /> Circadian Drift
            </button>
            {activeEvent && (
              <button
                onClick={() => triggerScenario(null)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Nominal
              </button>
            )}
          </div>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
          >
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          {/* Role Toggle */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('surgeon')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                viewMode === 'surgeon' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Flight Surgeon
            </button>
            <button
              onClick={() => setViewMode('crew')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                viewMode === 'crew' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Crew Tablet
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-6 lg:px-8 py-6 flex-1 space-y-6">
        {/* Crew Selector Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {crewIds.map((id) => {
            const member = snapshotData[id];
            const isSelected = id === selectedId;
            const latestMember = isSelected
              ? currentVitals
              : member.history[member.history.length - 1];
            const memberScore = isSelected
              ? aiAnalysis.readiness_score
              : latestMember.readiness_score;

            return (
              <button
                key={id}
                onClick={() => setSelectedId(id)}
                className={`text-left p-3.5 rounded-2xl border transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-900/95 border-cyan-400/60 shadow-[0_0_20px_rgba(59,130,246,0.12)]'
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-cyan-400">{member.id}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="font-semibold text-sm text-white mt-0.5">{member.name}</div>
                  <div className="text-xs text-slate-400">{member.role}</div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-xl font-bold font-mono ${
                      memberScore < 55
                        ? 'text-rose-400'
                        : memberScore < 75
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {memberScore}%
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Readiness</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Primary Telemetry & AI Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Digital Twin Body Map (4 cols) */}
          <div className="lg:col-span-4">
            <BodySystemMap
              affectedSystems={aiAnalysis.affected_systems}
              vitals={currentVitals}
            />
          </div>

          {/* Middle & Right Columns: Vitals KPIs, Live Charts, & AI Countermeasures (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Readiness Banner */}
            <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${statusColor}`}>
              <div className="flex items-center gap-3">
                <Cpu className="w-6 h-6 shrink-0" />
                <div>
                  <div className="text-xs uppercase tracking-wider font-semibold opacity-80">
                    ML Anomaly & Mission Readiness Assessment
                  </div>
                  <div className="text-base font-bold">
                    {selectedCrew.name} — Status: {aiAnalysis.status} ({aiAnalysis.readiness_score}/100)
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLive(!isLive)}
                  className="px-3 py-1 rounded-lg text-xs font-mono bg-slate-950/50 border border-current/30"
                >
                  {isLive ? '● STREAMING LIVE' : '❚❚ PAUSED'}
                </button>
              </div>
            </div>

            {/* 6 Biometric KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <MetricCard
                icon={<Heart className="w-4 h-4 text-rose-400" />}
                label="Heart Rate"
                value={`${currentVitals.heart_rate_bpm}`}
                unit="BPM"
                sub={`HRV: ${currentVitals.hrv_ms} ms`}
                alert={currentVitals.heart_rate_bpm > 95}
              />
              <MetricCard
                icon={<Wind className="w-4 h-4 text-cyan-400" />}
                label="Blood Oxygen (SpO2)"
                value={`${currentVitals.spo2_pct}`}
                unit="%"
                sub="Cabin O2: 21.1%"
                alert={currentVitals.spo2_pct < 95.5}
              />
              <MetricCard
                icon={<Radio className="w-4 h-4 text-amber-400" />}
                label="Radiation Flux"
                value={`${currentVitals.radiation_msv_hr}`}
                unit="mSv/hr"
                sub={`Cumul: ${currentVitals.cumulative_rad_msv} mSv`}
                alert={currentVitals.radiation_msv_hr > 1.5}
              />
              <MetricCard
                icon={<Thermometer className="w-4 h-4 text-orange-400" />}
                label="Core Body Temp"
                value={`${currentVitals.core_temp_c}`}
                unit="°C"
                sub="Suit LCVG: Auto"
                alert={currentVitals.core_temp_c > 37.6}
              />
              <MetricCard
                icon={<Moon className="w-4 h-4 text-indigo-400" />}
                label="Sleep Cycle (24h)"
                value={`${currentVitals.sleep_hours}`}
                unit="hrs"
                sub="REM Efficiency: 84%"
                alert={currentVitals.sleep_hours < 5.8}
              />
              <MetricCard
                icon={<UserCheck className="w-4 h-4 text-emerald-400" />}
                label="EVA Readiness"
                value={`${aiAnalysis.readiness_score}`}
                unit="%"
                sub={aiAnalysis.readiness_score >= 75 ? 'Cleared for EVA' : 'Hold Recommended'}
                alert={aiAnalysis.readiness_score < 75}
              />
            </div>

            {/* Real-Time Telemetry Trend Chart (Shown in Flight Surgeon Mode) */}
            {viewMode === 'surgeon' && (
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Live Telemetry Stream — Heart Rate (BPM) & Readiness Index
                  </span>
                  <span className="text-xs font-mono text-slate-400">Mission Day {currentVitals.mission_day}</span>
                </div>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="readyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" />
                      <XAxis dataKey="hour" stroke="var(--muted)" fontSize={11} tickFormatter={(h) => `${h}:00`} />
                      <YAxis stroke="var(--muted)" fontSize={11} domain={[30, 150]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--panel)', borderColor: 'var(--line2)', borderRadius: '10px', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="heart_rate_bpm" name="Heart Rate (BPM)" stroke="var(--accent)" fill="url(#hrGrad)" strokeWidth={2} />
                      <Area type="monotone" dataKey="readiness_score" name="Readiness Score" stroke="#10b981" fill="url(#readyGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* AI Flight Surgeon Countermeasure Co-Pilot */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Autonomous Countermeasure & Medical Protocol Engine
                </h2>
              </div>

              <div className="space-y-2.5">
                {aiAnalysis.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-start gap-3 ${
                      rec.severity === 'critical'
                        ? 'bg-rose-950/30 border-rose-500/40'
                        : rec.severity === 'warning'
                        ? 'bg-amber-950/30 border-amber-500/40'
                        : 'bg-emerald-950/20 border-emerald-500/30'
                    }`}
                  >
                    {rec.severity === 'optimal' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle
                        className={`w-5 h-5 shrink-0 mt-0.5 ${
                          rec.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{rec.title}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {rec.system}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{rec.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <SelfCareHub
          key={selectedId}
          history={history}
          baseline={snapshotData[selectedId].history.slice(0, 12)}
          apiBase={API_BASE}
          onCheckIn={(p) => {
            setIsLive(false);
            setHistory((prev) => {
              const u = { ...prev[prev.length - 1], ...p };
              u.readiness_score = evaluateVitalsLocal(u).readiness_score;
              return [...prev.slice(0, -1), u];
            });
          }}
        />
      </main>
    </div>
  );
}

function MetricCard({ icon, label, value, unit, sub, alert }) {
  return (
    <div
      className={`p-3.5 rounded-2xl border transition ${
        alert
          ? 'bg-rose-950/25 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.12)]'
          : 'bg-slate-900/70 border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        {icon}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`text-2xl font-bold font-mono ${alert ? 'text-rose-300' : 'text-white'}`}>
          {value}
        </span>
        <span className="text-xs text-slate-400">{unit}</span>
      </div>
      <div className="text-[11px] text-slate-500 mt-1 font-mono">{sub}</div>
    </div>
  );
}
