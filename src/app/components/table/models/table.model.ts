export interface TableItem {
  id: number;
  name: string;
  age: number;
}
export interface TableData {
  data: TableItem[];
  message?: string;
  state: 'loading' | 'success' | 'failure';
}
