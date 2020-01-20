import Manager from '../managers/Manager'; // eslint-disable-line no-unused-vars

class ApiState {
  private _keys: string[];
  private _manager: Manager;
  private _state: any;

  constructor(keys: string[], manager: Manager) {
    this._keys = keys;
    this._manager = manager;

    // link back from manager
    this._manager.apiState = this;

    // initialize state
    this.reset();
  }

  get keys(): string[] {
    return this._keys;
  }

  get manager(): Manager {
    return this._manager;
  }

  get state(): any {
    return this._state;
  }

  set state(value: any) {
    this._state = value;
  }

  add(value: any) {
    this._state.push(value);
  }

  findObject(objData: any): any {
    return this._manager.findInApiState(objData);
  }

  find(predicate: (arg0: any) => any): any {
    this._state.find((i: any) => predicate(i));
  }

  reset() {
    this._state = [];
  }
}

export default ApiState;
