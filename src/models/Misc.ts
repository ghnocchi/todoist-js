import Model from './Model';
import MiscManager from '../managers/MiscManager'; // eslint-disable-line no-unused-vars
import { DateTimeRFC3339 } from '../types'; // eslint-disable-line no-unused-vars


/**
 * Implements an Item.
 */
class Misc extends Model {
  public day_orders?: { TodoistId: number };
  public day_orders_timestamp?: DateTimeRFC3339;
  public settings_notifications?: any;

  constructor(data: Partial<Misc> = {}, manager: MiscManager) {
    super(manager);

    const defaultValue = {
      day_orders: {},
      day_orders_timestamp: '',
      settings_notifications: {},
    };

    Object.assign(this, { ...defaultValue, ...data });
  }

  get mgr(): MiscManager {
    return <MiscManager>this.manager;
  }
}

export default Misc;
