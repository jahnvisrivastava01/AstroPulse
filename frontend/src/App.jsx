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
  Sparkles,
  Lock,
  Unlock,
  Printer,
  ShieldCheck,
  XCircle,
  Info
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
import SurgeonConsole from './components/SurgeonConsole';
import MissionBrief from './components/MissionBrief';

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
  const [viewMode, setViewMode] = useState('crew'); // 'crew' | 'surgeon' | 'about'
  const [isSurgeonUnlocked, setIsSurgeonUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [evaWaivers, setEvaWaivers] = useState({});
  const [dispatchedOrders, setDispatchedOrders] = useState([]);
  const [mlServerPrediction, setMlServerPrediction] = useState(null);
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

  // Sync current vitals with Python FastAPI RandomForest + IsolationForest endpoint when live
  useEffect(() => {
    if (!backendConnected) {
      setMlServerPrediction(null);
      return;
    }
    const latest = history[history.length - 1];
    fetch(`${API_BASE}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        astronaut_id: selectedId,
        heart_rate_bpm: latest.heart_rate_bpm,
        hrv_ms: latest.hrv_ms,
        spo2_pct: latest.spo2_pct,
        core_temp_c: latest.core_temp_c,
        radiation_msv_hr: latest.radiation_msv_hr,
        sleep_hours: latest.sleep_hours,
        cabin_co2_mmhg: latest.cabin_co2_mmhg || 3.8
      })
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setMlServerPrediction(data);
      })
      .catch(() => {});
  }, [backendConnected, history, selectedId]);

  const currentVitals = history[history.length - 1];
  const aiAnalysis = useMemo(() => {
    const local = evaluateVitalsLocal(currentVitals);
    if (mlServerPrediction && mlServerPrediction.astronaut_id === selectedId) {
      return {
        ...local,
        readiness_score: mlServerPrediction.readiness_score,
        status: mlServerPrediction.status,
        anomaly_detected: mlServerPrediction.anomaly_detected
      };
    }
    return local;
  }, [currentVitals, mlServerPrediction, selectedId]);

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

  const handleModeSwitch = (targetMode) => {
    if (targetMode === 'crew' || targetMode === 'about') {
      setViewMode(targetMode);
    } else if (isSurgeonUnlocked) {
      setViewMode('surgeon');
    } else {
      setPinInput('');
      setPinError(false);
      setShowPinModal(true);
    }
  };

  const verifySurgeonPin = (e) => {
    e.preventDefault();
    if (pinInput.trim() === '1969') {
      setIsSurgeonUnlocked(true);
      setViewMode('surgeon');
      setShowPinModal(false);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const lockSurgeonConsole = () => {
    setIsSurgeonUnlocked(false);
    setViewMode('crew');
  };

  const evaChecks = useMemo(() => {
    const hasWaiver = Boolean(evaWaivers[selectedId]);
    const checks = [
      { label: 'Readiness >= 75%', pass: aiAnalysis.readiness_score >= 75, val: `${aiAnalysis.readiness_score}%` },
      { label: 'HRV >= 42 ms', pass: currentVitals.hrv_ms >= 42, val: `${currentVitals.hrv_ms} ms` },
      { label: 'Radiation < 1.2 mSv/h', pass: currentVitals.radiation_msv_hr < 1.2, val: `${currentVitals.radiation_msv_hr}` },
      { label: 'Sleep >= 6.0 hrs', pass: currentVitals.sleep_hours >= 6.0, val: `${currentVitals.sleep_hours}h` },
    ];
    return { checks, hasWaiver, cleared: hasWaiver || checks.every((c) => c.pass) };
  }, [aiAnalysis.readiness_score, currentVitals, evaWaivers, selectedId]);

  const liveVitalsMap = useMemo(() => {
    const map = {};
    crewIds.forEach((id) => {
      map[id] = id === selectedId ? currentVitals : snapshotData[id].history[snapshotData[id].history.length - 1];
    });
    return map;
  }, [crewIds, selectedId, currentVitals]);

  const crewOrders = useMemo(
    () => dispatchedOrders.filter((o) => o.crewId === selectedId),
    [dispatchedOrders, selectedId]
  );

  const statusColor =
    aiAnalysis.status === 'CRITICAL'
      ? 'text-rose-400 border-rose-500/40 bg-rose-500/10'
      : aiAnalysis.status === 'WARNING'
      ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
      : 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';

  return (
    <div className="min-h-screen bg-[var(--bg)] text-slate-100 flex flex-col">
      {/* Top Mission Control Bar (Compact text-xs sizing preserved) */}
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

          {/* Handover PDF Export + PIN-Protected Role & Mission Brief Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              title="Export Flight Surgeon Handover / MedEvac PDF"
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-900 text-slate-300 hover:text-white flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Handover PDF</span>
            </button>

            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => handleModeSwitch('crew')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  viewMode === 'crew' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Crew Tablet
              </button>
              <button
                onClick={() => handleModeSwitch('surgeon')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                  viewMode === 'surgeon' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isSurgeonUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                Flight Surgeon
              </button>
              {isSurgeonUnlocked && (
                <button
                  onClick={lockSurgeonConsole}
                  title="Lock Flight Surgeon Console"
                  className="ml-1 px-2 py-1 rounded-lg text-[10px] font-mono text-rose-300 hover:bg-rose-500/20"
                >
                  Lock
                </button>
              )}
              <button
                onClick={() => handleModeSwitch('about')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                  viewMode === 'about' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Info className="w-3 h-3" />
                Mission Brief
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-6 lg:px-8 py-6 flex-1 space-y-6">
        {viewMode === 'about' ? (
          <MissionBrief onLaunchConsole={() => setViewMode('crew')} />
        ) : (
          <>
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
                    className={`text-left p-4 rounded-2xl border transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-900/95 border-cyan-400/60 shadow-[0_0_20px_rgba(59,130,246,0.12)]'
                        : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-cyan-400">{member.id}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <div className="font-bold text-base text-white mt-0.5">{member.name}</div>
                      <div className="text-sm text-slate-400">{member.role}</div>
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
                      <div className="text-xs uppercase tracking-wider text-slate-500">Readiness</div>
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
                      <div className="text-sm uppercase tracking-wider font-semibold opacity-80">
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

                {/* Print-Only Mission Handover Banner */}
                <div className="hidden print-only-header border-b pb-3 mb-4">
                  <h1 className="text-xl font-bold">ASTROPULSE // FLIGHT SURGEON HANDOVER & MEDEVAC REPORT</h1>
                  <p className="text-sm">Crew: {selectedCrew.name} ({selectedCrew.id}) | Mission Day {currentVitals.mission_day} | Generated: {new Date().toLocaleString()}</p>
                </div>

                {/* Automated EVA Go / No-Go Airlock Gate */}
                <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                  evaChecks.cleared
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-rose-950/25 border-rose-500/40'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {evaChecks.cleared ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                        Pre-Spacewalk Airlock Gate
                      </div>
                      <div className={`text-base font-bold ${evaChecks.cleared ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {evaChecks.hasWaiver ? 'GO — FLIGHT SURGEON WAIVER ACTIVE' : evaChecks.cleared ? 'GO — CLEARED FOR EVA' : 'NO-GO — EVA AIRLOCK HOLD'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {evaChecks.checks.map((c) => (
                      <span
                        key={c.label}
                        className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${
                          c.pass
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                        }`}
                      >
                        {c.pass ? '✓' : '✕'} {c.label} ({c.val})
                      </span>
                    ))}
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
                      <span className="text-sm font-semibold uppercase tracking-wider text-slate-300">
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
                          <XAxis dataKey="hour" stroke="var(--muted)" fontSize={12} tickFormatter={(h) => `${h}:00`} />
                          <YAxis stroke="var(--muted)" fontSize={12} domain={[30, 150]} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'var(--panel)', borderColor: 'var(--line2)', borderRadius: '10px', fontSize: '13px' }}
                          />
                          <Area type="monotone" dataKey="heart_rate_bpm" name="Heart Rate (BPM)" stroke="var(--accent)" fill="url(#hrGrad)" strokeWidth={2} />
                          <Area type="monotone" dataKey="readiness_score" name="Readiness Score" stroke="#10b981" fill="url(#readyGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* AI Flight Surgeon Countermeasure Co-Pilot */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                      Autonomous Countermeasure & Medical Protocol Engine
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {aiAnalysis.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border flex items-start gap-3 ${
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
                            <span className="text-base font-bold text-white">{rec.title}</span>
                            <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {rec.system}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300 mt-1 leading-relaxed">{rec.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Crew Tablet View: Priority Surgeon Directives + Self-Care & Ground Link */}
            {viewMode === 'crew' && (
              <>
                {crewOrders.length > 0 && (
                  <div className="rounded-2xl border border-amber-500/40 bg-amber-950/25 p-4 space-y-2">
                    <div className="text-sm font-bold uppercase tracking-wider text-amber-300">
                      Incoming Flight Surgeon Directives ({crewOrders.length})
                    </div>
                    {crewOrders.map((ord) => (
                      <div key={ord.id} className="flex items-center justify-between gap-3 text-sm bg-slate-950/60 border border-amber-500/20 rounded-xl px-3.5 py-2.5">
                        <span className="text-white font-medium">
                          <b className="text-amber-300">[{ord.priority}]</b> {ord.text}
                        </span>
                        <button
                          onClick={() => setDispatchedOrders((prev) => prev.filter((x) => x.id !== ord.id))}
                          className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold whitespace-nowrap"
                        >
                          Acknowledge
                        </button>
                      </div>
                    ))}
                  </div>
                )}

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
              </>
            )}

            {/* Flight Surgeon View: Multi-Crew Triage Matrix & Protocol Dispatcher */}
            {viewMode === 'surgeon' && (
              <SurgeonConsole
                crewData={snapshotData}
                selectedId={selectedId}
                onSelectCrew={setSelectedId}
                liveVitalsMap={liveVitalsMap}
                evaluateFn={evaluateVitalsLocal}
                evaWaivers={evaWaivers}
                onToggleWaiver={(id) => setEvaWaivers((prev) => ({ ...prev, [id]: !prev[id] }))}
                dispatchedOrders={dispatchedOrders}
                onDispatchOrder={(ord) => setDispatchedOrders((prev) => [ord, ...prev])}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-sm py-4 px-6 lg:px-8 no-print font-['Google_Sans',sans-serif]">
        <div className="w-full flex flex-wrap items-center justify-between gap-2 text-sm text-slate-400">
          <span className="font-['Google_Sans',sans-serif] font-medium text-xs uppercase tracking-wider">
            ASTROPULSE // ARTEMIS-IV AUTONOMOUS CREW HEALTH MONITOR
          </span>
          <span className="font-medium text-slate-300">
            Made by <span className="text-cyan-400 font-semibold">Jahnvi Srivastava</span> · 2026
          </span>
        </div>
      </footer>

      {/* Flight Surgeon Clearance PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <form
            onSubmit={verifySurgeonPin}
            className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center gap-2.5 text-cyan-400">
              <Lock className="w-5 h-5" />
              <h3 className="font-bold text-base text-white">Flight Surgeon Clearance Required</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Multi-crew telemetry, ML anomaly thresholds, and override controls require Flight Surgeon authorization.
            </p>
            <div>
              <input
                type="password"
                maxLength={6}
                autoFocus
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
                placeholder="Enter 4-digit PIN (Demo: 1969)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-center font-mono text-lg tracking-widest text-white focus:outline-none focus:border-cyan-400"
              />
              {pinError && (
                <p className="text-sm text-rose-400 mt-1.5 text-center">
                  Invalid clearance code. Use demo PIN: 1969
                </p>
              )}
              <p className="text-xs text-slate-500 mt-2 text-center">
                NASA Mission Control Demo PIN: <span className="font-mono text-slate-300">1969</span>
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-cyan-500 text-slate-950 text-sm font-bold hover:opacity-90"
              >
                Unlock Console
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, unit, sub, alert }) {
  return (
    <div
      className={`p-4 rounded-2xl border transition ${
        alert
          ? 'bg-rose-950/25 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.12)]'
          : 'bg-slate-900/70 border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-base font-medium text-slate-300">{label}</span>
        {icon}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={`text-2xl font-bold font-mono ${alert ? 'text-rose-300' : 'text-white'}`}>
          {value}
        </span>
        <span className="text-sm text-slate-400">{unit}</span>
      </div>
      <div className="text-sm text-slate-400 mt-1 font-mono">{sub}</div>
    </div>
  );
}