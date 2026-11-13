import React, { useState, useMemo } from 'react'
import {
  AlertTriangle,
  Plus,
  ShieldAlert,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react'
import { useTraffic } from '../context/TrafficContext'
import { TrafficService } from '../services/api'
import IncidentFilters from '../components/incidents/IncidentFilters'
import IncidentCard from '../components/incidents/IncidentCard'
import ReportIncidentModal from '../components/incidents/ReportIncidentModal'
import IncidentDetailModal from '../components/incidents/IncidentDetailModal'
import StatCard from '../components/common/StatCard'
import Button from '../components/common/Button'

export default function IncidentManagementPage() {
  const { incidents, setIncidents, addToast, refreshData } = useTraffic()

  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('All Sectors')
  const [severity, setSeverity] = useState('ALL')
  const [status, setStatus] = useState('ALL')

  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState(null)

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (sector !== 'All Sectors' && inc.sector !== sector) return false
      if (severity !== 'ALL' && inc.severity !== severity) return false
      if (status !== 'ALL' && inc.status !== status) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchesTitle = inc.title.toLowerCase().includes(q)
        const matchesLoc = inc.location.toLowerCase().includes(q)
        const matchesId = inc.id.toLowerCase().includes(q)
        if (!matchesTitle && !matchesLoc && !matchesId) return false
      }
      return true
    })
  }, [incidents, sector, severity, status, search])

  // Incident counts
  const totalCount = incidents.length
  const activeCount = incidents.filter((i) => i.status !== 'Resolved').length
  const resolvedCount = incidents.filter((i) => i.status === 'Resolved').length
  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL' && i.status !== 'Resolved').length

  const handleStatusChange = async (incidentId, newStatus) => {
    try {
      const res = await TrafficService.updateIncidentStatus(incidentId, newStatus, {
        note: `Status updated to ${newStatus} by Operator`,
      })
      if (res.success) {
        setIncidents((prev) =>
          prev.map((i) => (i.id === incidentId ? res.data : i))
        )
        if (selectedIncident && selectedIncident.id === incidentId) {
          setSelectedIncident(res.data)
        }
        addToast({
          type: newStatus === 'Resolved' ? 'success' : 'info',
          title: 'Incident Status Updated',
          message: `${incidentId} transitioned to ${newStatus}`,
        })
      }
    } catch (err) {
      addToast({ type: 'danger', title: 'Update Failed', message: err.message })
    }
  }

  const handleAddUnit = async (incidentId, unitCode) => {
    try {
      const target = incidents.find((i) => i.id === incidentId)
      if (!target) return
      const updatedUnits = [...(target.assignedUnits || []), unitCode]
      const res = await TrafficService.updateIncidentStatus(incidentId, target.status, {
        assignedUnits: updatedUnits,
        note: `Dispatched ${unitCode} to scene`,
      })
      if (res.success) {
        setIncidents((prev) =>
          prev.map((i) => (i.id === incidentId ? res.data : i))
        )
        if (selectedIncident && selectedIncident.id === incidentId) {
          setSelectedIncident(res.data)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleIncidentCreated = (newIncident) => {
    setIncidents((prev) => [newIncident, ...prev])
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Active Incident Command & Dispatch
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
              {activeCount} PENDING
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time incident detection, emergency responder routing, dynamic sign warning, and lane clearance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={refreshData}
          >
            Sync
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={Plus}
            onClick={() => setReportModalOpen(true)}
          >
            Report Incident
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Road Hazards"
          value={activeCount}
          unit="incidents"
          change={-12.5}
          trend="up"
          color="rose"
          icon={AlertTriangle}
          changeLabel="requiring monitoring"
        />

        <StatCard
          title="Critical Emergencies"
          value={criticalCount}
          unit="code red"
          change={0}
          trend="neutral"
          color="amber"
          icon={ShieldAlert}
          changeLabel="multi-agency response"
        />

        <StatCard
          title="Resolved Today"
          value={resolvedCount}
          unit={`of ${totalCount}`}
          change={92.3}
          trend="up"
          color="emerald"
          icon={CheckCircle2}
          changeLabel="clearance success rate"
        />

        <StatCard
          title="Average Clearance Time"
          value="18.4"
          unit="mins"
          change={-4.2}
          trend="up"
          color="cyan"
          icon={Clock}
          changeLabel="faster response times"
        />
      </div>

      {/* Filter toolbar */}
      <IncidentFilters
        search={search}
        setSearch={setSearch}
        sector={sector}
        setSector={setSector}
        severity={severity}
        setSeverity={setSeverity}
        status={status}
        setStatus={setStatus}
        onOpenReportModal={() => setReportModalOpen(true)}
        totalCount={filteredIncidents.length}
      />

      {/* Incident Cards Grid */}
      {filteredIncidents.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto opacity-70" />
          <h3 className="text-lg font-bold text-white">No Incidents Matching Filters</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All corridors matching the selected criteria are currently unobstructed and flowing freely.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('')
              setSector('All Sectors')
              setSeverity('ALL')
              setStatus('ALL')
            }}
          >
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIncidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              onSelect={(inc) => setSelectedIncident(inc)}
              onQuickResolve={(id) => handleStatusChange(id, 'Resolved')}
              onQuickDispatch={(id) => handleStatusChange(id, 'Dispatched')}
            />
          ))}
        </div>
      )}

      {/* Report Incident Modal */}
      <ReportIncidentModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onCreated={handleIncidentCreated}
      />

      {/* Detail Inspection Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        isOpen={Boolean(selectedIncident)}
        onClose={() => setSelectedIncident(null)}
        onStatusChange={handleStatusChange}
        onAddUnit={handleAddUnit}
      />
    </div>
  )
}
