import React from 'react';
import {
  Rocket,
  Cpu,
  ShieldCheck,
  Radio,
  Lock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Layers
} from 'lucide-react';

export default function MissionBrief({ onLaunchConsole }) {
  const pillars = [
    {
      icon: <Radio className="w-5 h-5 text-cyan-400" />,
      title: 'Delay-Tolerant Autonomy (0–24 min)',
      desc: 'Simulates Earth–Moon and Earth–Mars one-way light-time delays with offline store-and-forward queuing and an on-device rule fallback when disconnected.'
    },
    {
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
      title: 'Adaptive Personal Baseline + ML',
      desc: 'Tracks each astronaut against their own early-mission physiological baseline, flagging 2+ SD drift and hours-to-breach ETA alongside Random Forest & Isolation Forest scoring.'
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
      title: 'Automated EVA Airlock Go / No-Go',
      desc: 'Evaluates 4 objective pre-spacewalk thresholds (Readiness ≥ 75%, HRV ≥ 42 ms, Radiation < 1.2 mSv/h, Sleep ≥ 6h) with Flight Surgeon waiver override capability.'
    },
    {
      icon: <Lock className="w-5 h-5 text-rose-400" />,
      title: 'Dual-Role Clinical Privacy (PIN: 1969)',
      desc: 'Separates hands-free Crew Tablet self-care (with Web Speech voice logging) from the PIN-locked Flight Surgeon Fleet Triage Matrix and directive dispatcher.'
    }
  ];

  const hrpHazards = [
    { hazard: 'Space Radiation', vitals: 'Radiation Flux (mSv/hr), Cumulative Dose vs. 600 mSv Cap', response: 'Storm-shelter relocation & radioprotective protocol' },
    { hazard: 'Isolation & Confinement', vitals: 'Sleep Duration (hrs), HRV (ms), Self-Reported Mood (1–5)', response: 'Circadian light shifting & crew check-in prompts' },
    { hazard: 'Distance from Earth', vitals: 'Light-Time Delay (0–24 min) + Critical Alert Count', response: 'Autonomous edge inference & queued Ground Link relay' },
    { hazard: 'Altered Gravity', vitals: 'Resting Heart Rate (BPM), Heart Rate Variability (HRV)', response: 'Paced breathing, hydration & ARED resistance tracking' },
    { hazard: 'Hostile Closed Environment', vitals: 'Blood Oxygen SpO2 (%), Core Temp (°C), Cabin CO2', response: 'CDRA CO2 scrubber check & suit LCVG cooling boost' }
  ];

  return (
    <section className="w-full space-y-6 pt-2 text-left">
      {/* Hero Overview Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Rocket className="w-3.5 h-3.5" /> NASA Space Apps Challenge 2026 // Mission Brief
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              AstroPulse: Autonomous Deep-Space Crew Health Monitor
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              As Artemis and Mars missions venture beyond Low Earth Orbit, communication delays of up to 24 minutes each way make real-time ground medical monitoring impossible. AstroPulse equips astronauts and Flight Surgeons with an edge-resilient biometric digital twin, personalized drift detection, and guardrailed AI countermeasures.
            </p>
          </div>

          <button
            onClick={onLaunchConsole}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:opacity-90 transition shrink-0"
          >
            Back to Live Telemetry →
          </button>
        </div>
      </div>

      {/* 4 Core Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pillars.map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
            <div className="flex items-center gap-2.5">
              {item.icon}
              <h3 className="font-bold text-sm text-white">{item.title}</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* System Architecture Pipeline */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-white">
            End-to-End System Architecture & Fail-Safe Flow
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1">
            <div className="font-mono text-[11px] text-cyan-400">01 // TELEMETRY & VOICE</div>
            <div className="font-semibold text-white">Multi-Sensor + Web Speech</div>
            <p className="text-slate-400 text-[11px]">Streams 6 vital channels + hands-free crew voice check-ins every 2.5s.</p>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1">
            <div className="font-mono text-[11px] text-emerald-400">02 // ML & DRIFT ENGINE</div>
            <div className="font-semibold text-white">FastAPI + Edge Scoring</div>
            <p className="text-slate-400 text-[11px]">Random Forest readiness + Isolation Forest anomaly detection + 2 SD personal drift.</p>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1">
            <div className="font-mono text-[11px] text-amber-400">03 // GUARDRAILED AI</div>
            <div className="font-semibold text-white">Gemini + Local Fallback</div>
            <p className="text-slate-400 text-[11px]">Non-diagnostic NASA self-care guidance with automatic offline rule-engine failover.</p>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1">
            <div className="font-mono text-[11px] text-rose-400">04 // COMMAND & HANDOVER</div>
            <div className="font-semibold text-white">Surgeon Console & PDF</div>
            <p className="text-slate-400 text-[11px]">PIN-locked fleet triage, EVA waivers, crew directives & printable MedEvac summary.</p>
          </div>
        </div>
      </div>

      {/* NASA HRP 5 Hazards Mapping Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-white">
            Alignment with NASA Human Research Program (HRP) 5 Spaceflight Hazards
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                <th className="py-2.5 px-3">NASA HRP Hazard</th>
                <th className="py-2.5 px-3">Monitored Telemetry Inputs</th>
                <th className="py-2.5 px-3">Autonomous Countermeasure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {hrpHazards.map((row) => (
                <tr key={row.hazard}>
                  <td className="py-2.5 px-3 font-semibold text-white">{row.hazard}</td>
                  <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">{row.vitals}</td>
                  <td className="py-2.5 px-3 text-slate-300">{row.response}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Judge Walkthrough & Honest Scientific Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-white">60-Second Judge Walkthrough</h3>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300 leading-relaxed">
            <li>Inspect <b>Crew Tablet</b> mode: test <b>Voice Check-In</b>, ask the <b>On-board Assistant</b>, and send a 12-min Mars <b>Ground Link</b> report.</li>
            <li>Trigger <b>Solar Flare</b> or <b>EVA Exhaustion</b> in the top bar to watch the Digital Twin highlight affected organs and flip the Airlock Gate to <b>NO-GO</b>.</li>
            <li>Switch to <b>Flight Surgeon</b> mode (Demo PIN: <code className="font-mono text-cyan-400">1969</code>) to rank fleet risk, issue an <b>EVA Waiver</b>, or dispatch a crew directive.</li>
            <li>Click <b>Handover PDF</b> in the top bar to export a clean medical handover report.</li>
          </ol>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="w-4 h-4" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-white">Scientific Transparency & Scope Notes</h3>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300 leading-relaxed">
            <li><b>Synthetic Mission Dataset:</b> Because real astronaut biometric records are private medical data, our 30-day training dataset is synthetically generated using NASA physiological reference ranges.</li>
            <li><b>Retrain-Ready ML Pipeline:</b> The Random Forest regressor approximates our physiological readiness scoring model, while Isolation Forest detects unsupervised anomalies—ready to retrain directly on real flight data.</li>
            <li><b>Decision-Support Only:</b> Reference ranges are simplified for demonstration and provide wellness countermeasures, not clinical diagnosis.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}