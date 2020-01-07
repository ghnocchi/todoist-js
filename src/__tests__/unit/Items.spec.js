import API from '../../Api';
import { env, matcher, getDateString } from '../helpers';

// mock actual API communication
jest.mock('../../Session');
const expectUuid = expect.stringMatching(matcher.uuid);

let api = new API(env.ACCESS_TOKEN);

const itemBaseName = '_TestItem';

let item1;
let inbox;

beforeEach(async () => {
  // reset cache
  api.session.reset();
  api.resetState();

  await api.sync();
  inbox = api.state.projects.find(project => project.name === 'Inbox');
  item1 = api.items.add(`${itemBaseName}1`, inbox.id);

  await api.commit();

  // NB: the pseudo-response did not have temp_id_mapping, so update it here
  item1.id = api.state.items.find(i => i.content === item1.content).id;
});

// check that the command JSON sent by the API looks as expected
function checkCommandsSent(request, expectedCommands) {
  const expectedData = expect.objectContaining({
    commands: expectedCommands,
  });
  const expectedRequest = expect.objectContaining({
    data: expectedData,
  });

  const actualRequest = { ...request };

  expect(actualRequest.data && actualRequest.data.commands).toBeDefined();
  if (typeof actualRequest.data.commands === 'string') {
    actualRequest.data.commands = JSON.parse(actualRequest.data.commands);
  }

  expect(actualRequest).toEqual(expectedRequest);
}

