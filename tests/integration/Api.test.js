import API from '../../src/Api';
import { env } from '../helpers';

const api = new API(env.ACCESS_TOKEN);

describe('Api tests', () => {
  test('Should get api url', () => {
    const resource = 'test';
    expect(api.get_api_url(resource)).toBe(`${api.api_endpoint}/API/v8/${resource}`);
  });

  test('Should make a valid request (getting productivity stats)', async () => {
    const response = await api.session.request(api.get_api_url('completed/get_stats'), 'POST');
    // noinspection JSUnresolvedVariable
    expect(response.karma_trend).toBeDefined();
  });

  test('Should sync', async () => {
    const response = await api.sync();
    expect(response.sync_token).toBeDefined();
  });

  test('Should update user profile. (test_user)', async () => {
    await api.sync();
    const date_format = api.state.user.date_format;
    const date_format_new = 1 - date_format;
    api.user.update({ date_format: date_format_new });
    await api.commit();
    expect(date_format_new).toBe(api.state.user.date_format);
    api.user.update_goals({ vacation_mode: 1 });
    await api.commit();
    api.user.update_goals({ vacation_mode: 0 });
    await api.commit();
  });

  describe('Items', () => {
    beforeAll(async () => {
      await api.sync();
    });

    const itemBaseName = '_TestItemApi';

    test('API should add an item', async () => {
      let item1;

      try {
        const response = await api.add_item(`${itemBaseName}1`);
        expect(response.content).toBe(`${itemBaseName}1`);

        await api.sync();
        expect(api.state.items.some(i => i.content === `${itemBaseName}1`)).toBe(true);
        item1 = api.state.items.find(i => i.content === `${itemBaseName}1`);
        expect(await api.items.get_by_id(item1.id)).toEqual(item1);
      } finally {
        item1.delete();
        await api.commit();
      }
    });
  });
});
