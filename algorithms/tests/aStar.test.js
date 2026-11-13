import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { aStar, HEURISTICS } from '../routing/aStar.js';
import { dijkstra } from '../routing/dijkstra.js';
import { buildGraph, DEMO_NODES, DEMO_EDGES } from '../data/demoNetwork.js';

describe('A* Pathfinding Algorithm', () => {
  const graph = buildGraph(DEMO_NODES, DEMO_EDGES);

  test('should find optimal path between INT-101 and INT-104 with Haversine heuristic', () => {
    const aStarResult = aStar({
      graph,
      startNodeId: 'INT-101',
      endNodeId: 'INT-104',
      options: { heuristic: HEURISTICS.HAVERSINE, weightProperty: 'distanceKm' },
    });

    const dijkstraResult = dijkstra({
      graph,
      startNodeId: 'INT-101',
      endNodeId: 'INT-104',
      options: { weightProperty: 'distanceKm' },
    });

    assert.equal(aStarResult.success, true);
    assert.equal(aStarResult.found, true);
    assert.equal(aStarResult.algorithm, 'A*');
    assert.equal(aStarResult.heuristicUsed, 'haversine');
    assert.equal(aStarResult.startNode, 'INT-101');
    assert.equal(aStarResult.endNode, 'INT-104');

    // Admissibility check: Total cost must equal Dijkstra's exact optimal cost
    assert.equal(aStarResult.totalCost, dijkstraResult.totalCost);

    // Heuristic efficiency check: A* should explore <= nodes than Dijkstra
    assert.ok(aStarResult.visitedNodesCount <= dijkstraResult.visitedNodesCount);
  });

  test('should support Euclidean planar heuristic', () => {
    const result = aStar({
      graph,
      startNodeId: 'INT-101',
      endNodeId: 'INT-102',
      options: { heuristic: HEURISTICS.EUCLIDEAN, weightProperty: 'currentTravelTime' },
    });

    assert.equal(result.success, true);
    assert.equal(result.found, true);
    assert.equal(result.heuristicUsed, 'euclidean');
    assert.ok(result.totalCost > 0);
  });

  test('should support Manhattan grid heuristic', () => {
    const result = aStar({
      graph,
      startNodeId: 'INT-105',
      endNodeId: 'INT-104',
      options: { heuristic: HEURISTICS.MANHATTAN, weightProperty: 'distanceKm' },
    });

    assert.equal(result.success, true);
    assert.equal(result.found, true);
    assert.equal(result.heuristicUsed, 'manhattan');
  });

  test('should handle identity route (start == end)', () => {
    const result = aStar({
      graph,
      startNodeId: 'INT-102',
      endNodeId: 'INT-102',
    });

    assert.equal(result.success, true);
    assert.equal(result.found, true);
    assert.equal(result.totalCost, 0);
    assert.deepEqual(result.path, ['INT-102']);
  });

  test('should handle non-existent nodes gracefully', () => {
    const result = aStar({
      graph,
      startNodeId: 'INVALID',
      endNodeId: 'INT-101',
    });

    assert.equal(result.success, false);
    assert.match(result.error, /not found/);
  });
});

