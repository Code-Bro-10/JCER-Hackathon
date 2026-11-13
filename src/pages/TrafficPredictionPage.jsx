import React, { useState, useEffect } from 'react'
import { BrainCircuit, Sparkles, Sliders, RefreshCw, Layers, Cpu, Zap, Activity } from 'lucide-react'
import { TrafficService } from '../services/api'
import PredictionCurves from '../components/prediction/PredictionCurves'
import ScenarioSimulator from '../components/prediction/ScenarioSimulator'
import BottleneckMatrix from '../components/prediction/BottleneckMatrix'
import StatCard from '../components/common/StatCard'
import Button from '../components/common/Button'

export default function TrafficPredictionPage() {
  const [predictionData, setPredictionData] = useState(null)
  const [curves, setCurves] = useState([])
  const [loading, setLoading] = useState(true)

  const loadPredictions = async () => {
    try {
      setLoading(true)
      const res = await TrafficService.getPredictions()
      if (res.success) {
        setPredictionData(res.data)
        setCurves(res.data.hourlyCurves)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPredictions()
  }, [])

  const handleSimulationCurvesUpdate = (newCurves) => {
    setCurves(newCurves)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Predictive Traffic Intelligence & Simulation
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
              GNN + LSTM v4.2
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Machine learning neural forecasts, congestion risk modeling, and interactive "What-If" stress testing.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={loadPredictions}
          loading={loading}
        >
          Re-Run Model Inference
        </Button>
      </div>

      {/* Model KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Prediction Accuracy"
          value="96.4%"
          change={1.2}
          trend="up"
          color="cyan"
          icon={BrainCircuit}
          changeLabel="evaluated vs ground truth"
        />

        <StatCard
          title="Peak Delay Avoided"
          value="24.8"
          unit="min/veh"
          change={8.5}
          trend="up"
          color="emerald"
          icon={Zap}
          changeLabel="via dynamic signal shifts"
        />

        <StatCard
          title="Bottlenecks Tracked"
          value="4 Active"
          unit="intersections"
          change={-25}
          trend="up"
          color="amber"
          icon={Activity}
          changeLabel="clearing in &lt;18 mins"
        />

        <StatCard
          title="Edge Neural Latency"
          value="14.2"
          unit="ms"
          change={-2.1}
          trend="up"
          color="blue"
          icon={Cpu}
          changeLabel="ultra-low edge inference"
        />
      </div>

      {/* Main Prediction & Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <PredictionCurves
            data={curves}
            modelInfo={predictionData?.modelMetadata}
          />
        </div>

        <div className="lg:col-span-4">
          <ScenarioSimulator onSimulationResult={handleSimulationCurvesUpdate} />
        </div>
      </div>

      {/* Bottleneck Risk Matrix */}
      <BottleneckMatrix bottlenecks={predictionData?.bottlenecks || []} />
    </div>
  )
}

