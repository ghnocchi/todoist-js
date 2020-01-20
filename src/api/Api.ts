/**
 * @fileoverview Implements the API that makes it possible to interact with a Todoist user account and its data.
 */
import Session, { ITodoistRequestData, ITodoistStatus, ITodoistResponseData } from './Session';
import ApiState from './ApiState';
// eslint-disable-line no-unused-vars

// managers
import ActivityManager from '../managers/ActivityManager';
import BackupsManager from '../managers/BackupsManager';
import BizInvitationsManager from '../managers/BizInvitationsManager';
import BusinessUsersManager from '../managers/BusinessUsersManager';
import CollaboratorsManager from '../managers/CollaboratorsManager';
import CollaboratorStatesManager from '../managers/CollaboratorStatesManager';
import CompletedManager from '../managers/CompletedManager';
import FiltersManager from '../managers/FiltersManager';
import InvitationsManager from '../managers/InvitationsManager';
import ItemsManager from '../managers/ItemsManager';
import LabelsManager from '../managers/LabelsManager';
import LiveNotificationsManager from '../managers/LiveNotificationsManager';
import LocationsManager from '../managers/LocationsManager';
import MiscManager from '../managers/MiscManager';
import NotesManager from '../managers/NotesManager';
import ProjectNotesManager from '../managers/ProjectNotesManager';
import ProjectsManager from '../managers/ProjectsManager';
import RemindersManager from '../managers/RemindersManager';
import TemplatesManager from '../managers/TemplatesManager';
import UploadsManager from '../managers/UploadsManager';
import UserManager from '../managers/UserManager';

// models
import Collaborator from '../models/Collaborator';
import CollaboratorState from '../models/CollaboratorState';
import Filter from '../models/Filter';
import Item from '../models/Item';
import Label from '../models/Label';
import LiveNotification from '../models/LiveNotification';
import Note from '../models/Note';
import Project from '../models/Project';
import ProjectNote from '../models/ProjectNote';
import Reminder from '../models/Reminder';
import User from '../models/User'; // eslint-disable-line no-unused-vars

interface UnusedITodoistSyncResponseData {
  tooltips?: object;
  filters?: object[][];
  sync_status?: ITodoistStatus;
  temp_id_mapping?: any,
  labels?: object[][];
  locations?: object[][];
  project_notes?: object[][];
  user?: User;
  full_sync?: boolean;
  sync_token?: string;
  projects?: object[][];
  collaborators?: object[][];
  stats?: object;
  live_notifications_last_read_id?: number;
  items?: object[][];
  incomplete_item_ids?: number[];
  reminders?: object[][];
  user_settings?: object;
  incomplete_project_ids?: number[];
  notes?: object[][];
  live_notifications?: object[][];
  sections?: object[][];
  collaborator_states?: object[][];
  due_exceptions?: object[][];
}

/**
 * @class Api
 */
class Api {
  private _apiEndpoint: string;
  private _queue: any[];
  private _states: { [key: string]: ApiState };

  public session: Session; // TODO: revisit, public

  // special handling values in API
  private day_orders?: any = {};
  private day_orders_timestamp?: string = '';
  private settings_notifications?: any = {};

  // TO BE DELETED
  public state: any;
  public projects: ProjectsManager;
  public project_notes: ProjectNotesManager;
  public items: ItemsManager;
  public labels: LabelsManager;
  public filters: FiltersManager;
  public notes: NotesManager;
  public live_notifications: LiveNotificationsManager;
  public reminders: RemindersManager;
  public locations: LocationsManager;
  public invitations: InvitationsManager;
  public biz_invitations: BizInvitationsManager;
  public user: UserManager;
  public collaborators: CollaboratorsManager;
  public collaborator_states: CollaboratorStatesManager;
  public completed: CompletedManager;
  public uploads: UploadsManager;
  public activity: ActivityManager;
  public business_users: BusinessUsersManager;
  public templates: TemplatesManager;
  public backups: BackupsManager;

