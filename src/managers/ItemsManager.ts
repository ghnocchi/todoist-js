import Manager from './Manager';
import Item, { IDueDate, NumericBoolean } from '../models/Item'; // eslint-disable-line no-unused-vars
import { ITodoistRequestData } from '../Session'; // eslint-disable-line no-unused-vars

interface IItemMoveDestination {
  project_id?: number;
  parent_id?: number;
  section_id?: number;
}

class ItemsManager extends Manager {

  get state_name() {
    return 'items';
  }

  get object_type() {
    return 'item';
  }

  /**
   * Creates a local item object.
   * @param {string} content
   * @param {number} project_id
   * @param {Object} params
   * @return {Item}
   */
  add(content: string, project_id: number, params: any = {}): Item {
    const newItem = new Item({ content, project_id }, this);
    newItem.temp_id = this.generate_uuid();
    Object.assign(newItem, params);
    this.addToApiState(newItem);

    // get obj properties w/o id attribute
    const { id, ...args } = newItem.properties; // eslint-disable-line no-unused-vars

    this.queueCmd({
      type: 'item_add',
      temp_id: newItem.temp_id
    }, args);
    return newItem;
  }

  /**
   * Updates an item remotely.
   * @param {number} item_id
   * @param {Object} params
   */
  update(item_id: number, params: any) {
    const args = Object.assign({}, params, { id: item_id });
    this.queueCmd('item_update', args);
  }

  /**
   * Deletes items remotely.
   * @param {Array.<number>} item_ids
   */
  delete(item_ids: number[]) {
    item_ids.forEach(item_id => {
      this.queueCmd('item_delete', { id: item_id });
      const stateItem = this.getLocalById(item_id);
      if (stateItem) {
        stateItem.is_deleted = 1;
      }
    });
  }

  /**
   * Moves items to another project remotely.
   * @param {Array.<number>} item_ids
   * @param {IItemMoveDestination} destination, object with one of parent_id, project_id, section_id
   */
  move(item_ids: number[], destination: IItemMoveDestination) {
    const args = { ...{ id: null }, ...destination };
    item_ids.forEach(id => {
      args.id = id;
      this.queueCmd('item_move', args);
    });
  }

  /**
   * Marks item as done.
   * @param {number} item_id
   */
  close(item_id: number) {
    this.queueCmd('item_close', { id: item_id });
    const stateItem = this.getLocalById(item_id);
    if (stateItem) {
      stateItem.is_deleted = 1; // close implies delete
    }
  }

  /**
   * Marks items as completed remotely.
   * @param {Array.<number>} item_ids
   * @param {Object} params, optional force_history: boolean, date_completed: RFC3339-formatted date
   */
  complete(item_ids: number[], params: { force_history?: boolean, date_completed?: string } = {}) {
    item_ids.forEach(item_id => {
      const args: { id: number, force_history?: boolean, date_completed?: string } = { id: item_id };
      if (params.force_history) {
        args.force_history = params.force_history;
      }
      if (params.date_completed) {
        args.date_completed = params.date_completed;
      }
      this.queueCmd('item_complete', args);
      const stateItem = this.getLocalById(item_id);
      if (stateItem) {
        stateItem.checked = 1;
      }
    });
  }

  /**
   * Marks items as not completed remotely.
   * @param {Array.<number>} item_ids
   */
  uncomplete(item_ids: number[]) {
    item_ids.forEach(item_id => {
      this.queueCmd('item_uncomplete', { id: item_id });
      const stateItem = this.getLocalById(item_id);
      if (stateItem) {
        stateItem.checked = 0;
      }
    });
  }

  /**
   * Completes a recurring task remotely.
   * @param {number} item_id
   * @param {IDueDate} due Todoist Due date object
   */
  update_date_complete(item_id: number, due?: IDueDate) {
    const args = {
      id: item_id,
      due
    };

    this.queueCmd('item_update_date_complete', args);
  }

  /**
   * Updates in the local state the day orders of multiple items remotely.
   * @param {object} ids_to_orders Mapping object with item ids as keys
   *   and number values for order.
   */
  update_day_orders(ids_to_orders: { number: number[] }) {
    this.queueCmd('item_update_day_orders', { ids_to_orders });
  }

  /**
   * Returns a project's completed items.
   * @param {number} project_id
   * @param {ITodoistRequestData} params
   * @return {Promise}
   */
  get_completed(project_id: number, params: ITodoistRequestData) {
    const args = { ...params, ...{ project_id } };
    return this.getResource('items/get_completed', args);
  }

  /**
   * Gets an existing item.
   * @param {number} item_id
   * @return {Promise}
   */
  get(item_id: number) {
    const args = { item_id };
    return this.getResource('items/get', args).then((response) => {
      if (response.error) {
        return null;
      }
      const data = {
        projects: response.project ? [response.project] : [],
        items: response.item ? [response.item] : [],
        // @TODO check how to assign notes here
        notes: response.note ? [...response.notes] : []
      };
      this.api.update_state(data);

      return response;
    });

  }
}

export default ItemsManager;
