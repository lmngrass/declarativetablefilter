export interface TableItem {
  id: number;
  name: string;
  age: number;
  checked?: boolean;
}
export interface TableData {
  data: TableItem[];
  message?: string;
  state: 'loading' | 'success' | 'failure';
}

export interface SortTableaction {
  columnKey: keyof TableItem;
  direction: 'ASC' | 'DESC';
  sortType: 'string' | 'number';
}

export interface CheckAction {
  state: boolean;
  /** id of the element
   * -1 refers to non existent value
   */
  id: number;
  /** whether the action is for select all checkbox */
  isForselectAll: boolean;
}
