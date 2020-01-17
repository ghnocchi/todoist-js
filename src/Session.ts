/**
 * @fileoverview Handles session related actions like configuration,
 *   requests, tokens and responses.
 * @author Cosmitar
 */
import fetch from 'fetch-everywhere';
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

export interface ISession {
  config(config: SessionConfig): void;
}

/**
 * @class Session
 */
class Session implements ISession {
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
  set accessToken(token) {
    this.sessionConfig.token = token;
  }

  /**
   * Sets the authorization code needed later for access token exchange.
   * @param {string} code
   */
  set code(code) {
    this.sessionConfig.code = code;
  }

  /**
   * Returns the authorization url based on configurations.
   * @return string The full authorization url.
   */
  requestAuthorizationUrl() {
    const query = this._dataToQueryString({
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
  getAccessToken() {
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
  get(url, data = {}) {
    return this.request(url, 'GET', data);
  }

  /**
   * Performs a POST request for the given url and parameters.
   * @param {string} url
   * @param {Object} data
   * @param {Object} customHeaders
   * @return {Promise}
   */
  post(url, data = {}, customHeaders) {
    return this.request(url, 'POST', data, customHeaders);
  }

  _dataToQueryString(data) {
    return Object.keys(data)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(data[k]))
      .join('&');
  }

  /**
   * Executes a request, handling headers, tokens and response.
   * @param {string} url The URL to fetch.
   * @param {string} method An http verb, for this API only GET or POST.
   * @param {Object} data
   * @param {Object} customHeaders
   */
  request(url: string, method: string = 'GET', data: any = {}, customHeaders: any = {}) {
    let headers = {
      ...{
        Accept: 'application/json, text/plain, */*',
        // content type text/plain avoid preflight request not supported
        // by API server
        'Content-Type': 'text/plain'
      }, customHeaders
    };

    if (this.sessionConfig.token) {
      data.token = this.sessionConfig.token;
    }

    if (method === 'POST') {
      data.sync_token = this.sessionConfig.sync_token;
    }

    const query = this._dataToQueryString(data);
    const request_url = `${url}?${query}`;
    return fetch(request_url, {
      method: method,
      headers: headers,
      body: /GET|HEAD/.test(method) ? null : JSON.stringify(data)
    }).then(response => {
      if (response.error_code) {
        throw new Error(`(cod: ${response.error_code}) ${response.error}`);
      }

      if (!response.ok) {
        throw new Error(`(${response.status}) ${response.statusText}`);
      }

      if (response.sync_token) {
        this.sessionConfig.sync_token = response.sync_token;
      }

      // Todoist API always returns a JSON, even on error (except on templates as files)
      if (/attachment/.test(response.headers.get('content-disposition'))) {
        return response;
      }

      return response.json();
    });
  }
}

export default Session;
