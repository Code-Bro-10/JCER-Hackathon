import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PriorityQueue } from '../utils/priorityQueue.js';

describe('PriorityQueue (Binary Min-Heap)', () => {
  test('should initialize empty and report correct size', () => {
    const pq = new PriorityQueue();
    assert.equal(pq.isEmpty(), true);
    assert.equal(pq.size, 0);
    assert.equal(pq.peek(), null);
    assert.equal(pq.pop(), null);
  });

  test('should insert elements and extract them in ascending priority order', () => {
    const pq = new PriorityQueue();
    pq.push('Node-C', 15.5);
    pq.push('Node-A', 3.2);
    pq.push('Node-D', 24.0);
    pq.push('Node-B', 8.1);

    assert.equal(pq.size, 4);
    assert.equal(pq.isEmpty(), false);
    assert.equal(pq.peek().element, 'Node-A');

    const first = pq.pop();
    assert.equal(first.element, 'Node-A');
    assert.equal(first.priority, 3.2);

    const second = pq.pop();
    assert.equal(second.element, 'Node-B');
    assert.equal(second.priority, 8.1);

    const third = pq.pop();
    assert.equal(third.element, 'Node-C');

    const fourth = pq.pop();
    assert.equal(fourth.element, 'Node-D');

    assert.equal(pq.isEmpty(), true);
    assert.equal(pq.size, 0);
  });

  test('should handle duplicate priorities deterministically', () => {
    const pq = new PriorityQueue();
    pq.push('X1', 5);
    pq.push('X2', 5);
    pq.push('X0', 1);

    assert.equal(pq.pop().element, 'X0');
    const p1 = pq.pop();
    const p2 = pq.pop();
    assert.equal(p1.priority, 5);
    assert.equal(p2.priority, 5);
    assert.equal(pq.isEmpty(), true);
  });

  test('should support clear()', () => {
    const pq = new PriorityQueue();
    pq.push('A', 10);
    pq.push('B', 20);
    assert.equal(pq.size, 2);
    pq.clear();
    assert.equal(pq.size, 0);
    assert.equal(pq.isEmpty(), true);
  });
});