describe('Items model', () => {
  test('should do setup sync and item_add commit', async () => {
    // check that the setup beforeAll() calls look correct
    const [originalSync, itemAdd] = api.session.clearRequests();
    checkCommandsSent(originalSync, []);
    checkCommandsSent(itemAdd, [
      {
        type: 'item_add',
        uuid: expectUuid,
        temp_id: expectUuid,
        args: {
          content: item1.content,
          project_id: inbox.id,
          temp_id: expectUuid,
        },
      },
    ]);

    // check that the local state/cache and objects get correctly updated
    expect(api.state.items.some(i => i.content === `${itemBaseName}1`)).toBe(true);
    expect(item1.content).toEqual(`${itemBaseName}1`);
    expect(inbox.id).toBeGreaterThan(0);
  });

  test('should complete itself', async () => {
    // queue complete command
    item1.complete();

    // prepare pseudo response
    const response = api.session.syncResponse;
    const respItem = response.items.find(i => i.id === item1.id);
    respItem.checked = 1;

    // send command
    await api.commit();

    // check commands sent
    const itemComplete = api.session.popRequest();
    checkCommandsSent(itemComplete, [
      {
        type: 'item_complete',
        uuid: expectUuid,
        args: {
          id: item1.id,
        },
      },
    ]);

    // check local cache and object state
    expect(api.state.items.find(i => i.id === item1.id).checked).toBeTruthy();
    expect(item1.checked).toBeTruthy();
  });

  test('should uncomplete itself', async () => {
    // queue uncomplete command
    item1.uncomplete();

    // prepare pseudo response
    const response = api.session.syncResponse;
    const respItem = response.items.find(i => i.id === item1.id);
    respItem.checked = 0;

    // send command
    await api.commit();

    // check commands sent
    const itemUncomplete = api.session.popRequest();
    checkCommandsSent(itemUncomplete, [
      {
        type: 'item_uncomplete',
        uuid: expectUuid,
        args: {
          id: item1.id,
        },
      },
    ]);

    // check local cache and object state
    expect(api.state.items.find(i => i.id === item1.id).checked).toBeFalsy();
    expect(item1.checked).toBeFalsy();
  });

  test('should update its content', async () => {
    // queue update command
    const content = `${itemBaseName}Updated1`;
    item1.update({ content });

    // prepare pseudo response
    const response = api.session.syncResponse;
    const respItem = response.items.find(i => i.id === item1.id);
    respItem.content = item1.content;

    // send command
    await api.commit();

    // check commands sent
    const itemUpdate = api.session.popRequest();
    checkCommandsSent(itemUpdate, [
      {
        type: 'item_update',
        uuid: expectUuid,
        args: {
          id: item1.id,
          content,
        },
      },
    ]);

    // check local cache and object state
    expect(api.state.items.some(i => i.content === content)).toBe(true);
    expect(item1.content).toEqual(content);
    expect(await api.items.get_by_id(item1.id, true)).toEqual(item1);
  });

  test('should update its date info', async () => {
    const item2 = api.state.items.find(i => i.content === `${itemBaseName}2`);

    // complete the recurring daily task, give new due date of today
    const today = new Date(new Date().getTime());
    const todayStr = getDateString(today);
    item2.update_date_complete({ date: todayStr, string: 'every day' });
    await api.commit();

    // check commands sent
    let itemUpdateDateComplete = api.session.popRequest();
    checkCommandsSent(itemUpdateDateComplete, [
      {
        type: 'item_update_date_complete',
        uuid: expectUuid,
        args: {
          id: item2.id,
          due: {
            date: todayStr,
            string: 'every day',
          },
        },
      },
    ]);

    // check local cache and object state
    expect(api.state.items.find(i => i.id === item2.id).due.date).toEqual(todayStr);
    expect(item2.due.date).toEqual(todayStr);

    // complete the recurring daily task with no explicit new due date
    item2.update_date_complete();
    await api.commit();

    // check commands sent
    itemUpdateDateComplete = api.session.popRequest();
    checkCommandsSent(itemUpdateDateComplete, [
      {
        type: 'item_update_date_complete',
        uuid: expectUuid,
        args: {
          id: item2.id,
          due: null,
        },
      },
    ]);

    // check local cache and object state
    expect(api.state.items.find(i => i.id === item2.id).due).toEqual(null);
    expect(item2.due).toEqual(null);
  });

  test('should complete and uncomplete itself', async () => {
    // queue update command
    item1.complete();

    // prepare pseudo response
    const response = api.session.syncResponse;
    const respItem = response.items.find(i => i.id === item1.id);
    respItem.checked = 1;

    // send command
    await api.commit();

    // check commands sent
    const itemComplete = api.session.popRequest();
    checkCommandsSent(itemComplete, [
      {
        type: 'item_complete',
        uuid: expectUuid,
        args: {
          id: item1.id,
        },
      },
    ]);

    // check local cache and object state
    expect(api.state.items.find(i => i.id === item1.id).checked).toBeTruthy();

    // toggle it back
    item1.uncomplete();
    respItem.checked = 0;
    await api.commit();

    // check commands sent
    const itemUncomplete = api.session.popRequest();
    checkCommandsSent(itemUncomplete, [
      {
        type: 'item_uncomplete',
        uuid: expectUuid,
        args: {
          id: item1.id,
        },
      },
    ]);

    // check local cache and object state
    expect(api.state.items.find(i => i.id === item1.id).checked).toBeFalsy();
  });

  test('should move itself into a project', async () => {
    const cases = [
      {
        dest_id: 123,
        dest_type: 'project_id',
      },
      {
        dest_id: 345,
        dest_type: 'parent_id',
      },
      {
        dest_id: 567,
        dest_type: 'section_id',
      },
    ];

    for (const c of cases) {
      const dest = {};
      dest[c.dest_type] = c.dest_id;

      // queue command
      item1.move(dest);

      // prepare pseudo response
      const response = api.session.syncResponse;
      // eslint-disable-next-line no-loop-func
      const respItem = response.items.find(i => i.id === item1.id);
      respItem[c.dest_type] = c.dest_id;

      // send command
      await api.commit();

      const args = {
        id: item1.id,
      };

      // check commands sent
      let itemMove = api.session.popRequest();
      checkCommandsSent(itemMove, [
        {
          type: 'item_move',
          uuid: expectUuid,
          args: { ...args, ...dest },
        },
      ]);

      // check local cache and object state
      // eslint-disable-next-line no-loop-func
      expect(api.state.items.find(i => i.id === item1.id)[c.dest_type]).toBe(c.dest_id);
    }

    // check for invalid destination
    expect(() => item1.move({ invalid: 666 })).toThrow(/invalid/);
  });

  test('should delete itself', async () => {
    // queue delete command
    item1.delete();

    // prepare pseudo response
    const response = api.session.syncResponse;
    const respItem = response.items.find(i => i.id === item1.id);
    respItem.is_deleted = 1;

    // send command
    await api.commit();

    // check commands sent
    const itemDelete = api.session.popRequest();
    checkCommandsSent(itemDelete, [
      {
        type: 'item_delete',
        uuid: expectUuid,
        args: {
          id: item1.id,
        },
      },
    ]);

    // check local cache and object state
    expect(item1.is_deleted).toBe(1);
    expect(api.state.items.some(i => i.id === item1.id)).toBe(false);
  });

  test('should close itself', async () => {
    // queue close item command
    item1.close();

    // prepare pseudo response
    const response = api.session.syncResponse;
    const respItem = response.items.find(i => i.id === item1.id);
    respItem.is_deleted = 1;

    // send command
    await api.commit();

    // check commands sent
    const itemClose = api.session.popRequest();
    checkCommandsSent(itemClose, [
      {
        type: 'item_close',
        uuid: expectUuid,
        args: {
          id: item1.id,
        },
      },
    ]);

    // close is a shortcut for item_complete / item_update_date_complete,
    // should do more complete checking of multiple scenarios (recurring task, tasks with children, etc)
    expect(item1.is_deleted).toBe(1);
    expect(api.state.items.some(i => i.id === item1.id)).toBe(false);
  });
});
