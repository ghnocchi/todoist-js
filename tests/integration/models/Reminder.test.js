// XXX fails

import Api from '../../../src/Api';
import { env, getDateString, getLongDateString } from '../../helpers';

const api = new Api(env.ACCESS_TOKEN);

let reminder1;
let reminder2;
let item1;

afterAll(async () => {
  item1.delete();
  await api.commit();
});

test('Manager should add a reminder (relative)', async () => {
  await api.sync();
  const inbox = api.state.projects.find(p => p.name === 'Inbox');
  item1 = api.items.add('Item1_reminder', inbox.id, { date_string: 'tomorrow' });
  await api.commit();

  // relative
  reminder1 = api.reminders.add(item1.id, { minute_offset: 30 });
  const response = await api.commit();

  expect(response.reminders.find(r => r.id === reminder1.id).minute_offset).toBe(30);
  expect(api.state.reminders.some(r => r.id === reminder1.id)).toBe(true);
  expect(await api.reminders.get_by_id(reminder1.id)).toEqual(reminder1);
});

test('Reminder should update itself', async () => {
  reminder1.update({ minute_offset: 15 });
  const response = await api.commit();

  expect(response.reminders.find(r => r.id === reminder1.id).minute_offset).toBe(15);
  expect(api.state.reminders.find(r => r.id === reminder1.id).minute_offset).toBe(15);
});

test('Reminder should delete itself', async () => {
  reminder1.delete();
  const response = await api.commit();

  expect(response.reminders.some(r => r.id === reminder1.id)).toBe(false);
  expect(reminder1.is_deleted).toBe(1);
  expect(api.state.reminders.some(r => r.id === reminder1.id)).toBe(false);
});

test('Manager should add a reminder (absolute)', async () => {
  // absolute
  let tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
  const due_date_utc = getDateString(tomorrow);
  const due_date_utc_long = getLongDateString(tomorrow);
  reminder2 = api.reminders.add(item1.id, { due_date_utc });
  const response = await api.commit();

  expect(response.reminders.find(r => r.id === reminder2.id).due_date_utc).toBe(due_date_utc_long);
  expect(api.state.reminders.find(r => r.id === reminder2.id).due_date_utc).toBe(due_date_utc_long);
});

test('Manager should remove a reminder', async () => {
  api.reminders.delete(reminder2.id);
  const response = await api.commit();

  expect(response.reminders.some(r => r.id === reminder2.id)).toBe(false);
  expect(reminder2.is_deleted).toBe(1);
  expect(api.state.reminders.some(r => r.id === reminder2.id)).toBe(false);
});
