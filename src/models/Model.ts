import Api from '../Api'; // eslint-disable-line no-unused-vars

/**
 * Implements a generic object.
 */
class Model {
  public api: Api;
  public temp_id: string;

  constructor(api: Api) {
    this.api = api;
    this.temp_id = '';
  }

  get properties(): any {
    // extract properties specific to the subclass
    const { api, temp_id, ...args } = this; // eslint-disable-line no-unused-vars
    return args;
  }

  toString() {
    const data = JSON.stringify(Object.entries(this));
    return `${this.constructor.name}(${data})`;
  }
}

export default Model;
