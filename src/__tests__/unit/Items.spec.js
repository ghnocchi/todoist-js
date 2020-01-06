import API from '../../Api';
import { env, matcher, getDateString } from '../helpers';

// mock actual API communication
jest.mock('../../Session');
const expectUuid = expect.stringMatching(matcher.uuid);

const api = new API(env.ACCESS_TOKEN);

const itemBaseName = '_TestItem';

let item1;
let inbox;

beforeAll(async () => {
  await api.sync();
  inbox = api.state.projects.find(project => project.name === 'Inbox');
  item1 = api.items.add(`${itemBaseName}1`, inbox.id);
  await api.commit();
});

afterAll(async () => {
  item1.delete();
  await api.commit();
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
    item1.complete();
    await api.commit();

    // check commands sent
    const itemComplete = api.session.popRequest();
    checkCommandsSent(itemComplete, [
      {
        type: 'item_complete',
        uuid: expectUuid,
        args: {
          id: expectUuid,
        },
      },
    ]);

    // check local cache and object state
    expect(api.state.items.find(i => i.id === item1.id).checked).toBeTruthy();
    expect(item1.checked).toBeTruthy();
  });

  test('should uncomplete itself', async () => {
    item1.uncomplete();
    await api.commit();

    // check commands sent
    const itemUncomplete = api.session.popRequest();
    checkCommandsSent(itemUncomplete, [
      {
        type: 'item_uncomplete',
        uuid: expectUuid,
        args: {
          id: expectUuid,
        },
      },
    ]);

    // check local cache and object state
    expect(api.state.items.find(i => i.id === item1.id).checked).toBeFalsy();
    expect(item1.checked).toBeFalsy();
  });

  test('should update its content', async () => {
    const content = `${itemBaseName}Updated1`;
    item1.update({ content });
    await api.commit();

    // check commands sent
    const itemUpdate = api.session.popRequest();
    checkCommandsSent(itemUpdate, [
      {
        type: 'item_update',
        uuid: expectUuid,
        args: {
          id: expectUuid,
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
    item1.complete();
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
    const dest = 123;
    item1.move({ project_id: dest });
    await api.commit();

    // check commands sent
    const itemMove = api.session.popRequest();
    checkCommandsSent(itemMove, [
      {
        type: 'item_move',
        uuid: expectUuid,
        args: {
          id: item1.id,
          project_id: dest,
        },
      },
    ]);

    // check local cache and object state
    expect(api.state.items.find(i => i.id === item1.id).project_id).toBe(dest);
  });

  test('should delete itself', async () => {
    item1.delete();
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
});
