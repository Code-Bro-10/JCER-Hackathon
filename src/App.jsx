import React, { Suspense, lazy } from 'react'
import { AuthProvider } from './context/AuthContext'
import { TrafficProvider, useTraffic } from './context/TrafficContext'
import Layout from './components/layout/Layout'
import { Loader2 } from 'lucide-react'

// Code-split all 11 core PS01 navigation pages for optimal performance
const DashboardOverviewPage = lazy(() => import('./pages/DashboardOverviewPage'))
const LiveTrafficMapPage = lazy(() => import('./pages/LiveTrafficMapPage'))
const RoutePlannerPage = lazy(() => import('./pages/RoutePlannerPage'))
const TrafficPredictionPage = lazy(() => import('./pages/TrafficPredictionPage'))
const IncidentManagementPage = lazy(() => import('./pages/IncidentManagementPage'))
const NetworkImpactPage = lazy(() => import('./pages/NetworkImpactPage'))
const SignalOptimizationPage = lazy(() => import('./pages/SignalOptimizationPage'))
const EmergencyDashboardPage = lazy(() => import('./pages/EmergencyDashboardPage'))
const DigitalTwinPage = lazy(() => import('./pages/DigitalTwinPage'))
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage'))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))
const LiveCameraIntelligencePage = lazy(() => import('./pages/LiveCameraIntelligencePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-blue-400">
      <Loader2 className="w-8 h-8 animate-spin" />
      <span className="text-xs font-mono text-slate-400 tracking-wider uppercase">
        Loading TrafficAI Telemetry System...
      </span>
    </div>
  )
}

function PageRouter() {
  const { currentPage } = useTraffic()

  return (
    <Suspense fallback={<LoadingFallback />}>
      {currentPage === 'overview' && <DashboardOverviewPage />}
      {currentPage === 'live-map' && <LiveTrafficMapPage />}
      {currentPage === 'route' && <RoutePlannerPage />}
      {currentPage === 'prediction' && <TrafficPredictionPage />}
      {currentPage === 'incidents' && <IncidentManagementPage />}
      {currentPage === 'network-impact' && <NetworkImpactPage />}
      {currentPage === 'signal-optimization' && <SignalOptimizationPage />}
      {currentPage === 'emergency' && <EmergencyDashboardPage />}
      {currentPage === 'digital-twin' && <DigitalTwinPage />}
      {currentPage === 'analytics' && <AdminAnalyticsPage />}
      {currentPage === 'admin' && <AdminDashboardPage />}
      {currentPage === 'camera-intelligence' && <LiveCameraIntelligencePage />}
      {currentPage === 'settings' && <SettingsPage />}
      {currentPage === 'login' && <LoginPage />}
    </Suspense>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <TrafficProvider>
        <Layout>
          <PageRouter />
        </Layout>
      </TrafficProvider>
    </AuthProvider>
  )
}
