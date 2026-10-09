class PriorityQueue {
  constructor() {
    this.heap = [];
    this.indexMap = new Map();
  }

  _parent(i) {
    return Math.floor((i - 1) / 2);
  }

  _left(i) {
    return 2 * i + 1;
  }

  _right(i) {
    return 2 * i + 2;
  }

  _swap(i, j) {
    const tmp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = tmp;
    this.indexMap.set(this.heap[i].node, i);
    this.indexMap.set(this.heap[j].node, j);
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = this._parent(i);
      if (this.heap[parent].priority <= this.heap[i].priority) break;
      this._swap(i, parent);
      i = parent;
    }
  }

  _bubbleDown(i) {
    const n = this.heap.length;
    while (true) {
      const left = this._left(i);
      const right = this._right(i);
      let smallest = i;

      if (left < n && this.heap[left].priority < this.heap[smallest].priority) {
        smallest = left;
      }
      if (right < n && this.heap[right].priority < this.heap[smallest].priority) {
        smallest = right;
      }
      if (smallest === i) break;
      this._swap(i, smallest);
      i = smallest;
    }
  }

  insert(node, priority) {
    if (this.indexMap.has(node)) {
      this.decreaseKey(node, priority);
      return;
    }
    const entry = { node, priority };
    this.heap.push(entry);
    const idx = this.heap.length - 1;
    this.indexMap.set(node, idx);
    this._bubbleUp(idx);
  }

  extractMin() {
    if (this.isEmpty()) return null;
    const min = this.heap[0];
    const last = this.heap.pop();
    this.indexMap.delete(min.node);

    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.indexMap.set(last.node, 0);
      this._bubbleDown(0);
    }

    return min;
  }

  decreaseKey(node, newPriority) {
    const idx = this.indexMap.get(node);
    if (idx === undefined) {
      this.insert(node, newPriority);
      return;
    }
    if (newPriority >= this.heap[idx].priority) return;
    this.heap[idx].priority = newPriority;
    this._bubbleUp(idx);
  }

  isEmpty() {
    return this.heap.length === 0;
  }
}

module.exports = PriorityQueue;