  constructor(token: string) {
    this._apiEndpoint = 'https://todoist.com';
    // Session instance for requests
    this.session = new Session({ token });
    // Requests to be sent are appended here
    this._queue = [];

    // Local copy of all of the fetched objects and their managers
    this._states = {
      activity: new ApiState(['activity'], new ActivityManager(this)),
      backups: new ApiState(['backups'], new BackupsManager(this)),
      biz_invitations: new ApiState(['biz_invitations'], new BizInvitationsManager(this)),
      business_users: new ApiState(['business_users'], new BusinessUsersManager(this)),
      collaborator_states: new ApiState(['collaborator_states'], new CollaboratorStatesManager(this)),
      collaborators: new ApiState(['collaborators'], new CollaboratorsManager(this)),
      completed: new ApiState(['completed'], new CompletedManager(this)),
      misc: new ApiState(['day_orders', 'day_orders_timestamp', 'settings_notifications'], new MiscManager(this)),
      filters: new ApiState(['filters'], new FiltersManager(this)),
      invitations: new ApiState(['invitations'], new InvitationsManager(this)),
      items: new ApiState(['items'], new ItemsManager(this)),
      labels: new ApiState(['labels'], new LabelsManager(this)),
      live_notifications: new ApiState(['live_notifications', 'live_notifications_last_read_id'], new LiveNotificationsManager(this)),
      locations: new ApiState(['locations'], new LocationsManager(this)),
      notes: new ApiState(['notes'], new NotesManager(this)),
      project_notes: new ApiState(['project_notes'], new ProjectNotesManager(this)),
      projects: new ApiState(['projects'], new ProjectsManager(this)),
      reminders: new ApiState(['reminders'], new RemindersManager(this)),
      templates: new ApiState(['templates'], new TemplatesManager(this)),
      uploads: new ApiState(['uploads'], new UploadsManager(this)),
      user: new ApiState(['user'], new UserManager(this)),
    };
  }

  resetState() {
    Object.values(this._states).forEach((a: ApiState) => a.reset());
  }

  /**
   * place command in queue of commands to be sent on the next commit
   * @param command
   */
  enqueue(command: any) {
    this._queue.push(command);
  }

  /**
   * Returns the full API url to hit.
   * @param {string} resource The API resource.
   * @return {string}
   */
  getApiUrl(resource: string = ''): string {
    return `${this._apiEndpoint}/API/v8/${resource}`;
  }

  /**
   * Performs a GET request prepending the API endpoint.
   * @param {string} resource Requested resource
   * @param {ITodoistRequestData} params
   * @return {Promise}
   */
  get(resource: string, params: ITodoistRequestData): Promise<ITodoistResponseData> {
    return this.session.get(
      this.getApiUrl(resource),
      params,
    );
  }

  /**
   * Performs a POST request prepending the API endpoint.
   * @param {string} resource Requested resource
   * @param {ITodoistRequestData} params
   * @param {Object} customHeaders
   * @return {Promise}
   */
  post(resource: string, params: ITodoistRequestData, customHeaders: any): Promise<ITodoistResponseData> {
    return this.session.post(
      this.getApiUrl(resource),
      params,
      customHeaders,
    );
  }

  /**
   * Sends to the server the changes that were made locally, and also
   *   fetches the latest updated data from the server.
   * @param {Array.<object>} commands List of commands to be processed.
   * @return {Object} Server response
   */
  async sync(commands: any[] = []): Promise<ITodoistResponseData> {
    const miscManager = <MiscManager>this._states.misc.manager;
    const { day_orders_timestamp } = miscManager.current;

    const response: ITodoistResponseData = <ITodoistResponseData>await this.session.get(
      this.getApiUrl('sync'),
      {
        day_orders_timestamp,
        include_notification_settings: 1,
        resource_types: JSON.stringify(['all']),
        commands: JSON.stringify(commands),
      },
    );

    const temp_keys = Object.keys(response.temp_id_mapping || {});
    if (temp_keys.length > 0) {
      temp_keys.forEach((temp_id) => {
        const new_id = response.temp_id_mapping[temp_id];
        this.replace_temp_id(temp_id, new_id);
      });
    }

    await this.updateLocalState(response);

    return response;
  }

  /**
   * Updates the local state, with the data returned by the server after a
   *   sync.
   * @param {Object} syncdata Data returned by {@code this.sync}.
   */
  async updateLocalState(syncdata: ITodoistResponseData) {
    // It is straightforward to update these type of data, since it is
    // enough to just see if they are present in the sync data, and then
    // either replace the local values or update them.
    const keys = ['day_orders', 'day_orders_timestamp', 'live_notifications_last_read_id', 'locations', 'settings_notifications', 'user'];
    keys.map((key) => {
      const value: any = (syncdata as any)[key];
      if (value) {
        this.setApiState(key, value);
      }
    });

    const resp_models_mapping = {
      collaborator: Collaborator,
      collaborator_states: CollaboratorState,
      filters: Filter,
      items: Item,
      labels: Label,
      live_notifications: LiveNotification,
      notes: Note,
      project_notes: ProjectNote,
      projects: Project,
      reminders: Reminder,
    };

    // Updating these type of data is a bit more complicated, since it is
    // necessary to find out whether an object in the sync data is new,
    // updates an existing object, or marks an object to be deleted.  But
    // the same procedure takes place for each of these types of data.
    let promises: Promise<any>[] = [];
    Object.keys(resp_models_mapping).forEach((datatype) => {
      // Process each object of this specific type in the sync data.
      // Collect a promise for each object due to some this.find_object are asynchronous
      // since they hit the server looking for remote objects
      const typePromises = ((syncdata as any)[datatype] || []).map((remoteObj: any) => {
        return Promise.resolve().then(async () => {
          // Find out whether the object already exists in the local state.
          const localObj = await this.find_object(datatype, remoteObj);
          if (localObj) {
            // If the object is already present in the local state, then
            // we either update it
            if (localObj.data) { // TODO: once .data is removed from all models, remove here
              Object.assign(localObj.data, remoteObj);
            } else {
              Object.assign(localObj, remoteObj);
            }
          } else {
            // If not, then the object is new and it should be added
            const newObj = new (resp_models_mapping as any)[datatype](remoteObj, this);
            this.addToApiState(datatype, newObj);
          }
        });
      });

      promises.push.apply(promises, typePromises);
    });
    // await for all promises to resolve and continue.
    await Promise.all(promises);

    // since sync response isn't including deleted objects, we'll rid of from state
    // all those items marked as to be deleted
    Object.keys(resp_models_mapping).forEach((datatype) => {
      const curState = this.getApiState(datatype);
      if (curState) {
        this.setApiState(datatype, curState.filter((stateObj: any) => stateObj.is_deleted !== 1));
      }
    });
  }

