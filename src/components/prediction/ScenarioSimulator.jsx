import React, { useState } from 'react'
import {
  Sliders,
  CloudRain,
  Sun,
  CloudLightning,
  Music,
  Trophy,
  AlertOctagon,
  Sparkles,
  Zap,
  Play,
  RotateCcw,
  CheckCircle,
} from 'lucide-react'
import { TrafficService } from '../../services/api'
import Button from '../common/Button'
import Badge from '../common/Badge'

export default function ScenarioSimulator({ onSimulationResult }) {
  const [weather, setWeather] = useState('clear') // 'clear' | 'rain' | 'storm'
  const [event, setEvent] = useState('none') // 'none' | 'concert' | 'sports'
  const [roadClosure, setRoadClosure] = useState(false)
  const [aiInterventionActive, setAiInterventionActive] = useState(true)
  const [isSimulating, setIsSimulating] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  const handleRunSimulation = async () => {
    try {
      setIsSimulating(true)
      const res = await TrafficService.simulateScenario({
        weather,
        event,
        roadClosure,
        aiInterventionActive,
      })
      if (res.success) {
        setLastResult(res.data)
        if (onSimulationResult) {
          onSimulationResult(res.data.simulatedCurves)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSimulating(false)
    }
  }

  const handleReset = () => {
    setWeather('clear')
    setEvent('none')
    setRoadClosure(false)
    setAiInterventionActive(true)
    setLastResult(null)
  }

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">"What-If" Scenario Simulator</h3>
            <p className="text-xs text-slate-400">Model unexpected weather shocks, mass events & incidents</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset} icon={RotateCcw} className="text-xs">
          Reset
        </Button>
      </div>

      <div className="mt-4 space-y-4 flex-1">
        {/* Weather Conditions */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
            Simulated Weather Condition
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'clear', label: 'Clear Sky', icon: Sun, impact: 'Baseline' },
              { id: 'rain', label: 'Monsoon Rain', icon: CloudRain, impact: '+22% delay' },
              { id: 'storm', label: 'Severe Storm', icon: CloudLightning, impact: '+45% delay' },
            ].map((item) => {
              const Icon = item.icon
              const isSelected = weather === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setWeather(item.id)}
                  className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-md shadow-purple-950/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-purple-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-semibold text-white">{item.label}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">{item.impact}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Major Public Events */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
            Simulated City Event / Gathering
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'none', label: 'Standard Day', icon: Sparkles, impact: 'Normal load' },
              { id: 'concert', label: 'Arena Concert', icon: Music, impact: '+35k crowd' },
              { id: 'sports', label: 'Stadium Derby', icon: Trophy, impact: '+50k crowd' },
            ].map((item) => {
              const Icon = item.icon
              const isSelected = event === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setEvent(item.id)}
                  className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-md shadow-purple-950/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-purple-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-semibold text-white">{item.label}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">{item.impact}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Toggles: Road Closure & AI Mitigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Road closure toggle */}
          <div
            onClick={() => setRoadClosure(!roadClosure)}
            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              roadClosure
                ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertOctagon className={`w-4 h-4 ${roadClosure ? 'text-rose-400' : 'text-slate-500'}`} />
              <div className="text-left">
                <div className="text-xs font-semibold text-white">East Port Flyover Closed</div>
                <div className="text-[10px] text-slate-500">Simulate emergency lane closure</div>
              </div>
            </div>
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center ${
                roadClosure ? 'bg-rose-500 border-rose-400 text-black' : 'border-slate-700'
              }`}
            >
              {roadClosure && <CheckCircle className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* AI Autonomous Mitigation Switch */}
          <div
            onClick={() => setAiInterventionActive(!aiInterventionActive)}
            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              aiInterventionActive
                ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${aiInterventionActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <div className="text-left">
                <div className="text-xs font-semibold text-white">AI Mitigation Engine</div>
                <div className="text-[10px] text-slate-500">Auto dynamic rerouting & green waves</div>
              </div>
            </div>
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center ${
                aiInterventionActive ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-700'
              }`}
            >
              {aiInterventionActive && <CheckCircle className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          variant="primary"
          icon={Play}
          loading={isSimulating}
          onClick={handleRunSimulation}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30 border-purple-500/40"
        >
          Run ML Scenario Simulation
        </Button>

        {/* Simulation Output Banner */}
        {lastResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/40 space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Simulation Projection Results
              </span>
              <Badge variant="purple" size="sm">
                +{lastResult.impactFactor.toFixed(0)}% Surge
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-500">DELAY SURGE</div>
                <div className="text-sm font-bold text-rose-400">+{lastResult.estimatedCityDelayMin}m</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-500">PEAK CONGESTION</div>
                <div className="text-sm font-bold text-amber-400">{lastResult.predictedCongestionPeak}%</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-500">AI SAVED</div>
                <div className="text-sm font-bold text-emerald-400">-{lastResult.aiSavedMinutes}m</div>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-[11px] font-semibold text-purple-300">AI Mitigation Directives:</div>
              {lastResult.recommendations.map((rec, i) => (
                <div key={i} className="text-slate-300 flex items-start gap-1.5 text-[11px]">
                  <span className="text-purple-400">•</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

