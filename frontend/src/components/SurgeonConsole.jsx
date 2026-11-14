import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Send,
  ArrowUpDown,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileCheck2
} from 'lucide-react';

const CAREER_RAD_LIMIT_MSV = 600; // NASA career permissible exposure limit benchmark

export default function SurgeonConsole({
  crewData,
  selectedId,
  onSelectCrew,
  liveVitalsMap,
  evaluateFn,
  evaWaivers,
  onToggleWaiver,
  dispatchedOrders,
  onDispatchOrder
}) {
  const [sortByRisk, setSortByRisk] = useState(true);
  const [targetCrewId, setTargetCrewId] = useState(selectedId);
  const [protocolText, setProtocolText] = useState('');
  const [priority, setPriority] = useState('URGENT');

  const fleetRows = useMemo(() => {
    const rows = Object.keys(crewData).map((id) => {
      const member = crewData[id];
      const vitals = liveVitalsMap[id] || member.history[member.history.length - 1];
      const analysis = evaluateFn(vitals);
      const hasWaiver = Boolean(evaWaivers[id]);
      const evaGo =
        hasWaiver ||
        (analysis.readiness_score >= 75 &&
          vitals.hrv_ms >= 42 &&
          vitals.radiation_msv_hr < 1.2 &&
          vitals.sleep_hours >= 6.0);
      const radPct = Math.min(100, Math.round((vitals.cumulative_rad_msv / CAREER_RAD_LIMIT_MSV) * 100));
      return { id, member, vitals, analysis, hasWaiver, evaGo, radPct };
    });

    if (sortByRisk) {
      rows.sort((a, b) => a.analysis.readiness_score - b.analysis.readiness_score);
    }
    return rows;
  }, [crewData, liveVitalsMap, evaluateFn, evaWaivers, sortByRisk]);

  const handleDispatch = (e) => {
    e.preventDefault();
    if (!protocolText.trim()) return;
    onDispatchOrder({
      id: String(Date.now()),
      crewId: targetCrewId,
      crewName: crewData[targetCrewId].name,
      priority,
      text: protocolText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setProtocolText('');
  };

  const quickPresets = [
    'Administer 500mL isotonic electrolyte solution & recheck HRV in 15 min',
    'Relocate to water-wall storm shelter module until SPE flux drops < 1.0 mSv/hr',
    'Defer non-essential EVA; schedule 90-min circadian light recovery block'
  ];

  return (
    <section className="space-y-6 pt-2">
      {/* Fleet-Wide Triage Matrix */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Stethoscope className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="font-bold text-sm uppercase tracking-wider text-white">
                Fleet-Wide Medical Triage & EVA Clearance Matrix
              </h2>
              <p className="text-xs text-slate-400">
                Real-time multi-crew physiological ranking, NASA cumulative radiation budget, and airlock waivers
              </p>
            </div>
          </div>

          <button
            onClick={() => setSortByRisk(!sortByRisk)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-950 text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            {sortByRisk ? 'Sorted: Highest Risk First' : 'Sorted: Roster Order'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Astronaut</th>
                <th className="py-2.5 px-3">Readiness</th>
                <th className="py-2.5 px-3">HR / HRV</th>
                <th className="py-2.5 px-3">SpO2 / Temp</th>
                <th className="py-2.5 px-3">Cumulative Rad (600 mSv Cap)</th>
                <th className="py-2.5 px-3">Airlock Status</th>
                <th className="py-2.5 px-3 text-right">Surgeon Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {fleetRows.map(({ id, member, vitals, analysis, hasWaiver, evaGo, radPct }) => {
                const isSelected = id === selectedId;
                return (
                  <tr
                    key={id}
                    onClick={() => onSelectCrew(id)}
                    className={`cursor-pointer transition ${
                      isSelected ? 'bg-cyan-500/10' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{member.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {id} · {member.role}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-sm">
                      <span
                        className={
                          analysis.readiness_score < 55
                            ? 'text-rose-400'
                            : analysis.readiness_score < 75
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }
                      >
                        {analysis.readiness_score}%
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {vitals.heart_rate_bpm} bpm / {vitals.hrv_ms} ms
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {vitals.spo2_pct}% / {vitals.core_temp_c}°C
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full ${
                              radPct > 75 ? 'bg-rose-500' : radPct > 40 ? 'bg-amber-400' : 'bg-cyan-400'
                            }`}
                            style={{ width: `${radPct}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">
                          {vitals.cumulative_rad_msv} mSv
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          evaGo
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {evaGo ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {hasWaiver ? 'GO (WAIVER)' : evaGo ? 'GO' : 'NO-GO HOLD'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleWaiver(id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                          hasWaiver
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-cyan-500/50'
                        }`}
                      >
                        {hasWaiver ? 'Revoke Waiver' : 'Grant EVA Waiver'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Closed-Loop Medical Protocol Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-white">
              Dispatch Medical Directive to Crew Tablet
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Directives appear immediately as priority alerts on the selected astronaut&apos;s Crew Tablet interface.
          </p>

          <div className="flex flex-wrap gap-1.5">
            {quickPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setProtocolText(preset)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-slate-700 bg-slate-950 text-slate-300 hover:border-cyan-500/50 text-left"
              >
                + {preset.slice(0, 48)}...
              </button>
            ))}
          </div>

          <form onSubmit={handleDispatch} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={targetCrewId}
                onChange={(e) => setTargetCrewId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                {Object.keys(crewData).map((id) => (
                  <option key={id} value={id}>
                    {id} — {crewData[id].name}
                  </option>
                ))}
              </select>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="URGENT">Priority: URGENT MEDICAL ORDER</option>
                <option value="ADVISORY">Priority: FLIGHT SURGEON ADVISORY</option>
              </select>
            </div>

            <div className="flex gap-2">
              <input
                value={protocolText}
                onChange={(e) => setProtocolText(e.target.value)}
                placeholder="Enter countermeasure directive or EVA restriction..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Dispatch
              </button>
            </div>
          </form>
        </div>

        {/* Active Dispatched Orders Log */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-white">
              Active Crew Directives ({dispatchedOrders.length})
            </h3>
          </div>

          {dispatchedOrders.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">
              No active directives dispatched. Use the console on the left to push countermeasures to any Crew Tablet.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-auto">
              {dispatchedOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/70 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-cyan-400">{ord.crewName}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        ord.priority === 'URGENT'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {ord.priority} · {ord.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-300">{ord.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
