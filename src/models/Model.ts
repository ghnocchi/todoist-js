import Manager from '../managers/Manager'; // eslint-disable-line no-unused-vars

/**
 * Implements a generic object.
 */
class Model {
  protected manager: Manager;
  public id: number;
  public temp_id: string;

  constructor(manager: Manager) {
    this.manager = manager;
    this.temp_id = '';
  }

  get properties(): any {
    // extract properties specific to the subclass
    const { manager, temp_id, ...args } = this; // eslint-disable-line no-unused-vars
    return args;
  }

  toString() {
    const data = JSON.stringify(Object.entries(this));
    return `${this.constructor.name}(${data})`;
  }
}

export default Model;
