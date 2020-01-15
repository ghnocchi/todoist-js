import Model from './Model';

/**
* Implements an Item.
*/
class Item extends Model {

  get definition() {
    return {
      id: 0,
      user_id: 0,
      parent_id: 0,
      project_id: 0,
      section_id: 0,
      content: '',
      due: {},
      indent: 0,
      priority: 0,
      item_order: 0,
      day_order: 0,
      collapsed: 0,
      children: null,
      labels: [],
      assigned_by_uid: 0,
      responsible_uid: null,
      checked: 0,
      in_history: 0,
      is_deleted: 0,
      is_archived: 0,
      sync_id: null,
      date_added: ''
    };
  }

  /**
  * Updates item.
  * @param {Object} params
  */
  update(params) {
    this.api.items.update(this.id, params);
    Object.assign(this.data, params);
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
  * @param {Object} destination, object with one of parent_id, project_id, section_id
  */
  move(destination) {
    if (destination.project_id) {
      this.project_id = destination.project_id;
    } else if (destination.parent_id) {
      this.parent_id = destination.parent_id;
    } else if (destination.section_id) {
      this.section_id = destination.section_id;
    } else {
      throw new Error(`invalid Item.move() destination ${JSON.stringify(destination)}`);
    }

    this.api.items.move([this.id], destination);
  }

  /**
  * Marks item as closed.
  */
  close() {
    this.api.items.close(this.id);
  }

  /**
  * Marks item as completed.
  * @param {boolean} force_history
  */
  complete(force_history = 0) {
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
   * @param {object} due Todoist Due date object
   * {
   *   date: '2018-11-15',
   *   timezone: null,
   *   is_recurring: false,
   *   string: 'tomorrow',
   *   lang: 'en',
   * }
   */
  update_date_complete(due = null) {
    // eslint-disable-next-line no-warning-comments
    // TODO: validate due
    this.api.items.update_date_complete(this.id, due);
    this.due = due;
  }
}

export default Item;
