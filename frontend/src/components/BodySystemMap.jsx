import React from 'react';

export default function BodySystemMap({ affectedSystems = [], vitals }) {
  const hasCardio = affectedSystems.includes('cardiovascular');
  const hasCircadian = affectedSystems.includes('circadian');
  const hasRadiation = affectedSystems.includes('radiation');
  const hasRespiratory = affectedSystems.includes('respiratory');
  const hasThermo = affectedSystems.includes('thermoregulation');

  return (
    <div className="relative flex flex-col items-start justify-start bg-slate-900/70 border border-slate-800 rounded-2xl p-4 h-full">
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
          Biometric Digital Twin
        </span>
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
          affectedSystems.length > 0
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
        }`}>
          {affectedSystems.length > 0 ? `${affectedSystems.length} System Alert(s)` : 'All Systems Nominal'}
        </span>
      </div>

      {/* Stylized Astronaut Silhouette SVG */}
      <svg viewBox="0 0 220 340" className="w-48 h-64 drop-shadow-[0_0_15px_rgba(59,130,246,0.15)]">
        <defs>
          <radialGradient id="radGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Radiation Aura if triggered */}
        {hasRadiation && (
          <circle cx="110" cy="160" r="95" fill="url(#radGlow)" className="animate-pulse" />
        )}

        {/* Grid Scan Lines */}
        <line x1="20" y1="60" x2="200" y2="60" stroke="var(--grid)" strokeDasharray="3 3" />
        <line x1="20" y1="140" x2="200" y2="140" stroke="var(--grid)" strokeDasharray="3 3" />
        <line x1="20" y1="220" x2="200" y2="220" stroke="var(--grid)" strokeDasharray="3 3" />

        {/* Human Silhouette Outline */}
        <g fill="var(--panel)" stroke={hasThermo ? "#f59e0b" : "var(--accent)"} strokeWidth="2">
          {/* Head */}
          <circle cx="110" cy="42" r="22" />
          {/* Torso */}
          <path d="M78 75 Q110 68 142 75 L150 165 Q110 175 70 165 Z" />
          {/* Left & Right Arms */}
          <path d="M75 78 L46 155 L58 160 L82 95" />
          <path d="M145 78 L174 155 L162 160 L138 95" />
          {/* Legs */}
          <path d="M80 168 L74 295 L94 295 L104 175" />
          <path d="M140 168 L146 295 L126 295 L116 175" />
        </g>

        {/* Neuro / Circadian Node (Head) */}
        <circle
          cx="110"
          cy="38"
          r="7"
          fill={hasCircadian ? "#f59e0b" : "#10b981"}
          className={hasCircadian ? "animate-ping" : ""}
        />
        <circle cx="110" cy="38" r="5" fill={hasCircadian ? "#fbbf24" : "#34d399"} />

        {/* Respiratory Lungs */}
        <ellipse
          cx="97"
          cy="105"
          rx="10"
          ry="16"
          fill={hasRespiratory ? "rgba(244,63,94,0.45)" : "rgba(59,130,246,0.2)"}
          stroke={hasRespiratory ? "#f43f5e" : "var(--accent)"}
          strokeWidth="1.5"
        />
        <ellipse
          cx="123"
          cy="105"
          rx="10"
          ry="16"
          fill={hasRespiratory ? "rgba(244,63,94,0.45)" : "rgba(59,130,246,0.2)"}
          stroke={hasRespiratory ? "#f43f5e" : "var(--accent)"}
          strokeWidth="1.5"
        />

        {/* Cardiovascular Heart Node */}
        <circle
          cx="116"
          cy="102"
          r="6"
          fill={hasCardio ? "#f43f5e" : "var(--accent)"}
          className="animate-pulse"
        />

        {/* Callout Lines */}
        <line x1="115" y1="38" x2="175" y2="26" stroke="var(--muted)" strokeWidth="1" />
        <text x="177" y="29" fill="var(--muted2)" fontSize="9" fontFamily="monospace">NEURO</text>

        <line x1="122" y1="102" x2="175" y2="95" stroke="var(--muted)" strokeWidth="1" />
        <text x="177" y="98" fill="var(--muted2)" fontSize="9" fontFamily="monospace">CARDIO</text>

        <line x1="87" y1="112" x2="35" y2="112" stroke="var(--muted)" strokeWidth="1" />
        <text x="6" y="115" fill="var(--muted2)" fontSize="9" fontFamily="monospace">SPO2</text>
      </svg>

      {/* Quick System Pills */}
      <div className="grid grid-cols-2 gap-1.5 w-full mt-2 text-[11px]">
        <div className={`px-2 py-1 rounded border ${hasCardio ? 'bg-rose-950/60 border-rose-500/50 text-rose-200' : 'bg-slate-950/60 border-slate-800 text-slate-400'}`}>
          Cardio: {vitals.heart_rate_bpm} bpm
        </div>
        <div className={`px-2 py-1 rounded border ${hasCircadian ? 'bg-amber-950/60 border-amber-500/50 text-amber-200' : 'bg-slate-950/60 border-slate-800 text-slate-400'}`}>
          Sleep: {vitals.sleep_hours} hrs
        </div>
        <div className={`px-2 py-1 rounded border ${hasRadiation ? 'bg-rose-950/60 border-rose-500/50 text-rose-200' : 'bg-slate-950/60 border-slate-800 text-slate-400'}`}>
          Rad: {vitals.radiation_msv_hr} mSv/h
        </div>
        <div className={`px-2 py-1 rounded border ${hasThermo ? 'bg-amber-950/60 border-amber-500/50 text-amber-200' : 'bg-slate-950/60 border-slate-800 text-slate-400'}`}>
          Core: {vitals.core_temp_c}°C
        </div>
      </div>
    </div>
  );
}
