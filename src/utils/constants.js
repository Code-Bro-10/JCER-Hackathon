export const SECTORS = [
  'All Sectors',
  'Metropolis Central',
  'Downtown Grid',
  'North Tech Corridor',
  'East Port Expressway',
  'West Riverside',
  'South Ring Road',
]

export const SEVERITIES = {
  CRITICAL: { label: 'Critical', color: 'rose', bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', dot: 'bg-rose-500' },
  HIGH: { label: 'High', color: 'amber', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-500' },
  MEDIUM: { label: 'Medium', color: 'yellow', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-500' },
  LOW: { label: 'Low', color: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500' },
}

export const INCIDENT_TYPES = [
  { id: 'accident', label: 'Multi-Vehicle Collision', icon: 'CarCrash' },
  { id: 'breakdown', label: 'Stalled Vehicle in Transit', icon: 'AlertTriangle' },
  { id: 'congestion', label: 'Severe Gridlock / Congestion', icon: 'Gauge' },
  { id: 'roadwork', label: 'Emergency Roadworks / Lane Closure', icon: 'Cone' },
  { id: 'signal_fault', label: 'Traffic Signal Controller Failure', icon: 'ZapOff' },
  { id: 'debris', label: 'Obstruction / Spilled Cargo', icon: 'AlertOctagon' },
  { id: 'weather', label: 'Flash Flood / Aquaplaning Hazard', icon: 'CloudRain' },
]

export const EMERGENCY_UNITS = [
  { id: 'police', name: 'Metro Police Patrol', code: 'MP-204', type: 'Law Enforcement', eta: 3 },
  { id: 'ambulance', name: 'ALS Trauma Ambulance', code: 'MED-12', type: 'Medical Emergency', eta: 4 },
  { id: 'fire', name: 'Heavy Rescue Engine', code: 'RESCUE-05', type: 'Fire & Rescue', eta: 6 },
  { id: 'tow', name: 'Hydraulic Heavy Tow Truck', code: 'TOW-88', type: 'Road Clearance', eta: 9 },
  { id: 'traffic_warden', name: 'Traffic Rapid Response Drone Squad', code: 'DRONE-ALPHA', type: 'Surveillance & Diversion', eta: 2 },
]

export const HOSPITALS = [
  { id: 'hosp-1', name: 'City Central Trauma Center', sector: 'Downtown Grid', lat: 37.7749, lng: -122.4194, capacity: '92% Full' },
  { id: 'hosp-2', name: 'St. Jude Memorial Hospital', sector: 'West Riverside', lat: 37.7833, lng: -122.4167, capacity: '68% Normal' },
  { id: 'hosp-3', name: 'Apex General Emergency Wing', sector: 'North Tech Corridor', lat: 37.7651, lng: -122.4201, capacity: '45% Available' },
]

export const LANDMARKS = [
  { id: 'central-sq', name: 'Metropolis Central Square', sector: 'Metropolis Central' },
  { id: 'financial-hub', name: 'Financial District Plaza', sector: 'Downtown Grid' },
  { id: 'tech-park', name: 'Silicon Bay Tech Park', sector: 'North Tech Corridor' },
  { id: 'port-terminal', name: 'Container Port Terminal Gate 3', sector: 'East Port Expressway' },
  { id: 'airport-gateway', name: 'International Airport Hub', sector: 'South Ring Road' },
  { id: 'riverside-center', name: 'West Riverside Convention Center', sector: 'West Riverside' },
  { id: 'civic-center', name: 'City Hall & Civic Center', sector: 'Downtown Grid' },
]

