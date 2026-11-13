import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
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
  LocateFixed,
  RotateCcw,
  Search,
  MapPin,
  Layers,
  Info,
  ChevronDown,
  X,
  Plus,
  Minus,
} from 'lucide-react'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, BELAGAVI_CENTER, BENGALURU_CENTER } from '../../services/roadNetworkData'
import { searchNominatimLocations } from '../../services/osmRoutingService'

/**
 * Controller hook to programmatically control Leaflet map viewport & zoom
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
 * Capture map clicks and propagate lat/lng to parent
 */
function MapEventsHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng)
      }
    },
  })
  return null
}

/**
 * Quick City Jump Presets
 */
export const CITY_PRESETS = [
  { name: 'Belagavi (Default)', coords: [15.8497, 74.4977], zoom: 13, state: 'Karnataka, India' },
  { name: 'Bengaluru', coords: [12.9716, 77.5946], zoom: 13, state: 'Karnataka, India' },
  { name: 'Mumbai', coords: [19.0760, 72.8777], zoom: 12, state: 'Maharashtra, India' },
  { name: 'New Delhi', coords: [28.6139, 77.2090], zoom: 12, state: 'Delhi NCR, India' },
  { name: 'Hyderabad', coords: [17.3850, 78.4867], zoom: 12, state: 'Telangana, India' },
  { name: 'Chennai', coords: [13.0827, 80.2707], zoom: 12, state: 'Tamil Nadu, India' },
  { name: 'San Francisco', coords: [37.7749, -122.4194], zoom: 13, state: 'California, USA' },
]

/**
 * Reusable Leaflet Map Container for TrafficAI
 */
