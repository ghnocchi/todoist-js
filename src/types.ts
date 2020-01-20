/**
 * general, reused types
 */

export type TodoistId = number;
export type UUID = string; // someday, perhaps regexp type validation will be supported
export type ObjectId = TodoistId | UUID;

export type DateRFC3339 = string;
export type DateTimeRFC3339 = string;

export type NumericBoolean = 0 | 1;

export interface IDueDate {
  date?: string;
  timezone?: string,
  string?: string,
  lang?: string,
  is_recurring?: boolean,
}
