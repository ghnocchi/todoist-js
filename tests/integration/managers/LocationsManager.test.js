import Api from '../../../src/Api';
import { env } from '../../helpers';

const api = new Api(env.ACCESS_TOKEN);

test('Manager should clear locations', async () => {
  await api.sync();
  api.locations.clear();
  await api.commit();

  expect(api.state.locations).toEqual([]);
});
