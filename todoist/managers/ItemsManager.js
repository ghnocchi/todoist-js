import Manager from './Manager';
import Item from './../models/Item';

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
  add(content, project_id, params) {
    const obj = new Item({ content, project_id }, this.api);
    obj.temp_id = obj.id = this.api.generate_uuid();
    Object.assign(obj.data, params);
    this.api.state[this.state_name].push(obj);

    // get obj data w/o id attribute
    // eslint-disable-next-line no-unused-vars
    const { id, ...args } = obj.data;

    this.queueCmd({
      type: 'item_add',
      temp_id: obj.temp_id
    }, args);
    return obj;
  }

  /**
  * Updates an item remotely.
  * @param {number} item_id
  * @param {Object} params
  */
  update(item_id, params) {
    const args = Object.assign({}, params, { id: item_id });
    this.queueCmd('item_update', args);
  }

  /**
  * Deletes items remotely.
  * @param {Array.<number>} item_ids
  */
  delete(item_ids) {
    item_ids.forEach(id => {
      this.queueCmd('item_delete', { id });
      this.get_by_id(id, true).then(i => {
        if (i) {
          i.is_deleted = 1;
        }
      });
    });
  }

  /**
  * Moves items to another project remotely.
  * @param {Array.<number>} item_ids
  * @param {Object} destination, object with one of parent_id, project_id, section_id
  */
  move(item_ids, destination) {
    const args = {};
    if (destination.project_id) {
      args.project_id = destination.project_id;
    } else if (destination.parent_id) {
      args.parent_id = destination.parent_id;
    } else if (destination.section_id) {
      args.section_id = destination.section_id;
    } else {
      throw new Error(`invalid ItemsManager.move() destination ${destination}`);
    }

    item_ids.forEach(id => {
      args.id = id;
      this.queueCmd('item_move', args);
    });
  }

  /**
  * Marks item as done.
  * @param {number} item_id
  */
  close(item_id) {
    this.queueCmd('item_close', { id: item_id });
  }

  /**
  * Marks items as completed remotely.
  * @param {Array.<number>} item_ids
  * @param {Object} params, optional force_history: boolean, date_completed: RFC3339-formatted date
  */
  complete(item_ids, params = {}) {
    item_ids.forEach(id => {
      const args = { id };
      if (params.force_history) {
        args.force_history = params.force_history;
      }
      if (params.date_completed) {
        args.date_completed = params.date_completed;
      }
      this.queueCmd('item_complete', args);
      this.get_by_id(id, true).then(i => {
        if (i) {
          i.checked = 1;
        }
      });
    });
  }

  /**
  * Marks items as not completed remotely.
  * @param {Array.<number>} item_ids
  */
  uncomplete(item_ids) {
    item_ids.forEach(id => {
      this.queueCmd('item_uncomplete', { id });
      this.get_by_id(id, true).then(i => {
        if (i) {
          i.checked = 0;
        }
      });
    });
  }

  /**
  * Completes a recurring task remotely.
  * @param {number} item_id
  * @param {string} new_date_utc
  * @param {string} date_string
  * @param {boolean} is_forward
  */
  update_date_complete(item_id, new_date_utc, date_string, is_forward) {
    const args = {
      id: item_id
    };

    if (new_date_utc) {
      args.new_date_utc = new_date_utc;
    }

    if (date_string) {
      args.date_string = date_string;
    }

    if (!isNaN(is_forward)) {
      args.is_forward = is_forward;
    }

    this.queueCmd('item_update_date_complete', args);
  }

  /**
  * Updates in the local state the day orders of multiple items remotely.
  * @param {object} ids_to_orders Mapping object with item ids as keys
  *   and number values for order.
  */
  update_day_orders(ids_to_orders) {
    this.queueCmd('item_update_day_orders', { ids_to_orders });
  }

  /**
  * Returns a project's completed items.
  * @param {number} project_id
  * @param {Object} params
  * @return {Promise}
  */
  get_completed(project_id, params) {
    const args = Object.assign({}, params, { project_id });
    return this.api.get('items/get_completed', args);
  }

  /**
  * Gets an existing item.
  * @param {number} item_id
  * @return {Promise}
  */
  get(item_id) {
    const args = { item_id };
    return this.api.get('items/get', args).then((response) => {
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
