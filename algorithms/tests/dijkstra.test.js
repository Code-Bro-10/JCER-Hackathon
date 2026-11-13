import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { dijkstra, dijkstraAllPairs } from '../routing/dijkstra.js';
import { buildGraph, DEMO_NODES, DEMO_EDGES } from '../data/demoNetwork.js';

describe('Dijkstra Shortest-Path Algorithm', () => {
  const graph = buildGraph(DEMO_NODES, DEMO_EDGES);

  test('should find valid shortest path between INT-101 and INT-104', () => {
    const result = dijkstra({
      graph,
      startNodeId: 'INT-101',
      endNodeId: 'INT-104',
      options: { weightProperty: 'currentTravelTime' },
    });

    assert.equal(result.success, true);
    assert.equal(result.found, true);
    assert.equal(result.algorithm, 'Dijkstra');
    assert.equal(result.startNode, 'INT-101');
    assert.equal(result.endNode, 'INT-104');
    assert.ok(result.totalCost > 0);
    assert.ok(result.path.length >= 3);
    assert.equal(result.path[0], 'INT-101');
    assert.equal(result.path[result.path.length - 1], 'INT-104');
    assert.ok(result.edgeCount >= 2);
    assert.ok(result.visitedNodesCount >= 3);
    assert.ok(Array.isArray(result.directions));
    assert.equal(result.directions.length, result.edgeCount);
  });

  test('should calculate distance-based shortest path when requested', () => {
    const distResult = dijkstra({
      graph,
      startNodeId: 'INT-101',
      endNodeId: 'INT-102',
      options: { weightProperty: 'distanceKm' },
    });

    assert.equal(distResult.success, true);
    assert.equal(distResult.costUnit, 'km');
    assert.ok(distResult.totalCost > 0);
    assert.equal(distResult.totalCost, distResult.totalDistanceKm);
  });

  test('should handle identical origin and destination (identity path)', () => {
    const result = dijkstra({
      graph,
      startNodeId: 'INT-103',
      endNodeId: 'INT-103',
    });

    assert.equal(result.success, true);
    assert.equal(result.found, true);
    assert.equal(result.totalCost, 0);
    assert.deepEqual(result.path, ['INT-103']);
    assert.equal(result.edgeCount, 0);
  });

  test('should avoid road closures when avoidClosedRoads is true', () => {
    // In demo dataset, EDGE-106-108 is marked isClosed: true
    const resultWithAvoid = dijkstra({
      graph,
      startNodeId: 'INT-106',
      endNodeId: 'INT-108',
      options: { avoidClosedRoads: true },
    });

    // Should find an alternative route via open edges (e.g., via INT-101 -> INT-105 -> INT-108)
    assert.equal(resultWithAvoid.found, true);
    const usesClosedEdge = resultWithAvoid.edges.some((e) => e.isClosed);
    assert.equal(usesClosedEdge, false);
  });

  test('should return structured error for non-existent start or end node', () => {
    const badStart = dijkstra({
      graph,
      startNodeId: 'NON-EXISTENT',
      endNodeId: 'INT-101',
    });
    assert.equal(badStart.success, false);
    assert.match(badStart.error, /does not exist/);

    const badEnd = dijkstra({
      graph,
      startNodeId: 'INT-101',
      endNodeId: 'NON-EXISTENT',
    });
    assert.equal(badEnd.success, false);
    assert.match(badEnd.error, /does not exist/);
  });

  test('should compute single-source all-pairs exploration', () => {
    const allPairs = dijkstraAllPairs(graph, 'INT-101');
    assert.equal(allPairs.startNodeId, 'INT-101');
    assert.equal(allPairs.destinationsCount, DEMO_NODES.length - 1);
    assert.ok(allPairs.routes['INT-104'].found);
  });
});

