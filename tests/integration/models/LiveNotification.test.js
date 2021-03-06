import Api from '../../../src/api/Api';
import { env } from '../../helpers';

const api = new Api(env.ACCESS_TOKEN);

test('Manager should set last notification', async () => {
  await api.sync();
  api.live_notifications.set_last_read(api.state.live_notifications_last_read_id);
  const response = await api.commit();

  expect(response.live_notifications_last_read_id).toBe(api.state.live_notifications_last_read_id);
});
