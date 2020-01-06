import API from '../../Api';
import { env } from '../helpers';

const api = new API(env.ACCESS_TOKEN);

test('Manager should clear locations', async () => {
  await api.sync();
  api.locations.clear();
  await api.commit();

  expect(api.state.locations).toEqual([]);
});
