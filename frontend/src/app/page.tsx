"use client";

import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Zap, Database, MessageSquare, Play, Info, Wand2, ShieldCheck, Volume2, Orbit, Atom, Loader2, Sparkles, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LRELab() {
  const [mode, setMode] = useState<'Traditional' | 'Antigravity'>('Traditional');
  const [apiKey, setApiKey] = useState("");

  // Traditional Design
  const [thrustGoal, setThrustGoal] = useState(500);
  const [chamberPressure, setChamberPressure] = useState(20);
  const [propellant, setPropellant] = useState('LOX/RP-1');
  const [expansionRatio, setExpansionRatio] = useState(12);
  const [combustionCycle, setCombustionCycle] = useState('staged_combustion');
  const [altitude, setAltitude] = useState(0);

  // Antigravity Design
  const [gravitonFlux, setGravitonFlux] = useState(450);
  const [fieldIntensity, setFieldIntensity] = useState(0.85);
  const [casimirPressure, setCasimirPressure] = useState(12.5);
  const [spacetimePermittivity, setSpacetimePermittivity] = useState(1.0);
  const [fieldGeometry, setFieldGeometry] = useState('toroidal');
  const [powerSource, setPowerSource] = useState('cold_fusion');

  // Simulation Results
  const [results, setResults] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Chat/AI State
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: "Welcome to the Propulsion Lab. System online." }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Auto-simulate on param change
  useEffect(() => {
    runSimulation();
  }, [
    mode, thrustGoal, chamberPressure, propellant, expansionRatio, combustionCycle, altitude,
    gravitonFlux, fieldIntensity, casimirPressure, spacetimePermittivity, fieldGeometry, powerSource
  ]);

  const runSimulation = async () => {
    try {
      if (mode === 'Traditional') {
        const res = await fetch('http://localhost:8000/simulate/lre', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target_thrust_N: thrustGoal,
            chamber_pressure_bar: chamberPressure,
            propellant: propellant,
            expansion_ratio: expansionRatio,
            combustion_cycle: combustionCycle,
            altitude_m: altitude
          })
        });
        const data = await res.json();
        setResults(data);
      } else {
        const res = await fetch('http://localhost:8000/simulate/ag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            graviton_flux_thz: gravitonFlux,
            field_intensity_t: fieldIntensity,
            casimir_pressure_nn: casimirPressure,
            spacetime_permittivity: spacetimePermittivity,
            field_geometry: fieldGeometry,
            power_source: powerSource
          })
        });
        const data = await res.json();
        setResults(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    
    setIsAiLoading(true);
    try {
      const res = await fetch('http://localhost:8000/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          command: 'chat',
          context: '',
          message: userMsg,
          apiKey
        })
      });
      const data = await res.json();
      if(res.ok) {
        setChatHistory(prev => [...prev, { role: 'assistant', text: data.response }]);
      } else {
         setChatHistory(prev => [...prev, { role: 'assistant', text: `Error: ${data.detail || 'Communication failure.'}` }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', text: "API offline or error." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const runAiCommand = async (commandType: string) => {
    setIsAiLoading(true);
    const context = mode === 'Traditional' 
      ? `Thrust ${thrustGoal}N, Pc ${chamberPressure}bar, Propellant ${propellant}`
      : `Graviton Flux ${gravitonFlux}THz, Intensity ${fieldIntensity}T, Casimir Pressure ${casimirPressure}nN`;

    try {
      const res = await fetch('http://localhost:8000/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          command: commandType,
          context: context,
          apiKey
        })
      });
      const data = await res.json();
      if(res.ok) {
        setChatHistory(prev => [...prev, { role: 'assistant', text: `✨ [${mode.toUpperCase()} ${commandType.toUpperCase()}] \n\n ${data.response}` }]);
      } else {
         setChatHistory(prev => [...prev, { role: 'assistant', text: `✨ [ERROR] \n\n ${data.detail}` }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', text: "Engineering link lost." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className={cn("flex h-screen overflow-hidden font-sans transition-colors duration-700", 
        mode === 'Traditional' ? 'bg-slate-950 text-slate-100' : 'bg-indigo-950 text-indigo-100'
    )}>
      
      {/* SIDEBAR */}
      <aside className={cn("w-80 border-r p-6 flex flex-col overflow-y-auto transition-colors duration-700 custom-scrollbar", 
          mode === 'Traditional' ? 'bg-slate-900/50 border-slate-800' : 'bg-violet-900/30 border-violet-800'
      )}>
        <div className="flex items-center gap-3 mb-6">
          <div className={cn("p-2 rounded-lg shadow-lg transition-colors duration-700", 
              mode === 'Traditional' ? 'bg-sky-500 shadow-sky-500/20' : 'bg-fuchsia-500 shadow-fuchsia-500/20'
          )}>
            {mode === 'Traditional' ? <Zap size={24} className="text-white" /> : <Orbit size={24} className="text-white" />}
          </div>
          <h1 className="text-xl font-bold tracking-tight">{mode === 'Traditional' ? 'LRE Lab' : 'AG-Lab'}</h1>
        </div>

        {/* API Key settings block */}
        <div className="mb-4">
           <input type="password" placeholder="Gemini API Key (optional)" className="w-full text-xs p-2 bg-black/40 border border-white/10 rounded-lg outline-none" value={apiKey} onChange={e => setApiKey(e.target.value)} />
        </div>

        {/* MODE TOGGLE */}
        <div className="flex p-1 bg-black/30 rounded-xl mb-6">
          <button onClick={() => setMode('Traditional')}
            className={cn("flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all", 
                mode === 'Traditional' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
            )}>
            Traditional
          </button>
          <button onClick={() => setMode('Antigravity')}
            className={cn("flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all", 
                mode === 'Antigravity' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
            )}>
            Antigravity
          </button>
        </div>

        <div className="space-y-5 flex-1">
          { mode === 'Traditional' ? (
             <>
               <div>
                 <label className="text-xs text-slate-400">Propellant Type</label>
                 <select className="w-full bg-slate-800 text-sm p-2 rounded mt-1 outline-none text-white border border-slate-700" value={propellant} onChange={e=>setPropellant(e.target.value)}>
                    <option value="LOX/RP-1">LOX / RP-1</option>
                    <option value="LH2/LOX">LH2 / LOX</option>
                    <option value="Methane/LOX">CH4 / LOX</option>
                    <option value="Hydrazine/NTO">Hydrazine / NTO</option>
                 </select>
               </div>
               <div>
                  <label className="text-xs text-slate-400">Combustion Cycle</label>
                  <select className="w-full bg-slate-800 text-sm p-2 rounded mt-1 outline-none text-white border border-slate-700" value={combustionCycle} onChange={e=>setCombustionCycle(e.target.value)}>
                    <option value="gas_generator">Gas Generator</option>
                    <option value="staged_combustion">Staged Combustion</option>
                 </select>
               </div>
               <div>
                  <div className="flex justify-between text-xs mb-1"><span>Target Thrust</span><span className="text-sky-400 font-mono">{thrustGoal} N</span></div>
                  <input type="range" min="100" max="5000" step="50" className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500" value={thrustGoal} onChange={(e) => setThrustGoal(Number(e.target.value))}/>
               </div>
               <div>
                  <div className="flex justify-between text-xs mb-1"><span>Chamber Pressure</span><span className="text-sky-400 font-mono">{chamberPressure} Bar</span></div>
                  <input type="range" min="10" max="150" step="1" className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500" value={chamberPressure} onChange={(e) => setChamberPressure(Number(e.target.value))}/>
               </div>
               <div>
                  <div className="flex justify-between text-xs mb-1"><span>Expansion Ratio</span><span className="text-sky-400 font-mono">{expansionRatio}</span></div>
                  <input type="range" min="2" max="100" step="1" className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500" value={expansionRatio} onChange={(e) => setExpansionRatio(Number(e.target.value))}/>
               </div>
               <div>
                  <div className="flex justify-between text-xs mb-1"><span>Altitude</span><span className="text-sky-400 font-mono">{altitude} m</span></div>
                  <input type="range" min="0" max="50000" step="1000" className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500" value={altitude} onChange={(e) => setAltitude(Number(e.target.value))}/>
               </div>
             </>
          ) : (
             <>
               <div>
                 <label className="text-xs text-violet-300">Field Geometry</label>
                 <select className="w-full bg-violet-900/50 text-sm p-2 rounded mt-1 outline-none text-white border border-violet-800" value={fieldGeometry} onChange={e=>setFieldGeometry(e.target.value)}>
                    <option value="toroidal">Toroidal Engine</option>
                    <option value="spherical">Spherical Core</option>
                    <option value="cylindrical">Cylindrical Drive</option>
                 </select>
               </div>
               <div>
                 <label className="text-xs text-violet-300">Power Source</label>
                 <select className="w-full bg-violet-900/50 text-sm p-2 rounded mt-1 outline-none text-white border border-violet-800" value={powerSource} onChange={e=>setPowerSource(e.target.value)}>
                    <option value="cold_fusion">Cold Fusion Array</option>
                    <option value="antimatter">Antimatter Plasma</option>
                 </select>
               </div>
               <div>
                  <div className="flex justify-between text-xs mb-1"><span>Graviton Flux</span><span className="text-fuchsia-400 font-mono">{gravitonFlux} THz</span></div>
                  <input type="range" min="100" max="2000" step="10" className="w-full h-1 bg-violet-700 rounded-lg appearance-none cursor-pointer accent-fuchsia-500" value={gravitonFlux} onChange={(e) => setGravitonFlux(Number(e.target.value))}/>
               </div>
               <div>
                  <div className="flex justify-between text-xs mb-1"><span>Field Intensity</span><span className="text-fuchsia-400 font-mono">{fieldIntensity} T</span></div>
                  <input type="range" min="0" max="5" step="0.05" className="w-full h-1 bg-violet-700 rounded-lg appearance-none cursor-pointer accent-fuchsia-500" value={fieldIntensity} onChange={(e) => setFieldIntensity(Number(e.target.value))}/>
               </div>
               <div>
                  <div className="flex justify-between text-xs mb-1"><span>Casimir Pressure</span><span className="text-fuchsia-400 font-mono">{casimirPressure} nN</span></div>
                  <input type="range" min="0" max="100" step="1" className="w-full h-1 bg-violet-700 rounded-lg appearance-none cursor-pointer accent-fuchsia-500" value={casimirPressure} onChange={(e) => setCasimirPressure(Number(e.target.value))}/>
               </div>
               <div>
                  <div className="flex justify-between text-xs mb-1"><span>Space-time Permittivity</span><span className="text-fuchsia-400 font-mono">{spacetimePermittivity}</span></div>
                  <input type="range" min="0.1" max="2.0" step="0.1" className="w-full h-1 bg-violet-700 rounded-lg appearance-none cursor-pointer accent-fuchsia-500" value={spacetimePermittivity} onChange={(e) => setSpacetimePermittivity(Number(e.target.value))}/>
               </div>
             </>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 block">AI Specialist Modules</label>
          <div className="space-y-2">
            <button onClick={() => runAiCommand('optimize')} className={cn("w-full flex items-center gap-3 p-2 rounded-lg border transition-all text-sm group", 
                mode === 'Traditional' ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400'
            )}>
              <Wand2 size={16} className="group-hover:scale-110 transition-transform"/>
              <span>✨ Optimize {mode} Core</span>
            </button>
            <button onClick={() => runAiCommand('metallurgy')} className={cn("w-full flex items-center gap-3 p-2 rounded-lg border transition-all text-sm group", 
                mode === 'Traditional' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
            )}>
              <ShieldCheck size={16} className="group-hover:scale-110 transition-transform"/>
              <span>✨ Theoretical Materials</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className={cn("h-20 border-b flex items-center px-8 gap-8 transition-colors duration-700", 
            mode === 'Traditional' ? 'bg-slate-900/30 border-slate-800' : 'bg-violet-900/10 border-violet-800'
        )}>
          {results && mode === 'Traditional' && (
            <>
              <div className="flex flex-col"><span className="text-[10px] uppercase text-slate-500 font-bold">Isp</span><span className="text-2xl font-mono text-emerald-400">{results.isp}s</span></div>
              <div className="flex flex-col"><span className="text-[10px] uppercase text-slate-500 font-bold">Mass Flow</span><span className="text-2xl font-mono text-sky-400">{results.mass_flow}kg/s</span></div>
              <div className="flex flex-col"><span className="text-[10px] uppercase text-slate-500 font-bold">Throat Rad</span><span className="text-2xl font-mono text-amber-400">{results.throat_radius_mm}mm</span></div>
              <div className="flex flex-col"><span className="text-[10px] uppercase text-slate-500 font-bold">Exit Rad</span><span className="text-2xl font-mono text-orange-400">{results.exit_radius_mm}mm</span></div>
            </>
          )}
          {results && mode === 'Antigravity' && (
            <>
              <div className="flex flex-col"><span className="text-[10px] uppercase text-fuchsia-500/60 font-bold tracking-widest">Lift Force</span><span className="text-2xl font-mono text-fuchsia-400">{results.lift_kn} kN</span></div>
              <div className="flex flex-col"><span className="text-[10px] uppercase text-violet-500/60 font-bold tracking-widest">Mass Reduc.</span><span className="text-2xl font-mono text-violet-400">{results.mass_reduction_pct}%</span></div>
              <div className="flex flex-col"><span className="text-[10px] uppercase text-cyan-500/60 font-bold tracking-widest">Warp Factor</span><span className="text-2xl font-mono text-cyan-400">{results.warp_factor}</span></div>
              <div className="flex flex-col"><span className="text-[10px] uppercase text-amber-500/60 font-bold tracking-widest">Power Draw</span><span className="text-2xl font-mono text-amber-400">{results.power_draw_kw} kW</span></div>
            </>
          )}
        </header>

        <div className="flex-1 p-8 overflow-y-auto space-y-8 custom-scrollbar">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className={cn("border rounded-xl p-6 backdrop-blur-sm shadow-xl transition-colors duration-700 flex flex-col min-h-[300px]", 
                mode === 'Traditional' ? 'bg-slate-900/80 border-slate-800' : 'bg-violet-900/40 border-violet-800'
            )}>
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 flex-none">
                <Database size={16} className={mode === 'Traditional' ? "text-sky-400" : "text-fuchsia-400"}/>
                {mode === 'Traditional' ? 'THRUST TRACE' : 'GRAVITON FLUX STABILITY'}
              </h3>
              <div className="flex-1 w-full relative">
                {results && results.sim_data && (
                  <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
                    <AreaChart data={results.sim_data}>
                      <defs>
                        <linearGradient id="colorVal1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={mode === 'Traditional' ? "#0ea5e9" : "#d946ef"} stopOpacity={0.3}/><stop offset="95%" stopColor={mode === 'Traditional' ? "#0ea5e9" : "#d946ef"} stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="time" hide />
                      <YAxis stroke="#64748b" fontSize={10} hide />
                      <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '8px'}} />
                      <Area type="monotone" dataKey="val1" stroke={mode === 'Traditional' ? "#0ea5e9" : "#d946ef"} fillOpacity={1} fill="url(#colorVal1)" strokeWidth={2} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            
            {/* 2D VISUALIZER */}
            <div className={cn("border rounded-xl p-8 backdrop-blur-sm relative overflow-hidden shadow-xl transition-colors duration-700 min-h-[300px]", 
                mode === 'Traditional' ? 'bg-slate-900/80 border-slate-800' : 'bg-violet-900/40 border-violet-800'
            )}>
               <h3 className="text-sm font-bold mb-8 uppercase tracking-widest opacity-60">
                 {mode === 'Traditional' ? `Engine Cross-Section [${combustionCycle}]` : `Gravitational Core [${fieldGeometry}]`}
               </h3>
               <div className="flex justify-center items-center h-48 relative">
                  {mode === 'Traditional' ? (
                     <div className="relative">
                        <svg viewBox="0 0 400 200" className="w-full max-w-sm">
                           <path d={`M 50 60 L 150 60 L 180 ${100 - (100/(expansionRatio)) } L 280 20 L 280 180 L 180 ${100 + (100/(expansionRatio))} L 150 140 L 50 140 Z`} fill="none" stroke="#38bdf8" strokeWidth="2" className="transition-all duration-300"/>
                           <path d={`M 55 65 L 145 65 L 175 ${100 - (100/(expansionRatio)) + 2} L 275 25 L 275 175 L 175 ${100 + (100/(expansionRatio)) - 2} L 145 135 L 55 135 Z`} fill="rgba(244, 63, 94, 0.1)" className="animate-pulse transition-all duration-300" />
                        </svg>
                     </div>
                  ) : (
                    <div className="relative flex justify-center items-center">
                      {fieldGeometry === 'toroidal' && <div className="absolute w-32 h-32 border-4 border-fuchsia-500/40 rounded-full animate-ping" />}
                      {fieldGeometry === 'spherical' && <div className="absolute w-24 h-24 bg-cyan-500/20 rounded-full animate-bounce" />}
                      <div className="absolute w-28 h-28 bg-violet-500/40 rounded-full blur-2xl animate-pulse" />
                      <Atom size={64} className="text-fuchsia-400 animate-[spin_3s_linear_infinite]" />
                      <div className="absolute -top-12 text-[10px] font-mono text-cyan-400 bg-black/50 px-2 py-1 rounded">Source: {powerSource}</div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>

        {/* AI CONSOLE */}
        <div className={cn("h-72 border-t flex shadow-2xl transition-colors duration-700 block shrink-0", 
            mode === 'Traditional' ? 'bg-slate-900/80 border-slate-800' : 'bg-violet-950/80 border-violet-900'
        )}>
          <div className="w-1/3 border-r border-slate-800/50 p-4 overflow-y-auto">
            <h4 className="text-xs font-bold text-slate-400 flex items-center gap-2 mb-4 uppercase tracking-widest">
              <Sparkles size={14} className={mode === 'Traditional' ? "text-amber-500" : "text-fuchsia-500"}/>
              Telemetry Intel
            </h4>
            <div className="space-y-2">
              <div className={cn("p-3 rounded-lg text-xs border", 
                  mode === 'Traditional' ? 'bg-sky-500/10 border-sky-500/20 text-sky-200' : 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-200'
              )}>
                {mode === 'Traditional' 
                ? `Current parameters yield an estimated ISP of ${results?.isp || 0}s. Keep expansion ratio checked for external pressure matching.` 
                : `Space-time warping factor is at ${results?.warp_factor || 0}. Keep Casimir pressure within tolerances.`}
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col relative w-2/3">
            {isAiLoading && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center"><Loader2 className="animate-spin text-sky-400" size={32} /></div>}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={cn("max-w-[85%] rounded-2xl p-4 text-sm relative group", 
                      msg.role === 'user' 
                      ? (mode === 'Traditional' ? 'bg-sky-600 text-white' : 'bg-fuchsia-600 text-white') 
                      : 'bg-white/5 text-slate-200 border border-white/10'
                  )}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase opacity-50">{msg.role}</span>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-black/40 flex gap-2">
              <input 
                type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Ask the ${mode === 'Traditional' ? 'LRE' : 'Quantum'} Engineer...`}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
              />
              <button onClick={handleSendMessage} className={cn("p-3 rounded-xl transition-colors shadow-lg", 
                  mode === 'Traditional' ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-500/20' : 'bg-fuchsia-600 hover:bg-fuchsia-500 shadow-fuchsia-500/20'
              )}>
                <MessageSquare size={20} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
