import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileNav from './MobileNav'
import EmergencyBroadcastBanner from './EmergencyBroadcastBanner'
import NotificationToast from '../common/NotificationToast'
import CCTVLiveFeedModal from '../dashboard/CCTVLiveFeedModal'

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-gray-950 text-slate-100 flex flex-col antialiased">
      {/* Top Emergency Green Wave Corridor Alert Banner if active */}
      <EmergencyBroadcastBanner />

      <div className="flex flex-1 min-h-0 relative">
        {/* Sidebar */}
        <Sidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-16 lg:pb-0">
          <Header onMobileMenuToggle={() => setMobileMenuOpen(true)} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1720px] w-full mx-auto animate-in fade-in duration-200">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Quick Navigation */}
      <MobileNav />

      {/* Global Toast Alerts */}
      <NotificationToast />

      {/* CCTV Camera Modal popup */}
      <CCTVLiveFeedModal />
    </div>
  )
}

