import GenericNotesManager from './GenericNotesManager';
import Note from './../models/Note';
import generateUuid from '../utils/uuid';

class NotesManager extends GenericNotesManager {

  get state_name() {
    return 'notes';
  }

  /**
  * Creates a local item note object.
  * @param {number} item_id
  * @param {string} content
  * @param {Object} params
  * @return {Note}
  */
  add(item_id, content, params) {
    const obj = new Note({ item_id, content }, this.api);
    obj.temp_id = obj.id = generateUuid();
    Object.assign(obj.data, params);
    this.api.state[this.state_name].push(obj);

    // get obj data w/o id attribute
    // eslint-disable-next-line no-unused-vars
    const { id, ...args } = obj.data;

    this.queueCmd({
      type: 'note_add',
      temp_id: obj.temp_id
    }, args);
    return obj;
  }

  /**
  * Gets an existing note.
  * @param {number} note_id
  * @return {Promise}
  */
  get(note_id) {
    const args = { note_id };
    return this.api.get('notes/get', args).then((response) => {
      if (response.error) {
        return null;
      }
      const data = {
        notes: response.note ? [response.note] : []
      };

      this.api.update_state(data);
      return response;
    });
  }
}

export default NotesManager;
