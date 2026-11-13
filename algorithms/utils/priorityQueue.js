/**
 * TrafficAI Algorithms Suite - Priority Queue
 * Implements an efficient binary min-heap for graph search algorithms (Dijkstra, A*).
 * Time Complexity: Push O(log N), Pop O(log N), Peek O(1).
 */

export class PriorityQueue {
  constructor(comparator = (a, b) => a.priority - b.priority) {
    this._heap = [];
    this._comparator = comparator;
  }

  /**
   * Number of items in the queue.
   */
  get size() {
    return this._heap.length;
  }

  /**
   * Check if the queue is empty.
   */
  isEmpty() {
    return this._heap.length === 0;
  }

  /**
   * Return the minimum item without removing it.
   */
  peek() {
    return this._heap.length > 0 ? this._heap[0] : null;
  }

  /**
   * Insert an element with a priority into the heap.
   * @param {*} element - The payload data (e.g., node identifier or state).
   * @param {number} priority - Numerical priority (smaller value = higher priority).
   */
  push(element, priority) {
    const node = { element, priority };
    this._heap.push(node);
    this._siftUp(this._heap.length - 1);
  }

  /**
   * Extract and return the item with the minimum priority value.
   * @returns {{ element: *, priority: number } | null}
   */
  pop() {
    if (this._heap.length === 0) return null;
    const top = this._heap[0];
    const bottom = this._heap.pop();
    if (this._heap.length > 0) {
      this._heap[0] = bottom;
      this._siftDown(0);
    }
    return top;
  }

  /**
   * Clear all items in the queue.
   */
  clear() {
    this._heap = [];
  }

  _siftUp(index) {
    let current = index;
    while (current > 0) {
      const parent = (current - 1) >> 1;
      if (this._comparator(this._heap[current], this._heap[parent]) < 0) {
        this._swap(current, parent);
        current = parent;
      } else {
        break;
      }
    }
  }

  _siftDown(index) {
    let current = index;
    const length = this._heap.length;
    while (true) {
      const left = (current << 1) + 1;
      const right = left + 1;
      let smallest = current;

      if (left < length && this._comparator(this._heap[left], this._heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < length && this._comparator(this._heap[right], this._heap[smallest]) < 0) {
        smallest = right;
      }

      if (smallest !== current) {
        this._swap(current, smallest);
        current = smallest;
      } else {
        break;
      }
    }
  }

  _swap(i, j) {
    const temp = this._heap[i];
    this._heap[i] = this._heap[j];
    this._heap[j] = temp;
  }
}

