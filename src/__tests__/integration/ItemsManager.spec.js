import API from '../../Api';
import { env, getDateString, getShortDateString } from '../helpers';

const api = new API(env.ACCESS_TOKEN);

describe('Items Manager', () => {
  const itemBaseName = '_TestItemManager';
  const projectBaseName = '_TestItemManagerProject';
  let item1;
  let item2;

  beforeAll(async () => {
    await api.sync();
    const inbox = api.state.projects.find(project => project.name === 'Inbox');
    item1 = api.items.add(`${itemBaseName}1`, inbox.id);
    item2 = api.items.add(`${itemBaseName}2`, inbox.id, { due: { date: '2014-10-20', string: 'every day' } });
  });

  afterAll(async () => {
    item1.delete();
    item2.delete();
    await api.commit();
  });

  test('should add an item', async () => {
    const response = await api.commit();
    expect(response.items.some(i => i.content === `${itemBaseName}1`)).toBe(true);
    expect(api.state.items.some(i => i.content === `${itemBaseName}1`)).toBe(true);
    expect(await api.items.get_by_id(item1.id)).toEqual(item1);
  });

  test('should update items day orders', async () => {
    api.items.update_day_orders({ [item1.id]: 1, [item2.id]: 2 });
    const response = await api.commit();
    response.items.forEach((item) => {
      if (item.id === item1.id) {
        expect(item1.day_order).toBe(1);
      }
      if (item.id === item2.id) {
        expect(item2.day_order).toBe(2);
      }
    });

    expect(api.state.day_orders[item1.id]).toBe(1);
    expect(api.state.day_orders[item2.id]).toBe(2);
  });

  test('should complete and uncomplete an item', async () => {
    api.items.complete([item2.id]);
    let response = await api.commit();

    // as of V8, items we check as complete are not returned
    expect(response.items.some(i => i.id === item2.id)).toBe(false);
    expect(api.state.items.find(i => i.id === item2.id).checked).toBeTruthy();

    api.items.uncomplete([item2.id]);
    response = await api.commit();
    expect(response.items.some(i => i.id === item2.id)).toBe(true);
    expect(response.items.find(i => i.id === item2.id).checked).toBeFalsy();
    expect(api.state.items.find(i => i.id === item2.id).checked).toBeFalsy();
  });

  test('should update an item', async () => {
    api.items.update(item2.id, { content: `${itemBaseName}Updated2` });
    const response = await api.commit();
    expect(response.items.some(i => i.content === `${itemBaseName}Updated2`)).toBe(true);
    expect(api.state.items.some(i => i.content === `${itemBaseName}Updated2`)).toBe(true);
  });

  test('should move an item into a project', async () => {
    const project1 = api.projects.add(`${projectBaseName}1`);
    await api.commit();

    api.items.move([item2.id], { project_id: project1.id });
    const response = await api.commit();
    expect(response.items.some(i => i.id === item2.id)).toBe(true);
    expect(response.items.find(i => i.id === item2.id).project_id).toBe(project1.id);
    expect(api.state.items.find(i => i.id === item2.id).project_id).toBe(project1.id);

    project1.delete();
    await api.commit();
  });

  test('should update its date info', async () => {
    // complete the recurring daily task, give new due date of today
    const today = new Date(new Date().getTime());
    const todayStr = getShortDateString(today);
    api.items.update_date_complete(item2.id, { date: todayStr, string: 'every day' });

    // single commit to minimize traffic (quota)
    let response = await api.commit();

    // check new due date of today
    expect(response.items.find(i => i.id === item2.id).due.date).toEqual(todayStr);
    expect(api.state.items.find(i => i.id === item2.id).due.date).toEqual(todayStr);
    expect(item2.due.date).toEqual(todayStr);

    // complete the recurring daily task with no explicit new due date
    api.items.update_date_complete(item2.id);

    // single commit to minimize traffic (quota)
    response = await api.commit();

    // check that completed task rescheduled another for tomorrow
    const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = getShortDateString(tomorrow);
    expect(response.items.find(i => i.id === item2.id).due.date).toEqual(tomorrowStr);
    expect(api.state.items.find(i => i.id === item2.id).due.date).toEqual(tomorrowStr);
    expect(item2.due.date).toEqual(tomorrowStr);
  });


  test('should delete an item', async () => {
    const content = item2.content;
    api.items.delete([item2.id]);
    const response = await api.commit();

    expect(response.items.some(i => i.id === item2.id)).toBe(false);
    expect(item2.is_deleted).toBe(1);
    expect(api.state.items.some(i => i.content === content)).toBe(false);
  });
});

