import Model from './Model';
import Api from '../Api'; // eslint-disable-line no-unused-vars

/**
 * Implements a User.
 */
// noinspection JSUnusedGlobalSymbols
class User extends Model {
  public auto_reminder?: number;
  public avatar_big: string;
  public avatar_medium: string;
  public avatar_s640: string;
  public avatar_small: string;
  public business_account_id: number;
  public daily_goal: number;
  public date_format: number;
  public dateist_inline_disabled: boolean;
  public dateist_lang: string;
  public days_off: number;
  public default_reminder: string;
  public email: string;
  public features: {
    beta: number;
    dateist_inline_disabled: boolean;
    dateist_lang: string;
    gold_theme: boolean;
    has_push_reminders: boolean;
    karma_disabled: boolean;
    karma_vacation: boolean;
    restriction: number;
  };
  public full_name: string;
  public id: number;
  public image_id: string;
  public inbox_project: number;
  public is_biz_admin: boolean;
  public is_premium: boolean;
  public join_date: string;
  public karma: number;
  public karma_trend: string;
  public lang: string;
  public legacy_inbox_project: number;
  public legacy_team_inbox: number;
  public mobile_host: string;
  public mobile_number: string;
  public next_week: number;
  public premium_until: string;
  public share_limit: number;
  public sort_order: number;
  public start_day: number;
  public start_page: string;
  public team_inbox: number;
  public theme: number;
  public time_format: number;
  public token: string;
  public tz_info: {
    gmt_string: string;
    hours: number;
    is_dst: number;
    minutes: number;
    timezone: string;
  };

  constructor(data: Partial<User> = {}, api: Api) {
    super(api);
    Object.assign(this, data);
  }
}

export default User;
