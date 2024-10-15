class CircuitBreaker {
  constructor(request, options = {}) {
    this.request = request;
    this.state = 'CLOSED';
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    this.failureCount = 0;
  }

  async fire(...args) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit is OPEN');
    }

    try {
      const response = await this.request(...args);
      this.success();
      return response;
    } catch (err) {
      this.failure();
      throw err;
    }
  }

  success() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  failure() {
    this.failureCount += 1;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      setTimeout(() => {
        this.state = 'HALF-OPEN';
      }, this.resetTimeout);
    }
  }
}

module.exports = CircuitBreaker;