  /**
   * Searches for an object in the local state, depending on the type of object, and then on its primary key is.
   *   If the object is found it is returned, and if not, then null is returned.
   * @param {string} objtype Name for the type of the searching object.
   * @param {Object} obj Object from where to take search paramters.
   * @return {Object|null} Depending on search result.
   */
  find_object(objtype: string, obj: any): Promise<any> {
    if (objtype === 'collaborators') {
      return this.collaborators.get_by_id(obj.id);
    } else if (objtype === 'collaborator_states') {
      return this.collaborator_states.get_by_ids(obj.project_id, obj.user_id);
    } else if (objtype === 'filters') {
      return this.filters.get_by_id(obj.id, true);
    } else if (objtype === 'items') {
      return this.items.get_by_id(obj.id, true);
    } else if (objtype === 'labels') {
      return this.labels.get_by_id(obj.id, true);
    } else if (objtype === 'live_notifications') {
      return this.live_notifications.get_by_id(obj.id);
    } else if (objtype === 'notes') {
      return this.notes.get_by_id(obj.id, true);
    } else if (objtype === 'project_notes') {
      return this.project_notes.get_by_id(obj.id, true);
    } else if (objtype === 'projects') {
      return this.projects.get_by_id(obj.id, true);
    } else if (objtype === 'reminders') {
      return this.reminders.get_by_id(obj.id, true);
    }

    return null;
  }

  /**
   * Replaces the temporary id generated locally when an object was first
   *   created, with a real Id supplied by the server. True is returned if
   *   the temporary id was found and replaced, and false otherwise.
   * @param {string} temp_id Temporary item id.
   * @param {number} new_id New item id.
   * @return {boolean} Whether temporary id was found or not.
   */
  replace_temp_id(temp_id: string, new_id: number) {
    const datatypes = ['filters', 'items', 'labels', 'notes', 'project_notes', 'projects', 'reminders'];
    for (let typeIndex = 0; typeIndex < datatypes.length; typeIndex++) {
      const stateObjects = this.getApiState(datatypes[typeIndex]);
      for (let objIndex = 0; objIndex < stateObjects.length; objIndex++) {
        const obj = stateObjects[objIndex];
        if (obj.temp_id === temp_id) {
          obj.id = new_id;
          obj.temp_id = '';

          // unique, so break as soon as we find a match
          typeIndex = datatypes.length;
          break;
        }
      }
    }
  }

  /**
   * Commits all requests that are queued.  Note that, without calling this
   * method none of the changes that are made to the objects are actually
   * synchronized to the server, unless one of the aforementioned Sync API
   * calls is called directly.
   */
  async commit(raise_on_error: boolean = true): Promise<ITodoistResponseData> {
    if (!this._queue.length) {
      return null;
    }

    const response = await this.sync(this._queue);
    if (response.sync_status) {
      if (raise_on_error) {
        Object.keys(response.sync_status).forEach((key) => {
          if (response.sync_status[key] !== 'ok') {
            const failedReq = this._queue.filter(e => e.uuid === key);
            const failedReqStr = failedReq ? JSON.stringify(failedReq) : '(not found)';
            this._queue = [];
            throw new Error(`sync fail (${key}, ${failedReqStr}, ${JSON.stringify(response.sync_status[key])})`);
          }
        });
      }
    }

    this._queue = [];
    return response;
  }


  /**
   * Adds a new task.
   * @param {string} content The description of the task.
   * @param {Object} params All other parameters to set in the new task.
   * @return {Promise}
   */
  async add_item(content: string, params: any = {}): Promise<ITodoistResponseData> {
    // TODO: signature should match mgr one, and this should simply delegate to it
    // should this even exist?  just use the ItemManager
    Object.assign(params, { content });
    if (params.labels) {
      params.labels = JSON.stringify(params.labels);
    }
    return this.get('add_item', params);
  }


}


export default Api;
