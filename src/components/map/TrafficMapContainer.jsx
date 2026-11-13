import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  Compass,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Globe,
  Radio,
  AlertTriangle,
  Flame,
  Activity,
} from 'lucide-react'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../../services/roadNetworkData'

/**
 * Helper hook to programmatically control Leaflet map viewport
 */
function MapController({ center, zoom, bounds }) {
  const map = useMap()

  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 })
    } else if (center) {
      map.setView(center, zoom || DEFAULT_MAP_ZOOM, { animate: true })
    }
  }, [map, center, zoom, bounds])

  return null
}

/**
 * Reusable Leaflet Map Container for TrafficAI
 *
 * @param {object} props
 * @param {[number, number]} [props.center] - Initial map center [lat, lon]
 * @param {number} [props.zoom] - Initial zoom level
 * @param {[[number, number], [number, number]]} [props.bounds] - LatLng bounds to fit
 * @param {string} [props.title] - Map header title
 * @param {string} [props.subtitle] - Map header subtitle
 * @param {boolean} [props.showLayerControls=true] - Whether to show the layer toggles bar
 * @param {object} [props.layerStates] - Current toggled state of map layers
 * @param {function} [props.onToggleLayer] - Callback when a layer filter button is clicked
 * @param {React.ReactNode} [props.headerActions] - Custom buttons or badges in header
 * @param {string} [props.height='500px'] - Container height
 * @param {React.ReactNode} [props.children] - Child layers (Markers, Polylines, Overlays)
 */
export default function TrafficMapContainer({
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  bounds = null,
  title = 'Autonomous Grid Digital Twin',
  subtitle = 'Live Urban Telemetry & Geographic Cartography',
  showLayerControls = true,
  layerStates = {},
  onToggleLayer = () => {},
  headerActions = null,
  height = '520px',
  children,
}) {
  const [tileMode, setTileMode] = useState('dark') // 'dark' | 'standard' | 'carto'
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef(null)

  // Tile layer URLs:
  // 1. Dark Mode: OpenStreetMap with custom cyber inversion filter in CSS
  // 2. Standard Mode: OpenStreetMap standard tiles
  // 3. Carto Dark: CartoDB Dark Matter tiles (sleek vector cartography)
  const tileConfigs = {
    dark: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      className: 'leaflet-layer-dark-osm',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    standard: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      className: '',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    carto: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      className: '',
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    },
  }

  const activeTile = tileConfigs[tileMode] || tileConfigs.dark

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none h-screen' : ''
      }`}
    >
      {/* Top Map Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md z-[500]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {title}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                OSM SYNCED
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">{subtitle}</p>
          </div>
        </div>

        {/* Right side controls & Layer Filters */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {headerActions}

          {showLayerControls && (
            <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
              {layerStates.showSignals !== undefined && (
                <button
                  type="button"
                  onClick={() => onToggleLayer('showSignals')}
                  className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                    layerStates.showSignals
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                  title="Toggle Signals Layer"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Signals</span>
                </button>
              )}

              {layerStates.showCongestion !== undefined && (
                <button
                  type="button"
                  onClick={() => onToggleLayer('showCongestion')}
                  className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                    layerStates.showCongestion
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                  title="Toggle Congestion Telemetry Layer"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Congestion</span>
                </button>
              )}

              {layerStates.showIncidents !== undefined && (
                <button
                  type="button"
                  onClick={() => onToggleLayer('showIncidents')}
                  className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                    layerStates.showIncidents
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                  title="Toggle Incidents Layer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Incidents</span>
                </button>
              )}

              {layerStates.showEmergency !== undefined && (
                <button
                  type="button"
                  onClick={() => onToggleLayer('showEmergency')}
                  className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                    layerStates.showEmergency
                      ? 'bg-rose-600/20 border-rose-500/50 text-rose-300 animate-pulse'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                  title="Toggle Emergency Corridor Layer"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Emergency</span>
                </button>
              )}
            </div>
          )}

          {/* Cartography Tile Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setTileMode('dark')}
              className={`p-1.5 rounded-lg transition-all ${
                tileMode === 'dark'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Cyber Dark OSM Tiles"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setTileMode('carto')}
              className={`p-1.5 rounded-lg transition-all ${
                tileMode === 'carto'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="CartoDB Dark Matter Tiles"
            >
              <Globe className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setTileMode('standard')}
              className={`p-1.5 rounded-lg transition-all ${
                tileMode === 'standard'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Standard OpenStreetMap Tiles"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Map View Area */}
      <div
        className="relative w-full bg-slate-950 overflow-hidden"
        style={{ height: isFullscreen ? 'calc(100vh - 58px)' : height }}
      >
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          className="traffic-map-container"
        >
          <TileLayer
            key={tileMode}
            attribution={activeTile.attribution}
            url={activeTile.url}
            className={activeTile.className}
            maxZoom={19}
            subdomains={tileMode === 'carto' ? 'abcd' : 'abc'}
          />

          <MapController center={center} zoom={zoom} bounds={bounds} />

          {/* Map Child Layers */}
          {children}
        </MapContainer>
      </div>
    </div>
  )
}
