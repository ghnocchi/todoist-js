import GenericNotesManager from './GenericNotesManager';
import ProjectNote from './../models/ProjectNote';
import generateUuid from '../utils/uuid';

class ProjectNotesManager extends GenericNotesManager {

  get state_name() {
    return 'project_notes';
  }

  /**
  * Creates a local project note object.
  * @param {number} project_id
  * @param {string} content
  * @param {Object} params
  * @return {ProjectNote}
  */
  add(project_id, content, params) {
    const obj = new ProjectNote({ project_id, content }, this.api);
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
}

export default ProjectNotesManager;
