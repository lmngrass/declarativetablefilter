import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  combineLatest,
  concatAll,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  every,
  filter,
  from,
  map,
  merge,
  mergeAll,
  Observable,
  skipWhile,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { GetTableDataService } from '../../services/get-table-data.service';
import { AsyncPipe, JsonPipe } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  CheckAction,
  SortTableaction,
  TableData,
  TableItem,
} from './models/table.model';
import { sortArray, sortNumArray } from '../../shared/sortingfunctions';
import {
  filterAndMap,
  ifValueIsUndefinedOrNullReturnEmptyString,
} from '../../shared/utils';

/**
 * TableComponent is responsible for displaying and managing a table with sorting and filtering capabilities.
 * It uses reactive forms to handle filter inputs and observables to manage data streams.
 */
@Component({
  selector: 'app-table',
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule],
  providers: [GetTableDataService],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent implements OnInit {
  private checkedItems = new Set<number>();
  /**
   * Observable that emits sorted and filtered table data.
   */
  sortedAndFilteredTableData$: Observable<TableData>;

  /**
   * Subject to trigger table data load.
   */
  private loadTable = new Subject<void>();

  /**
   * Observable for load table action.
   */
  loadTableAction$ = this.loadTable.asObservable();

  /**
   * Subject to trigger table sorting.
   */
  private sortTable = new Subject<SortTableaction>();

  /**
   * Observable for sort table action.
   */
  sortTableaction: Observable<SortTableaction> = this.sortTable.asObservable();

  /** subject to mark row as checked */
  private checkRow = new Subject<CheckAction>();

  checkRowAction: Observable<CheckAction> = this.checkRow.asObservable().pipe(
    tap(() => {
      console.log('check row called');
    }),
  );

  checkedSortedFiltered$: Observable<TableData>;

  selectAllCheckBoxState$: Observable<boolean>;
  toggleCheckRow(id: number, target: EventTarget) {
    console.log('toggle row called');
    const checkedState = (<HTMLInputElement>target).checked;
    this.checkRow.next({ id: id, state: checkedState });
  }
  /**
   * Form group for filter inputs.
   */
  filterForm: FormGroup = new FormGroup({
    name: new FormControl(),
    age: new FormControl(),
  });

  /**
   * Observable for the view model used in the template.
   */
  viewModel$!: Observable<{
    filteredAndSortedData: TableData;
    selectAllCheckBoxState: boolean;
  }>;

  /**
   * Observable that emits table data on load action.
   */
  tableData$: Observable<TableData> = this.loadTableAction$.pipe(
    switchMap(() => this.getTableService.tableData$),
  );

  /**
   * Observable that emits filtered table data.
   */
  filteredTableData$: Observable<TableData> = combineLatest({
    formData: this.filterForm.valueChanges.pipe(
      startWith({}),
      debounceTime(200),
    ),
    tableData: this.tableData$,
  }).pipe(
    map((value: { formData: any; tableData: TableData }) => {
      if (
        value.tableData.state === 'failure' ||
        value.tableData.state === 'loading'
      ) {
        return value.tableData;
      }
      return filterAndMap(value);
    }),
  );

  /**
   * Constructor for TableComponent.
   * @param getTableService Service to get table data.
   */
  constructor(private getTableService: GetTableDataService) {
    this.sortedAndFilteredTableData$ = combineLatest({
      sortAction: this.sortTableaction.pipe(
        startWith({
          columnKey: 'name',
          sortType: 'string',
          direction: 'ASC',
        } as SortTableaction),
      ),
      filteredData: this.filteredTableData$,
    }).pipe(
      map(({ sortAction, filteredData }) => {
        return this.sortTableData(sortAction, filteredData);
      }),
    );

    this.checkedSortedFiltered$ = combineLatest({
      checkRowAction: this.checkRowAction.pipe(
        startWith({ id: null, state: false }),
      ),
      filteredAndSortedData: this.sortedAndFilteredTableData$,
    }).pipe(
      map(({ checkRowAction, filteredAndSortedData }) => {
        if (!checkRowAction.id) {
          return filteredAndSortedData;
        } else {
          if (checkRowAction.state) {
            this.checkedItems.add(checkRowAction.id);
          } else {
            this.checkedItems.delete(checkRowAction.id);
          }
        }
        const newData = filteredAndSortedData.data.map((item) => {
          const isChecked = this.checkedItems.has(item.id);
          return { ...item, checked: isChecked };
        });
        return { ...filteredAndSortedData, data: newData };
      }),
      tap((value) => {
        console.log('checked ', value);
      }),
    );
    this.selectAllCheckBoxState$ = combineLatest([
      this.checkedSortedFiltered$,
    ]).pipe(
      map(([fscData]) => {
        // Check if all items are checked
        const state = fscData.data.every((tableItem) => tableItem.checked);
        return fscData.data.length > 0 ? state : false;
      }),
    );
    this.viewModel$ = combineLatest({
      filteredAndSortedData: this.checkedSortedFiltered$,
      selectAllCheckBoxState: this.selectAllCheckBoxState$,
    });
  }

  /**
   * Sorts the table data based on the provided sort action.
   * @param sortAction The action containing sorting details.
   * @param filteredData The data to be sorted.
   * @returns The sorted table data.
   */
  sortTableData(
    sortAction: SortTableaction,
    filteredData: TableData,
  ): TableData {
    const propertyName = sortAction.columnKey;
    const order = sortAction.direction;
    const sortFunction =
      sortAction.sortType === 'string' ? sortArray : sortNumArray;
    const sortedData = sortFunction(
      filteredData.data,
      propertyName,
      order === 'ASC',
    );

    // Return a new object with the sorted data
    return {
      ...filteredData,
      data: sortedData,
    };
  }

  /**
   * Event handler for sort table action.
   * @param sortAction The action containing sorting details.
   */
  sortTableEvent(sortAction: SortTableaction) {
    this.sortTable.next(sortAction);
  }

  /**
   * Event handler for load table action.
   * @param $event The event object.
   */
  loadTableEvent($event: Event) {
    console.log('event called');
    this.loadTable.next();
  }

  /**
   * Lifecycle hook that is called after data-bound properties of a directive are initialized.
   */
  ngOnInit(): void {}
}
