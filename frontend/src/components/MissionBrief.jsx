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
  Layers,
  Zap,
  Moon,
  ArrowRight
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

  const simulations = [
    {
      icon: <Radio className="w-5 h-5 text-rose-400" />,
      name: 'Solar Flare (SPE Flux Spike)',
      accent: 'border-rose-500/30 bg-rose-950/15 hover:border-rose-400/60',
      triggers: 'Radiation flux spikes to ~4.4 mSv/hr; elevated heart rate & suppressed HRV.',
      response: 'Highlights Radiation Shielding on the Digital Twin, locks EVA Airlock Gate to NO-GO, and orders immediate water-wall storm shelter relocation.'
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      name: 'EVA Exhaustion (Thermal & Cardiac Strain)',
      accent: 'border-amber-500/30 bg-amber-950/15 hover:border-amber-400/60',
      triggers: 'Heart rate surges to ~132 bpm, HRV drops to ~29 ms, SpO2 dips to ~94.1%, and core temp rises to 38.2°C.',
      response: 'Flags Cardiovascular, Respiratory, and Thermoregulation systems; triggers MAX LCVG suit cooling, CO2 scrubber check, and paced recovery.'
    },
    {
      icon: <Moon className="w-5 h-5 text-indigo-400" />,
      name: 'Circadian Drift (Cumulative Sleep Debt)',
      accent: 'border-indigo-500/30 bg-indigo-950/15 hover:border-indigo-400/60',
      triggers: '24h sleep drops to ~4.3 hrs alongside elevated resting HR and reduced HRV.',
      response: 'Flags Circadian & Neurocognitive strain, shifts cabin lighting to warm 2700K spectrum, and defers high-precision robotic or EVA tasks.'
    }
  ];

  const pipelineSteps = [
    { step: '01 // TELEMETRY & VOICE', title: 'Multi-Sensor + Web Speech', desc: 'Streams 6 vital channels + hands-free crew voice check-ins every 2.5s.', color: 'text-cyan-400' },
    { step: '02 // ML & DRIFT ENGINE', title: 'FastAPI + Edge Scoring', desc: 'Random Forest readiness + Isolation Forest anomaly detection + 2 SD personal drift.', color: 'text-emerald-400' },
    { step: '03 // GUARDRAILED AI', title: 'Gemini + Local Fallback', desc: 'Non-diagnostic NASA self-care guidance with automatic offline rule-engine failover.', color: 'text-amber-400' },
    { step: '04 // COMMAND & HANDOVER', title: 'Surgeon Console & PDF', desc: 'PIN-locked fleet triage, EVA waivers, crew directives & printable MedEvac summary.', color: 'text-rose-400' }
  ];

  return (
    <section className="w-full space-y-6 pt-2 text-left">
      <style>{`
        @keyframes briefFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes telemetryPulse {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .brief-enter {
          opacity: 0;
          animation: briefFadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .telemetry-beam {
          animation: telemetryPulse 3.2s linear infinite;
        }
      `}</style>

      {/* Hero Overview Card */}
      <div
        style={{ animationDelay: '0ms' }}
        className="brief-enter rounded-2xl border border-slate-800 bg-slate-900/75 p-6 space-y-4 relative overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
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
            className="group px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:opacity-95 transition flex items-center gap-1.5 shrink-0"
          >
            Back to Live Telemetry
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* 4 Core Capabilities Grid */}
      <div
        style={{ animationDelay: '70ms' }}
        className="brief-enter grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {pillars.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-500/40 hover:shadow-[0_8px_24px_rgba(6,182,212,0.08)]"
          >
            <div className="flex items-center gap-2.5">
              {item.icon}
              <h3 className="font-bold text-base text-white">{item.title}</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* System Architecture Pipeline with Live Signal Sweep */}
      <div
        style={{ animationDelay: '140ms' }}
        className="brief-enter rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4 overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">
              End-to-End System Architecture & Fail-Safe Flow
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            EDGE-RESILIENT PIPELINE
          </span>
        </div>

        {/* Subtle animated telemetry sweep bar */}
        <div className="h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full w-1/4 bg-gradient-to-r from-transparent via-cyan-400 to-transparent telemetry-beam" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {pipelineSteps.map((node) => (
            <div
              key={node.step}
              className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1.5 transition-colors hover:border-slate-700"
            >
              <div className={`font-mono text-xs ${node.color}`}>{node.step}</div>
              <div className="font-bold text-base text-white">{node.title}</div>
              <p className="text-slate-400 text-sm leading-relaxed">{node.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Simulated Emergency Scenarios Breakdown */}
      <div
        style={{ animationDelay: '210ms' }}
        className="brief-enter rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">
              Interactive Event Simulations (Top Mission Bar)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Click &ldquo;Nominal&rdquo; in the top bar anytime to restore baseline vitals
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {simulations.map((sim) => (
            <div
              key={sim.name}
              className={`rounded-xl border p-4 space-y-2 transition-all duration-200 hover:-translate-y-0.5 ${sim.accent}`}
            >
              <div className="flex items-center gap-2">
                {sim.icon}
                <h4 className="font-bold text-base text-white">{sim.name}</h4>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                <b className="text-slate-200">Telemetry Shift:</b> {sim.triggers}
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">
                <b className="text-slate-200">System Response:</b> {sim.response}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* NASA HRP 5 Hazards Mapping Table */}
      <div
        style={{ animationDelay: '280ms' }}
        className="brief-enter rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-3"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-sm uppercase tracking-wider text-white">
            Alignment with NASA Human Research Program (HRP) 5 Spaceflight Hazards
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-xs">
                <th className="py-3 px-3">NASA HRP Hazard</th>
                <th className="py-3 px-3">Monitored Telemetry Inputs</th>
                <th className="py-3 px-3">Autonomous Countermeasure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {hrpHazards.map((row) => (
                <tr key={row.hazard} className="transition-colors hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-bold text-base text-white">{row.hazard}</td>
                  <td className="py-3 px-3 text-slate-300 font-mono text-sm">{row.vitals}</td>
                  <td className="py-3 px-3 text-slate-300 text-sm">{row.response}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Judge Walkthrough & Honest Scientific Notes */}
      <div
        style={{ animationDelay: '350ms' }}
        className="brief-enter grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-bold text-base uppercase tracking-wider text-white">60-Second Judge Walkthrough</h3>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300 leading-relaxed">
            <li>Inspect <b>Crew Tablet</b> mode: test <b>Voice Check-In</b>, ask the <b>On-board Assistant</b>, and send a 12-min Mars <b>Ground Link</b> report.</li>
            <li>Trigger <b>Solar Flare</b>, <b>EVA Exhaustion</b>, or <b>Circadian Drift</b> in the top bar to watch the Digital Twin highlight affected organs and flip the Airlock Gate to <b>NO-GO</b>.</li>
            <li>Switch to <b>Flight Surgeon</b> mode (Demo PIN: <code className="font-mono text-cyan-400">1969</code>) to rank fleet risk, issue an <b>EVA Waiver</b>, or dispatch a crew directive.</li>
            <li>Click <b>Handover PDF</b> in the top bar to export a clean medical handover report.</li>
          </ol>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-bold text-base uppercase tracking-wider text-white">Scientific Transparency & Scope Notes</h3>
          </div>
          <ul className="list-disc list-inside space-y-2 text-sm text-slate-300 leading-relaxed">
            <li><b>Synthetic Mission Dataset:</b> Because real astronaut biometric records are private medical data, our 30-day training dataset is synthetically generated using NASA physiological reference ranges.</li>
            <li><b>Retrain-Ready ML Pipeline:</b> The Random Forest regressor approximates our physiological readiness scoring model, while Isolation Forest detects unsupervised anomalies—ready to retrain directly on real flight data.</li>
            <li><b>Decision-Support Only:</b> Reference ranges are simplified for demonstration and provide wellness countermeasures, not clinical diagnosis.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}