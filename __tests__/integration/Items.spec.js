import API from '../../todoist/Api';
import { env, getDateString } from '../helpers';

const api = new API(env.ACCESS_TOKEN);

const itemBaseName = '_TestItem';
const projectBaseName = '_TestItemProject';

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

describe('Items model', () => {
  test('should complete itself', async () => {
    item1.complete();
    const response = await api.commit();
    expect(api.state.items.find(i => i.id === item1.id).checked).toBeTruthy();
    expect(response.items.some(i => i.id === item1.id)).toBe(false);
  });

  test('should uncomplete itself', async () => {
    item1.uncomplete();
    const response = await api.commit();
    expect(response.items.some(i => i.content === `${itemBaseName}1`)).toBe(true);
    expect(response.items.find(i => i.content === `${itemBaseName}1`).checked).toBeFalsy();
    expect(api.state.items.find(i => i.id === item1.id).checked).toBeFalsy();
  });

  test('should update its content', async () => {
    item1.update({ content: `${itemBaseName}Updated1` });
    await api.commit();
    expect(api.state.items.some(i => i.content === `${itemBaseName}Updated1`)).toBe(true);
    expect(await api.items.get_by_id(item1.id)).toEqual(item1);
  });

  test('should update its date info', async () => {
    const date = new Date(2038, 1, 19, 3, 14, 7);
    const date_string = getDateString(date);

    const item2 = api.items.add(`${itemBaseName}2`, inbox.id, { date_string });

    const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    const new_date_utc = getDateString(tomorrow);
    api.items.update_date_complete(item1.id, new_date_utc, 'every day', 0);
    let response = await api.commit();
    // Note: in Python's test date_string is expected to be 'every day' but we're receiving the date in string format YYYY-MM-DDTHH:MM:SS
    expect(response.items.find(i => i.id === item2.id).due.string).toBe(date_string);
    expect(api.state.items.find(i => i.id === item2.id).due.string).toBe(date_string);
  });

  test('should complete and uncomplete itself', async () => {
    item1.complete();
    let response = await api.commit();

    // as of V8, items we check as complete are not returned
    expect(response.items.some(i => i.id === item1.id)).toBe(false);
    expect(api.state.items.find(i => i.id === item1.id).checked).toBeTruthy();

    item1.uncomplete();
    response = await api.commit();
    expect(response.items.some(i => i.id === item1.id)).toBe(true);
    expect(response.items.find(i => i.id === item1.id).checked).toBeFalsy();
    expect(api.state.items.find(i => i.id === item1.id).checked).toBeFalsy();
  });

  test('should move itself into a project', async () => {
    let project1;
    try {
      project1 = api.projects.add(`${projectBaseName}1`);
      await api.commit();

      item1.move({ project_id: project1.id });
      const response = await api.commit();
      expect(response.items.some(i => i.id === item1.id)).toBe(true);
      expect(response.items.find(i => i.id === item1.id).project_id).toBe(project1.id);
      expect(api.state.items.find(i => i.id === item1.id).project_id).toBe(project1.id);
    } finally {
      project1.delete();
      await api.commit();
    }
  });

  test('should delete itself', async () => {
    item1.delete();
    const response = await api.commit();
    expect(response.items.some(i => i.id === item1.id)).toBe(false);
    expect(item1.is_deleted).toBe(1);
    expect(api.state.items.some(i => i.id === item1.id)).toBe(false);
  });
});
