/**
 * @fileoverview Handles session related actions like configuration,
 *   requests, tokens and responses.
 */
import axios, { AxiosResponse, Method } from 'axios'; // eslint-disable-line no-unused-vars
import { generate_uuid } from './utils/uuid';

export interface IConfig {
  app_token?: string;
  client_id?: string;
  client_secret?: string;
  code?: string;
  scope?: string;
  state?: string;
  token?: string;
  sync_token?: string;
  auth_url?: string;
  exchange_token_url?: string;
}

export class SessionConfig implements IConfig {
  app_token?: string;
  client_id?: string;
  client_secret?: string;
  code?: string;
  scope?: string;
  state?: string;
  token?: string;
  sync_token?: string;
  auth_url?: string;
  exchange_token_url?: string;
}

interface ITodoistError {
  error_code: number;
  error: string;
}

interface ITodoistStatus {
  [key: string]: string | ITodoistError;
}

interface ITodoistRequestData {
  [key: string]: (string | number | boolean);
}

interface ITodoistResponseData {
  tooltips: object;
  filters: [[object]];
  sync_status: ITodoistStatus;
  temp_id_mapping: object,
  labels: [[object]];
  locations: [];
  project_notes: [[object]];
  user: object;
  full_sync: boolean;
  sync_token: string;
  day_orders: object;
  projects: [[object]];
  collaborators: [[object]];
  stats: object;
  day_orders_timestamp: string;
  live_notifications_last_read_id: number;
  items: [[object]];
  incomplete_item_ids: [number];
  reminders: [[object]];
  user_settings: object;
  incomplete_project_ids: [number];
  notes: [[object]];
  live_notifications: [[object]];
  sections: [[object]];
  collaborator_states: [[object]];
  due_exceptions: [[object]];
}

interface ITodoistResponse extends AxiosResponse<ITodoistResponseData> {
}

type TodoistResponse = ITodoistResponse | ITodoistResponseData;

/**
 * @class Session
 */
class Session {
  sessionConfig: SessionConfig;

  /**
   * @param {Object} config Configuration object with optional params
   * @constructor
   */
  constructor(config: SessionConfig = {}) {
    this.config(config);
  }

  /**
   * Simplifies deferred config after creating an instance
   *   of a session.
   * @param {Object} config An object that can contain
   *   app_token
   *   client_id
   *   scope
   *   state
   *   client_secret
   */
  config(config: SessionConfig = {}) {
    const defaultConfig: SessionConfig = {
      app_token: '',
      client_id: '',
      client_secret: '',
      code: '',
      scope: 'data:read_write,data:delete,project:delete',
      state: generate_uuid(),
      token: '',
      sync_token: '*',
      auth_url: 'https://todoist.com/oauth/authorize',
      exchange_token_url: 'https://todoist.com/oauth/access_token',
    };

    this.sessionConfig = { ...defaultConfig, ...config };
  }

  /**
   * Sets an access token for current session.
   * @param {string} token
   */
  set accessToken(token: string) {
    this.sessionConfig.token = token;
  }

  /**
   * Sets the authorization code needed later for access token exchange.
   * @param {string} code
   */
  set code(code: string) {
    this.sessionConfig.code = code;
  }

  /**
   * Returns the authorization url based on configurations.
   * @return string The full authorization url.
   */
  requestAuthorizationUrl(): string {
    const query: string = this._dataToQueryString({
      client_id: this.sessionConfig.client_id,
      scope: this.sessionConfig.scope,
      state: this.sessionConfig.state,
    });

    return `${this.sessionConfig.auth_url}?${query}`;
  }

  /**
   * Requests an access token to the server.
   * @return {Promise}
   */
  getAccessToken(): Promise<TodoistResponse> {
    return this.request(this.sessionConfig.exchange_token_url, 'POST', {
      client_id: this.sessionConfig.client_id,
      client_secret: this.sessionConfig.client_secret,
      code: this.sessionConfig.code,
    });
  }


  /**
   * Performs a GET request for the given url and parameters.
   * @param {string} url
   * @param {Object} data
   * @return {Promise}
   */
  get(url: string, data = {}): Promise<TodoistResponse> {
    return this.request(url, 'GET', data);
  }

  /**
   * Performs a POST request for the given url and parameters.
   * @param {string} url
   * @param {Object} data
   * @param {Object} customHeaders
   * @return {Promise}
   */
  post(url: string, data = {}, customHeaders: any = {}): Promise<TodoistResponse> {
    return this.request(url, 'POST', data, customHeaders);
  }

  private _dataToQueryString(data: ITodoistRequestData): string {
    return Object.keys(data)
      .map((k: string) => encodeURIComponent(k) + '=' + encodeURIComponent(data[k]))
      .join('&');
  }

  /**
   * Executes a request, handling headers, tokens and response.
   * @param {string} url The URL to fetch.
   * @param {string} method An http verb, for this API only GET or POST.
   * @param {Object} data
   * @param {Object} customHeaders
   */
  request(url: string, method: string = 'GET', data: ITodoistRequestData = {}, customHeaders: any = {}): Promise<TodoistResponse> {
    let headers: object = {
      ...{
        Accept: 'application/json, text/plain, */*',
        // content type text/plain avoid preflight request not supported
        // by API server
        'Content-Type': 'text/plain'
      }, ...customHeaders
    };

    if (this.sessionConfig.token) {
      data.token = this.sessionConfig.token;
    }

    if (method === 'POST') {
      data.sync_token = this.sessionConfig.sync_token;
    }

    // assemble GET vs POST parameters
    let request_url: string = `${url}`;
    let payloadData: string = null;
    if (/GET|HEAD/.test(method)) {
      request_url = `${request_url}?${this._dataToQueryString(data)}`;
    } else {
      payloadData = JSON.stringify(data);
    }

    return axios({
      url: request_url,
      method: <Method>method,
      headers: headers,
      data: payloadData,
    }).then((response: ITodoistResponse) => {
      const responseData: ITodoistResponseData = response.data;

      if (responseData.sync_status) {
        const error: [string, ITodoistError] = <[string, ITodoistError]>Object.entries(responseData.sync_status).find((e: any) =>
          typeof e[1] === 'object' && e[1].hasOwnProperty('error'));
        if (error) {
          const [key, err]: [string, ITodoistError] = error;
          throw new Error(`request error: ${key}: [${err.error_code}] ${err.error}`);
        }
      }

      if (response.status !== 200) {
        throw new Error(`(${response.status}) ${response.statusText}`);
      }

      if (responseData.sync_token) {
        this.sessionConfig.sync_token = responseData.sync_token;
      }

      // Todoist API always returns a JSON, even on error, except on templates as files
      if (response.headers && /attachment/.test(response.headers['content-disposition'])) {
        return response;
      }

      return responseData;
    });
  }
}

export default Session;
