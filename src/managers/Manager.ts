import Api from '../api/Api'; // eslint-disable-line no-unused-vars
import { ITodoistRequestData, ITodoistResponseData } from '../api/Session'; // eslint-disable-line no-unused-vars
import { ObjectId, TodoistId } from '../types'; // eslint-disable-line no-unused-vars
import ApiState from '../api/ApiState'; // eslint-disable-line no-unused-vars
import generateUuid from '../utils/uuid';

abstract class Manager {
  private _api: Api;
  private _apiState: ApiState;

  constructor(api: Api) {
    this._api = api;
  }

  get apiState(): ApiState {
    return this._apiState;
  }

  set apiState(value: ApiState) {
    this._apiState = value;
  }

  protected addToApiState(value: any): any {
    return this._apiState.add(value);
  }

  /**
   * facade to update all local state
   * @param data response data to update into state
   */
  protected updateLocalState(data: ITodoistResponseData) {
    this._api.updateLocalState(data);
  }

  /**
   * default lookup of matching value in API state
   * subclass overrides as necessary
   * @param objData, model attribute values
   */
  findInApiState(objData: any): any {
    // the common case just looks up by primary ID
    return this.getLocalById(objData.id);
  }

  /**
   * subclass overrides to create a model instance from the given data
   * @param data, model attribute values
   */
  abstract create(data: any): any;

  /**
   * subclass overrides to fetch remote resource, default implementation returns null for objects that do not support remote lookup
   * @param {TodoistId} id of object to fetch
   */
  // eslint-disable-next-line no-unused-vars
  protected get(id: TodoistId): Promise<ITodoistResponseData> {
    return null;
  }

  /**
   * API helper function to fetch a remote resource
   * @param resourcePath
   * @param params
   */
  protected getRemoteResource(resourcePath: string, params: ITodoistRequestData): Promise<ITodoistResponseData> {
    return this._api.get(resourcePath, params);
  }

  /**
   * Finds and returns the object from local state based on its id.
   * @param {number} objId
   * @return {object} matching object if found, undefined if not
   */
  getLocalById(objId: ObjectId): any {
    return this.apiState.find((obj: any): boolean => {
      if (typeof objId === 'string') {
        return (obj.temp_id === objId);
      }
      return (obj.id === objId);
    });
  }

  /**
   * Finds and returns the object based on its id.
   * @param {number} objId
   * @return {Promise}
   */
  getById(objId: TodoistId): Promise<ITodoistResponseData> {
    // try state cache first, and if not found, attempt remote fetch
    const response = this.getLocalById(objId) || this.get(objId);
    return Promise.resolve(response);
  }

  /**
   * Shorcut to add commands to the queue.
   * @param {string|Object} cmdDef The definition of the command,
   *   can be a string used as type or an object with desired params.
   * @param {Object} cmdArgs The arguments for the command.
   */
  queueCmd(cmdDef: any, cmdArgs: any = {}) {
    const cmd = Object.assign(
      {
        uuid: generateUuid()
      },
      (
        typeof cmdDef === 'string' ? { type: cmdDef } : cmdDef
      ),
      {
        args: cmdArgs
      }
    );

    this._api.enqueue(cmd);
    return cmd;
  }
}

export default Manager;
