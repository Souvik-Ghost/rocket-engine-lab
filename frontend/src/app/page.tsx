"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Zap,
  Database,
  MessageSquare,
  Wand2,
  ShieldCheck,
  Orbit,
  Atom,
  Loader2,
  Sparkles,
  WifiOff,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────
interface SimPoint {
  time: number;
  val1: number;
  val2: number;
}

interface LREResult {
  isp: number;
  mass_flow: number;
  throat_radius_mm: number;
  exit_radius_mm: number;
  efficiency: number;
  error?: string;
  sim_data: SimPoint[];
}

interface AGResult {
  lift_kn: number;
  mass_reduction_pct: number;
  warp_factor: number;
  power_draw_kw: number;
  efficiency: number;
  sim_data: SimPoint[];
}

type SimResult = LREResult | AGResult | null;

interface ChatMsg {
  role: "user" | "assistant";
  text: string;
}

// ── Constants ──────────────────────────────────────────────────────
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Component ──────────────────────────────────────────────────────
export default function LRELab() {
  const [mode, setMode] = useState<"Traditional" | "Antigravity">(
    "Traditional"
  );
  const [apiKey, setApiKey] = useState("");
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Traditional params
  const [thrustGoal, setThrustGoal] = useState(500);
  const [chamberPressure, setChamberPressure] = useState(20);
  const [propellant, setPropellant] = useState("LOX/RP-1");
  const [expansionRatio, setExpansionRatio] = useState(12);
  const [combustionCycle, setCombustionCycle] = useState("staged_combustion");
  const [altitude, setAltitude] = useState(0);

  // Antigravity params
  const [gravitonFlux, setGravitonFlux] = useState(450);
  const [fieldIntensity, setFieldIntensity] = useState(0.85);
  const [casimirPressure, setCasimirPressure] = useState(12.5);
  const [spacetimePermittivity, setSpacetimePermittivity] = useState(1.0);
  const [fieldGeometry, setFieldGeometry] = useState("toroidal");
  const [powerSource, setPowerSource] = useState("cold_fusion");

  // Results & AI state
  const [results, setResults] = useState<SimResult>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([
    {
      role: "assistant",
      text: "Welcome to the Propulsion Lab. System online.",
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Health check ────────────────────────────────────────────────
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_URL}/health`);
        setBackendOnline(res.ok);
      } catch {
        setBackendOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // ── Auto-scroll chat ───────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // ── Debounced simulation ────────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSimulation = useCallback(async () => {
    try {
      if (mode === "Traditional") {
        const res = await fetch(`${API_URL}/simulate/lre`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_thrust_N: thrustGoal,
            chamber_pressure_bar: chamberPressure,
            propellant,
            expansion_ratio: expansionRatio,
            combustion_cycle: combustionCycle,
            altitude_m: altitude,
          }),
        });
        const data: LREResult = await res.json();
        setResults(data);
        setBackendOnline(true);
      } else {
        const res = await fetch(`${API_URL}/simulate/ag`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            graviton_flux_thz: gravitonFlux,
            field_intensity_t: fieldIntensity,
            casimir_pressure_nn: casimirPressure,
            spacetime_permittivity: spacetimePermittivity,
            field_geometry: fieldGeometry,
            power_source: powerSource,
          }),
        });
        const data: AGResult = await res.json();
        setResults(data);
        setBackendOnline(true);
      }
    } catch {
      setBackendOnline(false);
    }
  }, [
    mode,
    thrustGoal,
    chamberPressure,
    propellant,
    expansionRatio,
    combustionCycle,
    altitude,
    gravitonFlux,
    fieldIntensity,
    casimirPressure,
    spacetimePermittivity,
    fieldGeometry,
    powerSource,
  ]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSimulation();
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [runSimulation]);

  // ── AI handlers ─────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory((prev) => [...prev, { role: "user", text: userMsg }]);

    setIsAiLoading(true);
    try {
      const res = await fetch(`${API_URL}/ai/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          command: "chat",
          context: "",
          message: userMsg,
          apiKey,
        }),
      });
      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.ok
            ? data.response
            : `Error: ${data.detail || "Communication failure."}`,
        },
      ]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", text: "API offline or error." },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const runAiCommand = async (commandType: string) => {
    setIsAiLoading(true);
    const context =
      mode === "Traditional"
        ? `Thrust ${thrustGoal}N, Pc ${chamberPressure}bar, Propellant ${propellant}`
        : `Graviton Flux ${gravitonFlux}THz, Intensity ${fieldIntensity}T, Casimir Pressure ${casimirPressure}nN`;

    try {
      const res = await fetch(`${API_URL}/ai/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, command: commandType, context, apiKey }),
      });
      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.ok
            ? `✨ [${mode.toUpperCase()} ${commandType.toUpperCase()}] \n\n ${data.response}`
            : `✨ [ERROR] \n\n ${data.detail}`,
        },
      ]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", text: "Engineering link lost." },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────
  const isLRE = mode === "Traditional";
  const lreResults = results as LREResult | null;
  const agResults = results as AGResult | null;

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        "flex h-screen overflow-hidden font-sans transition-colors duration-700",
        isLRE ? "bg-slate-950 text-slate-100" : "bg-indigo-950 text-indigo-100"
      )}
    >
      {/* ── SIDEBAR ──────────────────────────────────────────── */}
      <aside
        className={cn(
          "w-80 border-r p-6 flex flex-col overflow-y-auto transition-colors duration-700 custom-scrollbar",
          isLRE
            ? "bg-slate-900/50 border-slate-800"
            : "bg-violet-900/30 border-violet-800"
        )}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              "p-2 rounded-lg shadow-lg transition-colors duration-700",
              isLRE
                ? "bg-sky-500 shadow-sky-500/20"
                : "bg-fuchsia-500 shadow-fuchsia-500/20"
            )}
          >
            {isLRE ? (
              <Zap size={24} className="text-white" />
            ) : (
              <Orbit size={24} className="text-white" />
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            {isLRE ? "LRE Lab" : "AG-Lab"}
          </h1>
          {/* Connection indicator */}
          <div className="ml-auto" title={backendOnline ? "Backend connected" : "Backend offline"}>
            {backendOnline === false ? (
              <WifiOff size={16} className="text-red-400 animate-pulse" />
            ) : backendOnline === true ? (
              <Wifi size={16} className="text-emerald-400" />
            ) : (
              <Loader2 size={16} className="text-slate-500 animate-spin" />
            )}
          </div>
        </div>

        {/* API Key */}
        <div className="mb-4">
          <input
            type="password"
            placeholder="Gemini API Key (optional)"
            className="w-full text-xs p-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:ring-1 focus:ring-sky-500/50 transition-all"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        {/* Mode toggle */}
        <div className="flex p-1 bg-black/30 rounded-xl mb-6">
          <button
            onClick={() => setMode("Traditional")}
            className={cn(
              "flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all",
              isLRE
                ? "bg-sky-600 text-white shadow-lg"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            Traditional
          </button>
          <button
            onClick={() => setMode("Antigravity")}
            className={cn(
              "flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all",
              !isLRE
                ? "bg-fuchsia-600 text-white shadow-lg"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            Antigravity
          </button>
        </div>

        {/* ── Parameters ── */}
        <div className="space-y-5 flex-1">
          {isLRE ? (
            <>
              <div>
                <label className="text-xs text-slate-400">
                  Propellant Type
                </label>
                <select
                  className="w-full bg-slate-800 text-sm p-2 rounded mt-1 outline-none text-white border border-slate-700"
                  value={propellant}
                  onChange={(e) => setPropellant(e.target.value)}
                >
                  <option value="LOX/RP-1">LOX / RP-1</option>
                  <option value="LH2/LOX">LH2 / LOX</option>
                  <option value="Methane/LOX">CH4 / LOX</option>
                  <option value="Hydrazine/NTO">Hydrazine / NTO</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">
                  Combustion Cycle
                </label>
                <select
                  className="w-full bg-slate-800 text-sm p-2 rounded mt-1 outline-none text-white border border-slate-700"
                  value={combustionCycle}
                  onChange={(e) => setCombustionCycle(e.target.value)}
                >
                  <option value="gas_generator">Gas Generator</option>
                  <option value="staged_combustion">Staged Combustion</option>
                </select>
              </div>
              <SliderField
                label="Target Thrust"
                value={thrustGoal}
                unit="N"
                min={100}
                max={5000}
                step={50}
                onChange={setThrustGoal}
                accent="sky"
              />
              <SliderField
                label="Chamber Pressure"
                value={chamberPressure}
                unit="Bar"
                min={10}
                max={150}
                step={1}
                onChange={setChamberPressure}
                accent="sky"
              />
              <SliderField
                label="Expansion Ratio"
                value={expansionRatio}
                unit=""
                min={2}
                max={100}
                step={1}
                onChange={setExpansionRatio}
                accent="sky"
              />
              <SliderField
                label="Altitude"
                value={altitude}
                unit="m"
                min={0}
                max={50000}
                step={1000}
                onChange={setAltitude}
                accent="sky"
              />
            </>
          ) : (
            <>
              <div>
                <label className="text-xs text-violet-300">
                  Field Geometry
                </label>
                <select
                  className="w-full bg-violet-900/50 text-sm p-2 rounded mt-1 outline-none text-white border border-violet-800"
                  value={fieldGeometry}
                  onChange={(e) => setFieldGeometry(e.target.value)}
                >
                  <option value="toroidal">Toroidal Engine</option>
                  <option value="spherical">Spherical Core</option>
                  <option value="cylindrical">Cylindrical Drive</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-violet-300">Power Source</label>
                <select
                  className="w-full bg-violet-900/50 text-sm p-2 rounded mt-1 outline-none text-white border border-violet-800"
                  value={powerSource}
                  onChange={(e) => setPowerSource(e.target.value)}
                >
                  <option value="cold_fusion">Cold Fusion Array</option>
                  <option value="antimatter">Antimatter Plasma</option>
                </select>
              </div>
              <SliderField
                label="Graviton Flux"
                value={gravitonFlux}
                unit="THz"
                min={100}
                max={2000}
                step={10}
                onChange={setGravitonFlux}
                accent="fuchsia"
              />
              <SliderField
                label="Field Intensity"
                value={fieldIntensity}
                unit="T"
                min={0}
                max={5}
                step={0.05}
                onChange={setFieldIntensity}
                accent="fuchsia"
              />
              <SliderField
                label="Casimir Pressure"
                value={casimirPressure}
                unit="nN"
                min={0}
                max={100}
                step={1}
                onChange={setCasimirPressure}
                accent="fuchsia"
              />
              <SliderField
                label="Space-time Permittivity"
                value={spacetimePermittivity}
                unit=""
                min={0.1}
                max={2.0}
                step={0.1}
                onChange={setSpacetimePermittivity}
                accent="fuchsia"
              />
            </>
          )}
        </div>

        {/* AI Modules */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 block">
            AI Specialist Modules
          </label>
          <div className="space-y-2">
            <button
              onClick={() => runAiCommand("optimize")}
              className={cn(
                "w-full flex items-center gap-3 p-2 rounded-lg border transition-all text-sm group",
                isLRE
                  ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                  : "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400"
              )}
            >
              <Wand2
                size={16}
                className="group-hover:scale-110 transition-transform"
              />
              <span>✨ Optimize {mode} Core</span>
            </button>
            <button
              onClick={() => runAiCommand("metallurgy")}
              className={cn(
                "w-full flex items-center gap-3 p-2 rounded-lg border transition-all text-sm group",
                isLRE
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
              )}
            >
              <ShieldCheck
                size={16}
                className="group-hover:scale-110 transition-transform"
              />
              <span>✨ Theoretical Materials</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN VIEWPORT ──────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header metrics */}
        <header
          className={cn(
            "h-20 border-b flex items-center px-8 gap-8 transition-colors duration-700",
            isLRE
              ? "bg-slate-900/30 border-slate-800"
              : "bg-violet-900/10 border-violet-800"
          )}
        >
          {results && isLRE && lreResults && (
            <>
              <Metric label="Isp" value={`${lreResults.isp}s`} color="text-emerald-400" />
              <Metric label="Mass Flow" value={`${lreResults.mass_flow}kg/s`} color="text-sky-400" />
              <Metric label="Throat Rad" value={`${lreResults.throat_radius_mm}mm`} color="text-amber-400" />
              <Metric label="Exit Rad" value={`${lreResults.exit_radius_mm}mm`} color="text-orange-400" />
              <Metric label="Efficiency" value={`${lreResults.efficiency}%`} color="text-lime-400" />
            </>
          )}
          {results && !isLRE && agResults && (
            <>
              <Metric label="Lift Force" value={`${agResults.lift_kn} kN`} color="text-fuchsia-400" labelColor="text-fuchsia-500/60" />
              <Metric label="Mass Reduc." value={`${agResults.mass_reduction_pct}%`} color="text-violet-400" labelColor="text-violet-500/60" />
              <Metric label="Warp Factor" value={`${agResults.warp_factor}`} color="text-cyan-400" labelColor="text-cyan-500/60" />
              <Metric label="Power Draw" value={`${agResults.power_draw_kw} kW`} color="text-amber-400" labelColor="text-amber-500/60" />
            </>
          )}
        </header>

        {/* Charts + Visualizer */}
        <div className="flex-1 p-8 overflow-y-auto space-y-8 custom-scrollbar">
          {/* Error banner */}
          {results && "error" in results && (results as LREResult).error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg p-3">
              ⚠️ {(results as LREResult).error}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Chart panel */}
            <div
              className={cn(
                "border rounded-xl p-6 backdrop-blur-sm shadow-xl transition-colors duration-700 flex flex-col min-h-[300px]",
                isLRE
                  ? "bg-slate-900/80 border-slate-800"
                  : "bg-violet-900/40 border-violet-800"
              )}
            >
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 flex-none">
                <Database
                  size={16}
                  className={isLRE ? "text-sky-400" : "text-fuchsia-400"}
                />
                {isLRE ? "THRUST TRACE" : "GRAVITON FLUX STABILITY"}
              </h3>
              <div className="flex-1 w-full relative">
                {results && results.sim_data && (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    className="absolute inset-0"
                  >
                    <AreaChart data={results.sim_data}>
                      <defs>
                        <linearGradient id="colorVal1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isLRE ? "#0ea5e9" : "#d946ef"} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={isLRE ? "#0ea5e9" : "#d946ef"} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorVal2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isLRE ? "#f59e0b" : "#06b6d4"} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={isLRE ? "#f59e0b" : "#06b6d4"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="time" hide />
                      <YAxis yAxisId="left" stroke="#64748b" fontSize={10} hide />
                      <YAxis yAxisId="right" orientation="right" hide />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px" }} />
                      <Area yAxisId="left" type="monotone" dataKey="val1" name={isLRE ? "Thrust (N)" : "Flux (THz)"} stroke={isLRE ? "#0ea5e9" : "#d946ef"} fillOpacity={1} fill="url(#colorVal1)" strokeWidth={2} isAnimationActive={false} />
                      <Area yAxisId="right" type="monotone" dataKey="val2" name={isLRE ? "Pressure (Bar)" : "Intensity (%)"} stroke={isLRE ? "#f59e0b" : "#06b6d4"} fillOpacity={1} fill="url(#colorVal2)" strokeWidth={1.5} strokeDasharray="4 2" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 2D Visualizer */}
            <div
              className={cn(
                "border rounded-xl p-8 backdrop-blur-sm relative overflow-hidden shadow-xl transition-colors duration-700 min-h-[300px]",
                isLRE
                  ? "bg-slate-900/80 border-slate-800"
                  : "bg-violet-900/40 border-violet-800"
              )}
            >
              <h3 className="text-sm font-bold mb-8 uppercase tracking-widest opacity-60">
                {isLRE
                  ? `Engine Cross-Section [${combustionCycle}]`
                  : `Gravitational Core [${fieldGeometry}]`}
              </h3>
              <div className="flex justify-center items-center h-48 relative">
                {isLRE ? (
                  <div className="relative">
                    <svg viewBox="0 0 400 200" className="w-full max-w-sm">
                      <path
                        d={`M 50 60 L 150 60 L 180 ${100 - 100 / expansionRatio} L 280 20 L 280 180 L 180 ${100 + 100 / expansionRatio} L 150 140 L 50 140 Z`}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        className="transition-all duration-300"
                      />
                      <path
                        d={`M 55 65 L 145 65 L 175 ${100 - 100 / expansionRatio + 2} L 275 25 L 275 175 L 175 ${100 + 100 / expansionRatio - 2} L 145 135 L 55 135 Z`}
                        fill="rgba(244, 63, 94, 0.1)"
                        className="animate-pulse transition-all duration-300"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="relative flex justify-center items-center">
                    {fieldGeometry === "toroidal" && (
                      <div className="absolute w-32 h-32 border-4 border-fuchsia-500/40 rounded-full animate-ping" />
                    )}
                    {fieldGeometry === "spherical" && (
                      <div className="absolute w-24 h-24 bg-cyan-500/20 rounded-full animate-bounce" />
                    )}
                    <div className="absolute w-28 h-28 bg-violet-500/40 rounded-full blur-2xl animate-pulse" />
                    <Atom
                      size={64}
                      className="text-fuchsia-400 animate-[spin_3s_linear_infinite]"
                    />
                    <div className="absolute -top-12 text-[10px] font-mono text-cyan-400 bg-black/50 px-2 py-1 rounded">
                      Source: {powerSource}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── AI Console ─────────────────────────────────────── */}
        <div
          className={cn(
            "h-72 border-t flex shadow-2xl transition-colors duration-700 shrink-0",
            isLRE
              ? "bg-slate-900/80 border-slate-800"
              : "bg-violet-950/80 border-violet-900"
          )}
        >
          {/* Intel panel */}
          <div className="w-1/3 border-r border-slate-800/50 p-4 overflow-y-auto custom-scrollbar">
            <h4 className="text-xs font-bold text-slate-400 flex items-center gap-2 mb-4 uppercase tracking-widest">
              <Sparkles
                size={14}
                className={isLRE ? "text-amber-500" : "text-fuchsia-500"}
              />
              Telemetry Intel
            </h4>
            <div className="space-y-2">
              <div
                className={cn(
                  "p-3 rounded-lg text-xs border",
                  isLRE
                    ? "bg-sky-500/10 border-sky-500/20 text-sky-200"
                    : "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-200"
                )}
              >
                {isLRE
                  ? `Current parameters yield an estimated ISP of ${lreResults?.isp || 0}s. Keep expansion ratio checked for external pressure matching.`
                  : `Space-time warping factor is at ${agResults?.warp_factor || 0}. Keep Casimir pressure within tolerances.`}
              </div>
            </div>
          </div>

          {/* Chat panel */}
          <div className="flex-1 flex flex-col relative w-2/3">
            {isAiLoading && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-sky-400" size={32} />
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl p-4 text-sm relative group",
                      msg.role === "user"
                        ? isLRE
                          ? "bg-sky-600 text-white"
                          : "bg-fuchsia-600 text-white"
                        : "bg-white/5 text-slate-200 border border-white/10"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase opacity-50">
                        {msg.role}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 bg-black/40 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={`Ask the ${isLRE ? "LRE" : "Quantum"} Engineer...`}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
              />
              <button
                onClick={handleSendMessage}
                className={cn(
                  "p-3 rounded-xl transition-colors shadow-lg",
                  isLRE
                    ? "bg-sky-600 hover:bg-sky-500 shadow-sky-500/20"
                    : "bg-fuchsia-600 hover:bg-fuchsia-500 shadow-fuchsia-500/20"
                )}
              >
                <MessageSquare size={20} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function Metric({
  label,
  value,
  color,
  labelColor = "text-slate-500",
}: {
  label: string;
  value: string;
  color: string;
  labelColor?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className={`text-[10px] uppercase font-bold tracking-widest ${labelColor}`}>
        {label}
      </span>
      <span className={`text-2xl font-mono ${color}`}>{value}</span>
    </div>
  );
}

function SliderField({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
  accent,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  accent: "sky" | "fuchsia";
}) {
  const accentColor = accent === "sky" ? "text-sky-400" : "text-fuchsia-400";
  const trackColor = accent === "sky" ? "bg-slate-700" : "bg-violet-700";
  const thumbColor = accent === "sky" ? "accent-sky-500" : "accent-fuchsia-500";

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span className={`${accentColor} font-mono`}>
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        className={`w-full h-1 ${trackColor} rounded-lg appearance-none cursor-pointer ${thumbColor}`}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