export default function TrafficMapContainer({
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  bounds = null,
  title = 'Autonomous Grid Digital Twin',
  subtitle = 'Belagavi & Regional Intelligent Transportation System',
  showLayerControls = true,
  layerStates = {},
  onToggleLayer = () => {},
  headerActions = null,
  height = '540px',
  onMapClick = null,
  onResetMap = null,
  showSearch = true,
  children,
}) {
  const [currentCenter, setCurrentCenter] = useState(center)
  const [currentZoom, setCurrentZoom] = useState(zoom)
  const [detectedUserCoords, setDetectedUserCoords] = useState(null)
  const [tileMode, setTileMode] = useState('dark') // 'dark' | 'standard' | 'carto'
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showLegend, setShowLegend] = useState(true)
  const [isLocating, setIsLocating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResultsDropdown, setShowResultsDropdown] = useState(false)
  const [showCityPicker, setShowCityPicker] = useState(false)
  const [mapClickedCoord, setMapClickedCoord] = useState(null)

  const containerRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    setCurrentCenter(center)
    setCurrentZoom(zoom)
  }, [center, zoom])

  // Automatically request current GPS location on initial load; fallback to Belagavi
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userCoords = [pos.coords.latitude, pos.coords.longitude]
          setDetectedUserCoords(userCoords)
          // Set map center to user's current location if using default
          setCurrentCenter(userCoords)
          setCurrentZoom(14)
        },
        (err) => {
          // Fallback to Belagavi default
          console.info('Defaulting to Belagavi area (GPS unavailable or not permitted):', err.message)
        },
        { timeout: 6000, maximumAge: 60000, enableHighAccuracy: true }
      )
    }
  }, [])

  // Tile layer configurations complying with OSM Attribution policies
  const tileConfigs = {
    dark: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      className: 'leaflet-layer-dark-osm',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    },
    standard: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      className: '',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    },
    carto: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      className: '',
      attribution: '&copy; <a href="https://carto.com/" target="_blank" rel="noreferrer">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    },
  }

  const activeTile = tileConfigs[tileMode] || tileConfigs.dark

  // Fullscreen toggle
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

  // Geolocation trigger
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false)
        const userCoords = [pos.coords.latitude, pos.coords.longitude]
        setDetectedUserCoords(userCoords)
        setCurrentCenter(userCoords)
        setCurrentZoom(15)
        if (onMapClick) {
          onMapClick({ lat: pos.coords.latitude, lng: pos.coords.longitude, isUserLocation: true })
        }
      },
      (err) => {
        setIsLocating(false)
        console.warn('Geolocation denied or unavailable:', err.message)
        // Fallback gracefully to Belagavi center
        setCurrentCenter(BELAGAVI_CENTER)
        setCurrentZoom(13)
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }

  // Handle Debounced Location Search
  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchQuery(val)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (val.trim().length >= 2) {
      setIsSearching(true)
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchNominatimLocations(val)
          setSearchResults(results)
          setShowResultsDropdown(true)
        } catch {
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      }, 450)
    } else {
      setSearchResults([])
      setShowResultsDropdown(false)
    }
  }

  const handleSelectSearchResult = (loc) => {
    setCurrentCenter([loc.lat, loc.lon])
    setCurrentZoom(15)
    setSearchQuery(loc.name.split(',')[0])
    setShowResultsDropdown(false)
    if (onMapClick) {
      onMapClick({ lat: loc.lat, lng: loc.lon, name: loc.name })
    }
  }

  const handleSelectCity = (city) => {
    setCurrentCenter(city.coords)
    setCurrentZoom(city.zoom)
    setShowCityPicker(false)
  }

  const handleReset = () => {
    const targetCenter = detectedUserCoords || DEFAULT_MAP_CENTER
    setCurrentCenter(targetCenter)
    setCurrentZoom(DEFAULT_MAP_ZOOM)
    setMapClickedCoord(null)
    setSearchQuery('')
    setShowResultsDropdown(false)
    if (onResetMap) onResetMap()
  }

  const handleInternalMapClick = (latlng) => {
    setMapClickedCoord([latlng.lat, latlng.lng])
    if (onMapClick) onMapClick(latlng)
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-40 rounded-none border-none h-screen' : ''
      }`}
    >
      {/* Top Map Control Bar (Organized 2-Tier Layout to prevent any function overlap) */}
      <div className="relative z-20 flex flex-col gap-2.5 p-3 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md">
        {/* Tier 1: Title, Subtitle, Search / Autocomplete & City Preset */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-blue-600/10 border border-blue-500/30 text-blue-400 flex-shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 truncate">
                {title}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  OSM LIVE
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>
            </div>
          </div>

          {/* Search bar & City Jump */}
          <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
            {showSearch && (
              <div className="relative flex-1 max-w-xs">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search location or city (Nominatim)..."
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-8 pr-7 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setShowResultsDropdown(false)
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Results Dropdown */}
                {showResultsDropdown && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-30 max-h-60 overflow-y-auto">
                    <div className="px-2 py-1 text-[10px] font-mono text-slate-400 border-b border-slate-800 flex justify-between">
                      <span>LOCATION RESULTS</span>
                      <span className="text-blue-400">{searchResults.length} FOUND</span>
                    </div>
                    {searchResults.map((loc, idx) => (
                      <button
                        key={`${loc.lat}-${loc.lon}-${idx}`}
                        type="button"
                        onClick={() => handleSelectSearchResult(loc)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-start gap-2 transition-colors cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="font-medium truncate text-white">{loc.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {loc.source || 'OpenStreetMap'} • {loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick City Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCityPicker(!showCityPicker)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950/80 text-slate-300 hover:text-white hover:border-slate-700 font-medium flex items-center gap-1.5 transition-all cursor-pointer text-xs"
                title="Jump to City"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">City</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showCityPicker && (
                <div className="absolute right-0 mt-1.5 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-30">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
                    Select Metropolitan Area
                  </div>
                  {CITY_PRESETS.map((city) => (
                    <button
                      key={city.name}
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-200 transition-colors flex items-center justify-between"
                    >
                      <span>{city.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{city.state.split(',')[0]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tier 2: Action Controls, Layer Toggles & Map Utilities (Clean non-overlapping row) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
          {/* Left: Action controls from parent (CCTV, Simulation Controls, etc.) */}
          <div className="flex items-center flex-wrap gap-2">
            {headerActions}
          </div>

          {/* Right: Layer Toggles and Map Utility Toolbars */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Layer toggles */}
            {showLayerControls && (
              <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
                {layerStates.showSignals !== undefined && (
                  <button
                    type="button"
                    onClick={() => onToggleLayer('showSignals')}
                    className={`px-2 py-1 rounded-lg font-medium flex items-center gap-1 cursor-pointer transition-all ${
                      layerStates.showSignals
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Toggle Signal Nodes"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Signals</span>
                  </button>
                )}

                {layerStates.showCongestion !== undefined && (
                  <button
                    type="button"
                    onClick={() => onToggleLayer('showCongestion')}
                    className={`px-2 py-1 rounded-lg font-medium flex items-center gap-1 cursor-pointer transition-all ${
                      layerStates.showCongestion
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Toggle Congestion Telemetry"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Congestion</span>
                  </button>
                )}

                {layerStates.showIncidents !== undefined && (
                  <button
                    type="button"
                    onClick={() => onToggleLayer('showIncidents')}
                    className={`px-2 py-1 rounded-lg font-medium flex items-center gap-1 cursor-pointer transition-all ${
                      layerStates.showIncidents
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Toggle Incident Markers"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Incidents</span>
                  </button>
                )}

                {layerStates.showEmergency !== undefined && (
                  <button
                    type="button"
                    onClick={() => onToggleLayer('showEmergency')}
                    className={`px-2 py-1 rounded-lg font-medium flex items-center gap-1 cursor-pointer transition-all ${
                      layerStates.showEmergency
                        ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Toggle Emergency Corridors"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Emergency</span>
                  </button>
                )}
              </div>
            )}

            {/* Cartography Basemap Mode Switcher */}
            <div className="flex items-center gap-0.5 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTileMode('dark')}
                className={`p-1.5 rounded-lg transition-all ${
                  tileMode === 'dark'
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Dark Mode OSM"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTileMode('carto')}
                className={`p-1.5 rounded-lg transition-all ${
                  tileMode === 'carto'
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="CartoDB Dark Matter"
              >
                <Globe className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTileMode('standard')}
                className={`p-1.5 rounded-lg transition-all ${
                  tileMode === 'standard'
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Standard OpenStreetMap"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Current Geolocation Button */}
            <button
              type="button"
              onClick={handleDetectLocation}
              className={`p-1.5 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer ${
                isLocating ? 'text-blue-400 animate-spin' : ''
              }`}
              title="Detect Current Location (GPS)"
            >
              <LocateFixed className="w-4 h-4" />
            </button>

            {/* Reset Map Button */}
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
              title="Reset Map to Current Location / Belagavi"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Map View Canvas */}
      <div
        className="relative w-full bg-slate-950 overflow-hidden"
        style={{ height: isFullscreen ? 'calc(100vh - 58px)' : height }}
      >
        <MapContainer
          center={currentCenter}
          zoom={currentZoom}
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

          <MapController center={currentCenter} zoom={currentZoom} bounds={bounds} />
          <MapEventsHandler onMapClick={handleInternalMapClick} />

          {/* Child Overlays & Layers */}
          {children}
        </MapContainer>

        {/* Click indicator badge if user clicked anywhere on map */}
        {mapClickedCoord && (
          <div className="absolute top-3 left-3 z-[450] bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-lg text-[11px] text-slate-200 font-mono shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>Map Selected: {mapClickedCoord[0].toFixed(4)}, {mapClickedCoord[1].toFixed(4)}</span>
            <button
              type="button"
              onClick={() => setMapClickedCoord(null)}
              className="text-slate-400 hover:text-white ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Collapsible Map Legend (Bottom-Left) */}
        <div className="absolute bottom-3 left-3 z-[450]">
          {showLegend ? (
            <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-[11px] space-y-1.5 w-52 sm:w-60">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Info className="w-3 h-3 text-blue-400" />
                  Traffic Map Legend
                </span>
                <button
                  type="button"
                  onClick={() => setShowLegend(false)}
                  className="text-slate-400 hover:text-white"
                  title="Collapse Legend"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-300">Free Flow (&gt;40 km/h)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-300">Moderate (25-40 km/h)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-300">Severe Gridlock</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-1 border-t-2 border-dashed border-rose-500" />
                  <span className="text-slate-300">Road Blocked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-1 bg-cyan-400 rounded-full" />
                  <span className="text-slate-300">Optimal AI Route</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-slate-300">Emergency Corridor</span>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-800/80 text-[9px] text-slate-500 flex justify-between">
                <span>Data: OpenStreetMap + OSRM</span>
                <span>Click map to select</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLegend(true)}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 font-medium flex items-center gap-1.5 shadow-lg cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>Map Legend</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
