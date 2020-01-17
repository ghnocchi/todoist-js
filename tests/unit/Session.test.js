import axios from 'axios';
import Session from '../../src/Session';

jest.mock('axios');

const token = 'lkasdf870913u24ioklj09afasdvmklasdt1243q';
const baseUrl = 'http://testurl/blah';
const response = {
  status: 200,
  data: {
    results: 'here',
    sync_token: 'new token',
  },
};

let session;

beforeEach(async () => {
  session = new Session({ token });
});

describe('Session', () => {
  test('should set access token', () => {
    const replacement = '1234';
    expect(session.sessionConfig.token).toEqual(token);
    session.accessToken = replacement;
    expect(session.sessionConfig.token).toEqual(replacement);
  });

  test('should set auth code', () => {
    const replacement = '7654';
    session.code = replacement;
    expect(session.sessionConfig.code).toEqual(replacement);
  });

  test('should get auth url', () => {
    const auth = {
      client_id: 'secretID',
      state: 'dead',
      scope: 'everything',
    };

    // update config with auth info
    session.config(auth);

    // get URL
    const url = session.requestAuthorizationUrl();

    // check for values therein
    expect(url).toEqual(expect.stringContaining(auth.client_id));
    expect(url).toEqual(expect.stringContaining(auth.state));
    expect(url).toEqual(expect.stringContaining(auth.scope));
  });

  test('should get access token', async () => {
    const auth = {
      client_id: 'secretID',
      client_secret: 'geheimnis',
      code: 'abcdefg',
    };

    // update config with auth info
    session.config(auth);

    axios.mockImplementationOnce(() => Promise.resolve(response));

    const req = {
      data: expect.stringContaining(auth.client_secret),
      headers: expect.anything(),
      method: 'POST',
      url: session.sessionConfig.exchange_token_url,
    };

    // should return data portion of response
    await expect(session.getAccessToken()).resolves.toEqual(response.data);

    // verify request payload
    expect(axios).toHaveBeenCalledWith(expect.objectContaining(req));
  });

  test('should perform GET', async () => {
    axios.mockImplementationOnce(() => Promise.resolve(response));

    const req = {
      data: null,
      headers: expect.anything(),
      method: 'GET',
      url: `${baseUrl}?token=${token}`,
    };

    // should return data portion of response
    await expect(session.get(baseUrl)).resolves.toEqual(response.data);

    // verify request payload
    expect(axios).toHaveBeenCalledWith(expect.objectContaining(req));
  });

  test('should perform GET request', async () => {
    axios.mockImplementationOnce(() => Promise.resolve(response));

    const req = {
      data: null,
      headers: expect.anything(),
      method: 'GET',
      url: `${baseUrl}?token=${token}`,
    };

    // should return data portion of response
    await expect(session.request(baseUrl)).resolves.toEqual(response.data);

    // verify request payload
    expect(axios).toHaveBeenCalledWith(expect.objectContaining(req));
  });

  test('should handle GET request failure status', async () => {
    const failResponse = {
      status: 410,
      statusText: 'FFS',
      data: {},
    };

    axios.mockImplementationOnce(() => Promise.resolve(failResponse));

    const req = {
      data: null,
      headers: expect.anything(),
      method: 'GET',
      url: `${baseUrl}?token=${token}`,
    };

    // should return data portion of response
    await expect(session.request(baseUrl)).rejects.toThrow(`(${failResponse.status}) ${failResponse.statusText}`);

    // verify request payload
    expect(axios).toHaveBeenCalledWith(expect.objectContaining(req));
  });

  test('should handle GET request failure sync_status', async () => {
    const failResponse = {
      data: {
        sync_status: {
          '32eaa699-e9d7-47ed-91ea-e58d475791f1': 'ok',
          'bec5b356-3cc1-462a-9887-fe145e3e1ebf': {
            error_code: 15,
            error: 'Invalid temporary id',
          },
        },
      },
    };

    axios.mockImplementationOnce(() => Promise.resolve(failResponse));

    const req = {
      data: null,
      headers: expect.anything(),
      method: 'GET',
      url: `${baseUrl}?token=${token}`,
    };

    // should return data portion of response
    await expect(session.request(baseUrl)).rejects.toThrow('request error: bec5b356-3cc1-462a-9887-fe145e3e1ebf: [15] Invalid temporary id');

    // verify request payload
    expect(axios).toHaveBeenCalledWith(expect.objectContaining(req));
  });

  test('should perform POST', async () => {
    axios.mockImplementationOnce(() => Promise.resolve(response));

    const postData = {
      payload: 'weight',
    };

    const req = {
      data: expect.stringContaining(token),
      headers: expect.anything(),
      method: 'POST',
      url: baseUrl,
    };

    // should return data portion of response
    await expect(session.post(baseUrl, postData)).resolves.toEqual(response.data);

    // verify request payload
    expect(axios).toHaveBeenCalledWith(expect.objectContaining(req));
  });

  test('should perform POST request', async () => {
    axios.mockImplementationOnce(() => Promise.resolve(response));

    const postData = {
      payload: 'weight',
    };

    const req = {
      data: expect.stringContaining(token),
      headers: expect.anything(),
      method: 'POST',
      url: baseUrl,
    };

    // should return data portion of response
    await expect(session.request(baseUrl, 'POST', postData)).resolves.toEqual(response.data);

    // verify request payload
    expect(axios).toHaveBeenCalledWith(expect.objectContaining(req));
  });

  test('should handle template return', async () => {
    const templateResponse = {
      ...response,
      ...{
        headers: {
          'content-disposition': 'there is an attachment here',
        },
      },
    };

    axios.mockImplementationOnce(() => Promise.resolve(templateResponse));

    const postData = {
      payload: 'weight',
    };

    const req = {
      data: expect.stringContaining(token),
      headers: expect.anything(),
      method: 'POST',
      url: baseUrl,
    };

    // should return top-level response, not data
    await expect(session.request(baseUrl, 'POST', postData)).resolves.toEqual(templateResponse);

    // verify request payload
    expect(axios).toHaveBeenCalledWith(expect.objectContaining(req));
  });
});
