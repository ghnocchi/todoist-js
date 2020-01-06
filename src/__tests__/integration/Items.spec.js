import API from '../../Api';
import { env, getDateString, getShortDateString } from '../helpers';

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
    let item2;

    try {
      // add item (in the past) and specify as recurring daily
      const date = new Date(2018, 1, 19, 3, 14, 0);
      const dateString = getDateString(date);
      item2 = api.items.add(`${itemBaseName}2`, inbox.id, { due: { date: dateString, string: 'every day' } });

      // complete the recurring daily task, give new due date of today
      const today = new Date(new Date().getTime());
      const todayStr = getShortDateString(today);
      item2.update_date_complete({ date: todayStr, string: 'every day' });

      // single commit to minimize traffic (quota)
      let response = await api.commit();

      // check new due date of today
      expect(response.items.find(i => i.id === item2.id).due.date).toEqual(todayStr);
      expect(api.state.items.find(i => i.id === item2.id).due.date).toEqual(todayStr);
      expect(item2.due.date).toEqual(todayStr);

      // complete the recurring daily task with no explicit new due date
      item2.update_date_complete();

      // single commit to minimize traffic (quota)
      response = await api.commit();

      // check that completed task rescheduled another for tomorrow
      const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
      const tomorrowStr = getShortDateString(tomorrow);
      expect(response.items.find(i => i.id === item2.id).due.date).toEqual(tomorrowStr);
      expect(api.state.items.find(i => i.id === item2.id).due.date).toEqual(tomorrowStr);
      expect(item2.due.date).toEqual(tomorrowStr);
    } finally {
      if (item2) {
        item2.delete();
        await api.commit();
      }
    }
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
