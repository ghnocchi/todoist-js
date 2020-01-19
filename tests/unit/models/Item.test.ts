import Api from '../../../src/Api';
import Item from '../../../src/models/Item'; // eslint-disable-line no-unused-vars
import { env, matcher, getDateString } from '../../helpers';

// mock actual API communication
jest.mock('../../../src/Session', () => require('../../__mocks__/Session'));
const expectUuid = expect.stringMatching(matcher.uuid);

const api: Api = new Api(env.ACCESS_TOKEN);
const session: any = api.session;

const itemBaseName: string = '_TestItem';

let item1: Item;
let inbox: Item;

beforeEach(async () => {
  // reset cache
  session.reset();
  api.resetState();

  await api.sync();
  inbox = api.state.projects.find(project => project.name === 'Inbox');
  item1 = api.items.add(`${itemBaseName}1`, inbox.id);

  await api.commit();

  // NB: the pseudo-response did not have temp_id_mapping, so update it here
  item1.id = api.state.items.find(i => i.content === item1.content).id;
});

// check that the command JSON sent by the API looks as expected
function checkCommandsSent(request: any, expectedCommands: any) {
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
    const [originalSync, itemAdd] = session.clearRequests();
    checkCommandsSent(originalSync, []);
    checkCommandsSent(itemAdd, [
      {
        type: 'item_add',
        uuid: expectUuid,
        temp_id: expectUuid,
        args: {
          content: item1.content,
          project_id: inbox.id,
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
    const response: any = session.syncResponse;
    const respItem: any = response.items.find((i: Item) => i.id === item1.id);
    respItem.checked = 1;

    // send command
    await api.commit();

    // check commands sent
    const itemComplete = session.popRequest();
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
    const response: any = session.syncResponse;
    const respItem: any = response.items.find((i: Item) => i.id === item1.id);
    respItem.checked = 0;

    // send command
    await api.commit();

    // check commands sent
    const itemUncomplete = session.popRequest();
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
    expect(api.state.items.find((i: Item) => i.id === item1.id).checked).toBeFalsy();
    expect(item1.checked).toBeFalsy();
  });

  test('should update its content', async () => {
    // queue update command
    const content: string = `${itemBaseName}Updated1`;
    item1.update({ content });

    // prepare pseudo response
    const response: any = session.syncResponse;
    const respItem: any = response.items.find((i: Item) => i.id === item1.id);
    respItem.content = item1.content;

    // send command
    await api.commit();

    // check commands sent
    const itemUpdate: any = session.popRequest();
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
    expect(api.state.items.some((i: Item) => i.content === content)).toBe(true);
    expect(item1.content).toEqual(content);
    expect((await api.items.get_by_id(item1.id, true)).content).toEqual(item1.content);
  });

  test('should update its date info', async () => {
    const item2: Item = api.state.items.find((i: Item) => i.content === `${itemBaseName}2`);

    const today: Date = new Date(new Date().getTime());
    const todayStr: string = getDateString(today);

    // queue complete the recurring daily task, give new due date of today
    item2.update_date_complete({ date: todayStr, string: 'every day' });

    // prepare pseudo response
    let response: any = session.syncResponse;
    let respItem: any = response.items.find((i: Item) => i.id === item2.id);
    respItem.due = { date: todayStr };

    // send command
    await api.commit();

    // check commands sent
    let itemUpdateDateComplete = session.popRequest();
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
    expect(api.state.items.find((i: Item) => i.id === item2.id).due.date).toEqual(todayStr);
    expect(item2.due.date).toEqual(todayStr);

    // complete the recurring daily task with no explicit new due date
    item2.update_date_complete();

    // prepare pseudo response
    response = session.syncResponse;
    respItem = response.items.find((i: Item) => i.id === item2.id);
    respItem.due = null;

    // send command
    await api.commit();

    // check commands sent
    itemUpdateDateComplete = session.popRequest();
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
    expect(api.state.items.find((i: Item) => i.id === item2.id).due).toEqual(null);
    expect(item2.due).toEqual(null);
  });

  test('should complete and uncomplete itself', async () => {
    // queue update command
    item1.complete();

    // prepare pseudo response
    const response: any = session.syncResponse;
    const respItem: any = response.items.find((i: Item) => i.id === item1.id);
    respItem.checked = 1;

    // send command
    await api.commit();

    // check commands sent
    const itemComplete = session.popRequest();
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
    expect(api.state.items.find((i: Item) => i.id === item1.id).checked).toBeTruthy();

    // toggle it back
    item1.uncomplete();
    respItem.checked = 0;
    await api.commit();

    // check commands sent
    const itemUncomplete = session.popRequest();
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
    expect(api.state.items.find((i: Item) => i.id === item1.id).checked).toBeFalsy();
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
      const dest: any = {};
      dest[c.dest_type] = c.dest_id;

      // queue command
      item1.move(dest);

      // prepare pseudo response
      const response: any = session.syncResponse;
      // eslint-disable-next-line no-loop-func
      const respItem: any = response.items.find((i: Item) => i.id === item1.id);
      respItem[c.dest_type] = c.dest_id;

      // send command
      await api.commit();

      const args = {
        id: item1.id,
      };

      // check commands sent
      let itemMove: any = session.popRequest();
      checkCommandsSent(itemMove, [
        {
          type: 'item_move',
          uuid: expectUuid,
          args: { ...args, ...dest },
        },
      ]);

      // check local cache and object state
      // eslint-disable-next-line no-loop-func
      expect(api.state.items.find((i: Item) => i.id === item1.id)[c.dest_type]).toBe(c.dest_id);
    }
  });

  test('should delete itself', async () => {
    // queue delete command
    item1.delete();

    // prepare pseudo response
    const response: any = session.syncResponse;
    const respItem: any = response.items.find((i: Item) => i.id === item1.id);
    respItem.is_deleted = 1;

    // send command
    await api.commit();

    // check commands sent
    const itemDelete = session.popRequest();
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
    expect(api.state.items.some((i: Item) => i.id === item1.id)).toBe(false);
  });

  test('should close itself', async () => {
    // queue close item command
    item1.close();

    // prepare pseudo response
    const response: any = session.syncResponse;
    const respItem: any = response.items.find((i: Item) => i.id === item1.id);
    respItem.is_deleted = 1;

    // send command
    await api.commit();

    // check commands sent
    const itemClose = session.popRequest();
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
    expect(api.state.items.some((i: Item) => i.id === item1.id)).toBe(false);
  });
});
