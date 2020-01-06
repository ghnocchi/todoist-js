/* eslint-disable no-unused-vars */
class Session {
  constructor() {
    this._syncBase = require('../__fixtures__/syncBase').syncBase;
    this._requests = [];
  }

  popRequest() {
    return this._requests.pop();
  }

  clearRequests() {
    const copy = [...this._requests];
    this._requests = [];
    return copy;
  }

  get(url, data = {}) {
    return this.request(url, 'GET', data);
  }

  // noinspection JSMethodCanBeStatic
  request(url, method = 'GET', data = {}, customHeaders = {}) {
    this._requests.push({ url, method, data, customHeaders });
    const syncBase = this._syncBase;
    if (url.endsWith('/sync')) {
      return Promise.resolve(syncBase);
    }

    return {};
  }
}

export default Session;

