import Model from './Model';
import Api from '../Api'; // eslint-disable-line no-unused-vars

type NumericBoolean = 0 | 1;

interface IDueDate {
  date?: string;
  timezone?: string,
  string?: string,
  lang?: string,
  is_recurring?: boolean,
}

export interface IItemDestination {
  parent_id?: number;
  project_id?: number;
  section_id?: number;
}

/**
 * Implements an Item.
 */
class Item extends Model {
  public id?: number;
  public user_id?: number;
  public parent_id?: number;
  public project_id?: number;
  public section_id?: number;
  public content?: string;
  public due?: IDueDate;
  public indent?: number;
  public priority?: number;
  public item_order?: number;
  public day_order?: number;
  public collapsed?: number;
  public children?: number[];
  public labels?: number[];
  public assigned_by_uid?: number;
  public responsible_uid?: number;
  public checked?: NumericBoolean;
  public in_history?: NumericBoolean;
  public is_deleted?: NumericBoolean;
  public is_archived?: NumericBoolean;
  public sync_id?: number;
  public date_added?: string;

  constructor(data: Partial<Item> = {}, api: Api) {
    super(api);
    Object.assign(this, data);
  }

  /**
   * Updates item.
   * @param {Object} data
   */
  update(data: Partial<Item> = {}) {
    this.api.items.update(this.id, <any>data); // TODO: remove casting once manager is TS
    Object.assign(this, data);
  }

  /**
   * Deletes item.
   */
  delete() {
    this.api.items.delete([this.id]);
    this.is_deleted = 1;
  }

  /**
   * Moves item to another project.
   * @param {IItemDestination} destination, object with one of parent_id, project_id, section_id
   */
  move(destination: IItemDestination) {
    Object.assign(this, destination);
    this.api.items.move([this.id], destination);
  }

  /**
   * Marks item as closed.
   */
  close() {
    this.api.items.close(this.id);
    this.is_deleted = 1;
  }

  /**
   * Marks item as completed.
   * @param {boolean} force_history
   */
  complete(force_history: NumericBoolean = 0) {
    this.api.items.complete([this.id], force_history);
    this.checked = 1;
    this.in_history = force_history;
  }

  /**
   * Marks item as not completed.
   */
  uncomplete() {
    this.api.items.uncomplete([this.id]);
    this.checked = 0;
  }

  /**
   * Completes a recurring task.
   * @param {IDueDate} due Todoist Due date object
   */
  update_date_complete(due: IDueDate = null) {
    this.api.items.update_date_complete(this.id, due);
    this.due = due;
  }
}

export default Item;
