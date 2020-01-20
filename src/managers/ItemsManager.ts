import Manager from './Manager';
import Item, { IItemDestination } from '../models/Item'; // eslint-disable-line no-unused-vars
import { ITodoistRequestData, ITodoistResponseData, TodoistResponse } from '../api/Session'; // eslint-disable-line no-unused-vars
import { IDueDate, NumericBoolean, TodoistId } from '../types'; // eslint-disable-line no-unused-vars
import generateUuid from '../utils/uuid';

interface ISingleItemResponseData {
  project: any;
  item: Item;
  notes: any[];
}

class ItemsManager extends Manager {
  /**
   * create a model instance from the given data
   * @param data, model attribute values
   */
  create(data: Partial<Item> = {}): Item {
    return new Item(data, this);
  }

  /**
   * Gets an existing item.
   * @param {number} itemId
   * @return {Promise}
   */
  get(itemId: TodoistId): Promise<ITodoistResponseData> {
    const args = { item_id: itemId };
    return this.getRemoteResource('items/get', args).then((response: ITodoistResponseData) => {
      if (response.error) {
        return null;
      }

      const singleResponse = <ISingleItemResponseData>response;
      const data = {
        projects: singleResponse.project ? [singleResponse.project] : [],
        items: singleResponse.item ? [singleResponse.item] : [],
        notes: singleResponse.notes ? [...singleResponse.notes] : []
      };

      this.updateLocalState(<any>data);

      return response;
    });
  }

  /**
   * Returns a project's completed items.
   * @param {number} projectId
   * @param {ITodoistRequestData} params
   * @return {Promise}
   */
  get_completed(projectId: TodoistId, params: ITodoistRequestData) {
    const args = { ...params, ...{ project_id: projectId } };
    return this.getRemoteResource('items/get_completed', args);
  }
  /**
   * Creates a local item object.
   * @param {string} content
   * @param {TodoistId} project_id
   * @param {Object} params
   * @return {Item}
   */
  add(content: string, project_id?: TodoistId, params: any = {}): Item {
    const newItem = new Item({ content, project_id }, this);
    if (params.labels) {
      params.labels = JSON.stringify(params.labels);
    }
    newItem.temp_id = generateUuid();
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
   * @param {number} itemId
   * @param {Object} params
   */
  update(itemId: TodoistId, params: any) {
    const args = Object.assign({}, params, { id: itemId });
    this.queueCmd('item_update', args);
  }

  /**
   * Deletes items remotely.
   * @param {Array.<number>} itemIds
   */
  delete(itemIds: TodoistId[]) {
    itemIds.forEach(itemId => {
      this.queueCmd('item_delete', { id: itemId });
      const stateItem = this.getLocalById(itemId);
      if (stateItem) {
        stateItem.is_deleted = 1;
      }
    });
  }

  /**
   * Moves items to another project remotely.
   * @param {Array.<number>} itemIds
   * @param {IItemDestination} destination, object with one of parent_id, project_id, section_id
   */
  move(itemIds: TodoistId[], destination: IItemDestination) {
    const args = { ...{ id: null }, ...destination };
    itemIds.forEach(itemId => {
      args.id = itemId;
      this.queueCmd('item_move', args);
    });
  }

  /**
   * Marks item as done.
   * @param {number} itemId
   */
  close(itemId: TodoistId) {
    this.queueCmd('item_close', { id: itemId });
    const stateItem = this.getLocalById(itemId);
    if (stateItem) {
      stateItem.is_deleted = 1; // close implies delete
    }
  }

  /**
   * Marks items as completed remotely.
   * @param {Array.<number>} itemIds
   * @param {Object} params, optional force_history: boolean, date_completed: RFC3339-formatted date
   */
  complete(itemIds: TodoistId[], params: { force_history?: boolean, date_completed?: string } = {}) {
    itemIds.forEach(item_id => {
      const args: { id: number, force_history?: NumericBoolean, date_completed?: string } = { id: item_id };
      if (params.force_history) {
        args.force_history = params.force_history ? 1 : 0;
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
   * @param {Array.<number>} itemIds
   */
  uncomplete(itemIds: TodoistId[]) {
    itemIds.forEach(itemId => {
      this.queueCmd('item_uncomplete', { id: itemId });
      const stateItem = this.getLocalById(itemId);
      if (stateItem) {
        stateItem.checked = 0;
      }
    });
  }

  /**
   * Completes a recurring task remotely.
   * @param {number} itemId
   * @param {IDueDate} due Todoist Due date object
   */
  update_date_complete(itemId: TodoistId, due?: IDueDate) {
    const args = {
      id: itemId,
      due
    };

    this.queueCmd('item_update_date_complete', args);
  }

  /**
   * Updates in the local state the day orders of multiple items remotely.
   * @param {object} idsToOrders Mapping object with item ids as keys
   *   and number values for order.
   */
  update_day_orders(idsToOrders: { TodoistId: number[] }) {
    this.queueCmd('item_update_day_orders', { ids_to_orders: idsToOrders });
  }


}

export default ItemsManager;
