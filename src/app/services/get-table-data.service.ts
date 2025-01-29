import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TableData, TableItem } from '../components/table/models/table.model';
import {
  catchError,
  count,
  delay,
  map,
  Observable,
  of,
  shareReplay,
  startWith,
  switchMap,
  throwError,
} from 'rxjs';

@Injectable()
export class GetTableDataService {
  constructor(private http: HttpClient) {}

  /** exposed variable for geting table data */
  tableData$ = this.getTableData().pipe(
    startWith({
      data: [],
      message: 'Loading...',
      state: 'loading',
    } as TableData),
  );

  /**
   * Generates request observable with error handling and mapped tableItem
   * @returns observable for getting table data from backend
   */
  private getTableData(): Observable<TableData> {
    console.log('fetching data');
    return of<TableItem[]>(mockData).pipe(
      delay(2000),

      map((items: TableItem[]) => {
        return {
          data: items,
          state: 'success',
        } as TableData;
      }),

      catchError((err) =>
        of({
          message: 'error while getting data',
          data: [],
          state: 'failure',
        } as TableData),
      ),
    );
  }
}

const mockData = [
  {
    id: 1,
    name: 'karlach',
    age: 30,
  },
  {
    id: 2,
    name: 'astarion',
    age: 200,
  },
  {
    id: 3,
    name: 'gale',
    age: 27,
  },
];
