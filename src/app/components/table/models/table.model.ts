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
  id: number;
}
