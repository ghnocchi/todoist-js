import Api from '../Api';
import { ITodoistRequestData, TodoistResponse } from "../Session";

class Manager {
  private api: Api;

  constructor(api: Api) {
    this.api = api;
  }

  // should be overridden in a subclass
  protected get state_name(): string {
    return '';
  }

  // should be overridden in a subclass
  protected get object_type(): string {
    return '';
  }

  // return subclass-appropriate API state cache
  protected get apiState(): any {
    return this.api.getApiState(this.state_name);
  }

  // add object to subclass-appropriate API state cache
  protected addToApiState(value: any): any {
    return this.api.addToApiState(this.state_name, value);
  }

  // get resource by id, should be overridden in subclass
  protected get(id: number): Promise<TodoistResponse> {
    return null;
  }

  // fetch remote resource
  protected getResource(resource: string, params: ITodoistRequestData): Promise<TodoistResponse> {
    return this.api.get(resource, params);
  }

  // generate UUID
  protected generate_uuid(): string {
    return this.api.generate_uuid();
  }

  // get from local state by id
  getLocalById(objId: number): any {
    return this.api.getApiState(this.state_name).find((obj: any) => obj.id === objId || obj.temp_id === objId);
  }

  /**
   * Finds and returns the object based on its id.
   * @param {number} objId
   * @param {boolean} onlyLocal
   * @return {Promise}
   */
  get_by_id(objId: number, onlyLocal: boolean = false): Promise<TodoistResponse> {
    // try state cache first
    let response = this.getLocalById(objId);

    // if not found, and remote querying allowed and supported, attempt fetch
    if (!response && !onlyLocal && this.object_type) {
      response = this.get(objId);
    }

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
        uuid: this.api.generate_uuid()
      },
      (
        typeof cmdDef === 'string' ? { type: cmdDef } : cmdDef
      ),
      {
        args: cmdArgs
      }
    );

    this.api.queue.push(cmd);
    return cmd;
  }
}

export default Manager;
