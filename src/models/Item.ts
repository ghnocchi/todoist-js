import Model from './Model';
import ItemsManager from '../managers/ItemsManager'; // eslint-disable-line no-unused-vars
import { DateTimeRFC3339, IDueDate, NumericBoolean, TodoistId } from '../types'; // eslint-disable-line no-unused-vars

export interface IItemDestination {
  parent_id?: TodoistId;
  project_id?: TodoistId;
  section_id?: TodoistId;
}

/**
 * Implements an Item.
 */
class Item extends Model {
  public user_id?: TodoistId;
  public parent_id?: TodoistId;
  public project_id?: TodoistId;
  public section_id?: TodoistId;
  public content?: string;
  public due?: IDueDate;
  public priority?: number;
  public day_order?: number;
  public child_order?: number;
  public collapsed?: NumericBoolean;
  public children?: TodoistId[];
  public labels?: TodoistId[];
  public assigned_by_uid?: TodoistId;
  public responsible_uid?: TodoistId;
  public checked?: NumericBoolean;
  public in_history?: NumericBoolean;
  public is_deleted?: NumericBoolean;
  public is_archived?: NumericBoolean;
  public sync_id?: number;
  public date_added?: DateTimeRFC3339;

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
  complete(force_history?: boolean) {
    const args: any = {};
    if (force_history) {
      args.force_history = true;
    }
    this.mgr.complete([this.id], args);
    this.checked = 1;
    this.in_history = force_history ? 1 : 0;
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
