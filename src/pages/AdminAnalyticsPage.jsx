import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  Leaf,
  Cpu,
  Download,
  Calendar,
  Layers,
  FileText,
  Activity,
  CheckCircle2,
} from 'lucide-react'
import { TrafficService } from '../services/api'
import CorridorThroughputChart from '../components/analytics/CorridorThroughputChart'
import EnvironmentalImpactWidget from '../components/analytics/EnvironmentalImpactWidget'
import SensorHealthGrid from '../components/analytics/SensorHealthGrid'
import SectorThroughputComparison from '../components/analytics/SectorThroughputComparison'
import StatCard from '../components/common/StatCard'
import Button from '../components/common/Button'
import { useTraffic } from '../context/TrafficContext'

export default function AdminAnalyticsPage() {
  const { addToast } = useTraffic()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const res = await TrafficService.getAnalytics('7d')
        if (res.success) {
          setAnalytics(res.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  const handleGenerateReport = () => {
    addToast({
      type: 'success',
      title: 'City Telemetry Report Generated',
      message: 'Comprehensive PDF audit report compiled: "Metropolis_Traffic_Audit_Q4.pdf"',
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Smart City Analytics & Infrastructure Telemetry
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              AUDIT READY
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Historical corridor throughput, emission savings, peak load dynamics, and IoT sensor network health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={FileText}
            onClick={handleGenerateReport}
          >
            Generate Executive Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Weekly Volume"
          value="4.45M"
          unit="vehicles"
          change={6.4}
          trend="up"
          color="cyan"
          icon={Activity}
          changeLabel="through urban grid"
        />

        <StatCard
          title="Average Corridor Speed"
          value="45.6"
          unit="km/h"
          change={8.2}
          trend="up"
          color="emerald"
          icon={TrendingUp}
          changeLabel="+3.4 km/h improvement"
        />

        <StatCard
          title="Avoided Idle Fuel"
          value="14,200"
          unit="liters"
          change={18.5}
          trend="up"
          color="amber"
          icon={Leaf}
          changeLabel="emission reductions"
        />

        <StatCard
          title="IoT Network Uptime"
          value="99.4%"
          change={0.2}
          trend="up"
          color="blue"
          icon={Cpu}
          changeLabel="nominal sensor health"
        />
      </div>

      {/* Main Corridor Volume & Speed Chart */}
      <CorridorThroughputChart dailyData={analytics?.dailyVolume || []} />

      {/* Environmental & Carbon Offset Widget */}
      <EnvironmentalImpactWidget />

      {/* Sector Peak Hour Demand Comparison */}
      <SectorThroughputComparison data={analytics?.throughputBySector || []} />

      {/* Hardware & IoT Sensor Diagnostics Grid */}
      <SensorHealthGrid healthData={analytics?.infrastructureHealth} />
    </div>
  )
}

