/* eslint-disable no-unused-vars */
// @ts-ignore
class Session {
  private _requests: any[];
  public syncResponse: any;
  public sessionConfig: any;

  constructor() {
    this.reloadBase();
    this._requests = [];
  }

  reset() {
    this.reloadBase();
    this.clearRequests();
  }

  reloadBase() {
    this.syncResponse = JSON.parse(JSON.stringify(require('../../__fixtures__/syncResponse').syncResponse));
    const me = this;
    this.syncResponse.data = () => me;
  }

  popRequest() {
    return this._requests.pop();
  }

  clearRequests() {
    const copy = [...this._requests];
    this._requests = [];
    return copy;
  }

  get(url: any, data: any = {}) {
    return this.request(url, 'GET', data);
  }

  // noinspection JSMethodCanBeStatic
  request(url: any, method: string = 'GET', data: any = {}, customHeaders: any = {}) {
    this._requests.push({ url, method, data, customHeaders });
    const syncBase = this.syncResponse;
    if (url.endsWith('/sync')) {
      return Promise.resolve(syncBase);
    }

    return {};
  }
}

// @ts-ignore
export default Session;

