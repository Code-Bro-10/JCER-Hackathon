import React, { Suspense, lazy } from 'react'
import { TrafficProvider, useTraffic } from './context/TrafficContext'
import Layout from './components/layout/Layout'
import { Loader2 } from 'lucide-react'

// Code-split pages for high performance
const DashboardOverviewPage = lazy(() => import('./pages/DashboardOverviewPage'))
const TrafficPredictionPage = lazy(() => import('./pages/TrafficPredictionPage'))
const IncidentManagementPage = lazy(() => import('./pages/IncidentManagementPage'))
const RoutePlannerPage = lazy(() => import('./pages/RoutePlannerPage'))
const EmergencyDashboardPage = lazy(() => import('./pages/EmergencyDashboardPage'))
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-cyan-400">
      <Loader2 className="w-8 h-8 animate-spin" />
      <span className="text-xs font-mono text-slate-400 tracking-wider uppercase">
        Loading Autonomous Telemetry...
      </span>
    </div>
  )
}

function PageRouter() {
  const { currentPage } = useTraffic()

  return (
    <Suspense fallback={<LoadingFallback />}>
      {currentPage === 'overview' && <DashboardOverviewPage />}
      {currentPage === 'prediction' && <TrafficPredictionPage />}
      {currentPage === 'incidents' && <IncidentManagementPage />}
      {currentPage === 'route' && <RoutePlannerPage />}
      {currentPage === 'emergency' && <EmergencyDashboardPage />}
      {currentPage === 'analytics' && <AdminAnalyticsPage />}
      {currentPage === 'settings' && <SettingsPage />}
    </Suspense>
  )
}

export default function App() {
  return (
    <TrafficProvider>
      <Layout>
        <PageRouter />
      </Layout>
    </TrafficProvider>
  )
}
