/**
 * Test Suite: Map Visualization, Road Network Digital Twin & Emergency Simulation
 * 
 * Verifies the cartography service layer, local graph routing, emergency preemption,
 * and connected road impact simulation.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  DEMO_NODES,
  DEMO_EDGES,
  DEMO_INCIDENTS,
  getNodeLatLng,
  getEdgeLatLngs,
  getEdgeCongestionState,
  calculateMultiModalRoutes,
  calculateEmergencyCorridor,
  simulateRoadImpact,
} from '../../src/services/roadNetworkData.js'

describe('Map & Road Network Digital Twin Data Layer', () => {
  it('should resolve valid latitude and longitude for all demo intersections', () => {
    assert.strictEqual(DEMO_NODES.length, 10)
    for (const node of DEMO_NODES) {
      const latLng = getNodeLatLng(node.id)
      assert.ok(Array.isArray(latLng), `Node ${node.id} should resolve to [lat, lon]`)
      assert.strictEqual(latLng.length, 2)
      assert.ok(latLng[0] > 37.0 && latLng[0] < 38.0, `Latitude ${latLng[0]} should be in SF metropolitan range`)
      assert.ok(latLng[1] < -122.0 && latLng[1] > -123.0, `Longitude ${latLng[1]} should be in SF metropolitan range`)
    }
  })

  it('should map directed edge coordinates between source and target nodes', () => {
    for (const edge of DEMO_EDGES) {
      const latLngs = getEdgeLatLngs(edge)
      assert.ok(Array.isArray(latLngs), `Edge ${edge.id} should resolve to coordinates array`)
      assert.strictEqual(latLngs.length, 2)
      assert.strictEqual(latLngs[0].length, 2)
      assert.strictEqual(latLngs[1].length, 2)
    }
  })

  it('should correctly classify edge congestion levels and color mappings', () => {
    const closedEdge = { ...DEMO_EDGES[0], isClosed: true }
    const closedState = getEdgeCongestionState(closedEdge)
    assert.strictEqual(closedState.level, 'closed')
    assert.strictEqual(closedState.color, '#f43f5e')

    const severeEdge = {
      ...DEMO_EDGES[0],
      isClosed: false,
      currentSpeedKmh: 12,
      freeFlowSpeedKmh: 50,
      currentVolumeVph: 3200,
      capacityVph: 3000,
    }
    const severeState = getEdgeCongestionState(severeEdge)
    assert.strictEqual(severeState.level, 'severe')
    assert.strictEqual(severeState.color, '#ef4444')

    const freeFlowEdge = {
      ...DEMO_EDGES[0],
      isClosed: false,
      currentSpeedKmh: 48,
      freeFlowSpeedKmh: 50,
      currentVolumeVph: 1200,
      capacityVph: 3000,
    }
    const freeFlowState = getEdgeCongestionState(freeFlowEdge)
    assert.strictEqual(freeFlowState.level, 'optimal')
    assert.strictEqual(freeFlowState.color, '#10b981')
  })
})

describe('Multi-Modal Route Engine (Local Road Graph)', () => {
  it('should calculate 3 distinct alternative routes between INT-101 and INT-104', () => {
    const plan = calculateMultiModalRoutes('INT-101', 'INT-104')
    assert.strictEqual(plan.success, true)
    assert.ok(plan.routes.length >= 2, 'Should return at least 2 distinct routes')

    const smart = plan.routes.find((r) => r.id === 'route-ai-smart')
    const shortest = plan.routes.find((r) => r.id === 'route-shortest')
    const eco = plan.routes.find((r) => r.id === 'route-eco-green')

    assert.ok(smart, 'Should contain AI smart route')
    assert.ok(shortest, 'Should contain shortest route')
    assert.ok(eco, 'Should contain eco-green route')

    assert.strictEqual(smart.polyColor, '#06b6d4')
    assert.strictEqual(shortest.polyColor, '#f43f5e')
    assert.strictEqual(eco.polyColor, '#10b981')

    assert.ok(smart.latLngs.length >= 2, 'Smart route should contain valid coordinates')
    assert.ok(smart.distanceKm > 0)
    assert.ok(smart.durationMin > 0)
  })

  it('should handle identical origin and destination gracefully', () => {
    const plan = calculateMultiModalRoutes('INT-101', 'INT-101')
    assert.strictEqual(plan.success, false)
    assert.strictEqual(plan.routes.length, 0)
  })

  it('should bypass closed road segments dynamically', () => {
    // Block EDGE-101-109
    const plan = calculateMultiModalRoutes('INT-101', 'INT-104', ['EDGE-101-109'])
    assert.strictEqual(plan.success, true)
    for (const r of plan.routes) {
      if (r.id === 'route-ai-smart') {
        const usesBlocked = r.edges.some((e) => e.id === 'EDGE-101-109')
        assert.strictEqual(usesBlocked, false, 'AI Smart route must avoid closed segment')
      }
    }
  })
})

describe('Emergency Vehicle Routing & Green Wave Preemption', () => {
  it('should compute ambulance corridor from INT-105 to INT-104 with green preemption', () => {
    const corridor = calculateEmergencyCorridor({
      vehicleType: 'ambulance',
      originNodeId: 'INT-105',
      destinationNodeId: 'INT-104',
    })

    assert.strictEqual(corridor.success, true)
    assert.strictEqual(corridor.unit.callsign, 'MED-12')
    assert.ok(corridor.distanceKm > 0)
    assert.ok(corridor.emergencyEtaMinutes > 0)
    assert.ok(corridor.normalEtaMinutes > corridor.emergencyEtaMinutes, 'Normal ETA must be slower than Emergency ETA')
    assert.ok(corridor.timeSavedMinutes > 0, 'Must show positive time saved')
    assert.ok(corridor.pctSaved > 0, 'Must show positive percentage saved')

    // Preemption checks
    assert.ok(corridor.preemptedNodeIds.length >= 2, 'Downstream nodes must be in preempted set')
    assert.ok(corridor.conflictingNodeIds.length > 0, 'Cross street nodes must be flagged as conflicting')
    assert.strictEqual(corridor.preemptedNodeIds.includes('INT-105'), true)
    assert.strictEqual(corridor.preemptedNodeIds.includes('INT-104'), true)
  })

  it('should support fire engine configuration with heavy vehicle dynamics', () => {
    const corridor = calculateEmergencyCorridor({
      vehicleType: 'fire_engine',
      originNodeId: 'INT-105',
      destinationNodeId: 'INT-104',
    })

    assert.strictEqual(corridor.success, true)
    assert.strictEqual(corridor.unit.callsign, 'TRUCK-04')
    assert.strictEqual(corridor.unit.priorityLevel, 'ALARM 3')
  })
})

describe('Accident & Road Closure Impact Simulation', () => {
  it('should compute LWR kinematic shockwave velocity and queue spillback on EDGE-106-103', () => {
    const report = simulateRoadImpact({
      edgeId: 'EDGE-106-103',
      lanesBlocked: 4,
      isClosed: true,
      durationMinutes: 45,
    })

    assert.strictEqual(report.success, true)
    assert.strictEqual(report.edgeId, 'EDGE-106-103')
    assert.strictEqual(report.incidentParameters.isClosed, true)
    assert.ok(report.shockwaveKinematics.shockwaveSpeedKmh > 0, 'Should calculate positive shockwave speed')
    assert.ok(report.shockwaveKinematics.maxQueueLengthMeters > 0, 'Should calculate maximum queue length')
    assert.ok(report.systemDelayImpact.networkDelayIncreaseVhd > 0, 'Should calculate VHD delay surge')
    assert.strictEqual(report.diversionAnalysis.bypassCorridorAvailable, true)
    assert.ok(report.mitigationRecommendations.length > 0)
  })
})

