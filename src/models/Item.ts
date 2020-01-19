import Model from './Model';
import ItemsManager from '../managers/ItemsManager'; // eslint-disable-line no-unused-vars

export type NumericBoolean = 0 | 1;

export interface IDueDate {
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

  constructor(data: Partial<Item> = {}, manager: ItemsManager) {
    super(manager);
    Object.assign(this, data);
  }

  get mgr(): ItemsManager {
    return <ItemsManager>this.manager;
  }

  /**
   * Updates item.
   * @param {Object} data
   */
  update(data: Partial<Item> = {}) {
    this.mgr.update(this.id, data);
    Object.assign(this, data);
  }

  /**
   * Deletes item.
   */
  delete() {
    this.mgr.delete([this.id]);
    this.is_deleted = 1;
  }

  /**
   * Moves item to another project.
   * @param {IItemDestination} destination, object with one of parent_id, project_id, section_id
   */
  move(destination: IItemDestination) {
    Object.assign(this, destination);
    this.mgr.move([this.id], destination);
  }

  /**
   * Marks item as closed.
   */
  close() {
    this.mgr.close(this.id);
    this.is_deleted = 1;
  }

  /**
   * Marks item as completed.
   * @param {boolean} force_history
   */
  complete(force_history: NumericBoolean = 0) {
    this.mgr.complete([this.id], force_history);
    this.checked = 1;
    this.in_history = force_history;
  }

  /**
   * Marks item as not completed.
   */
  uncomplete() {
    this.mgr.uncomplete([this.id]);
    this.checked = 0;
  }

  /**
   * Completes a recurring task.
   * @param {IDueDate} due Todoist Due date object
   */
  update_date_complete(due?: IDueDate) {
    this.mgr.update_date_complete(this.id, due);
    this.due = due;
  }
}

export default Item;
