import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  map,
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
import { sortArrayString, sortNumArray } from '../../shared/sortingfunctions';
import { filterForTableItem } from '../../shared/utils';

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
   * Subject to trigger table data load.
   */
  private readonly loadTable = new Subject<void>();

  /**
   * Observable for load table action.
   */
  loadTableAction$ = this.loadTable.asObservable();
  /**
   * Subject to trigger table sorting.
   */
  private readonly sortChanged = new Subject<SortTableaction>();

  initialSort: SortTableaction = {
    columnKey: 'name',
    sortType: 'string',
    direction: 'ASC',
  };
  /**
   * Observable for sort table action.
   */
  sort$ = this.sortChanged.asObservable().pipe(startWith(this.initialSort));

  /**
   * Form group for filter inputs.
   */
  filterForm: FormGroup = new FormGroup({
    name: new FormControl(),
    age: new FormControl(),
  });

  filter$ = this.filterForm.valueChanges.pipe(startWith({}));

  toggleRowCheck = new Subject<CheckAction>();

  toggleRow$ = this.toggleRowCheck.asObservable().pipe(
    startWith({
      state: false,
      id: -1,
      isForselectAll: false,
    } as CheckAction),
  );
  toggleRowCheckBox(event: Event, id: number, isForSelectAll: boolean) {
    const state = (event.target as HTMLInputElement).checked;
    this.toggleRowCheck.next({
      id: id,
      state: state,
      isForselectAll: isForSelectAll,
    });
  }
  /**
   * Observable for the view model used in the template.
   */
  readonly viewModel$: Observable<{
    tableData: TableData;
    selectAllCheckBoxState: boolean;
  }>;

  /**
   * Observable that emits table data on load action.
   */
  tableData$: Observable<TableData> = this.loadTableAction$.pipe(
    switchMap(() => this.getTableService.tableData$),
  );

  selectAllCheckBoxState$: Observable<boolean>;
  // 0 1 2 3 4 1sec
  // 0   1   2  2 sec
  // 0       1  4sec
  /**
   * Constructor for TableComponent.
   * @param getTableService Service to get table data.
   */
  constructor(private getTableService: GetTableDataService) {
    this.tableData$ = combineLatest([
      this.filter$,
      this.sort$,
      this.toggleRow$,
      this.tableData$,
    ]).pipe(
      tap((value) => console.log(value[3])),
      map(([filters, sortConfig, toggleRow, tableData]) => {
        console.log(toggleRow);
        const newData = [...tableData.data]
          .filter((tableItem) => filterForTableItem(filters, tableItem))
          .sort(
            this.sortBy(sortConfig) as (a: TableItem, b: TableItem) => number,
          );
        const checkedData: TableItem[] = this.handleCheckedState(
          newData,
          toggleRow,
        );
        return {
          ...tableData,
          data: checkedData,
        };
      }),
      tap((value) => console.log(value)),
    );
    this.selectAllCheckBoxState$ = combineLatest([this.tableData$]).pipe(
      map(([tableData]) => {
        return tableData.data.every((tableItem) => tableItem.checked);
      }),
    );
    this.viewModel$ = combineLatest({
      tableData: this.tableData$,
      selectAllCheckBoxState: this.selectAllCheckBoxState$,
    });
  }
  sortBy(sortConfig: SortTableaction) {
    const isAscending = sortConfig.direction === 'ASC';
    if (sortConfig.sortType === 'string') {
      return sortArrayString(sortConfig.columnKey, isAscending);
    } else {
      return sortNumArray(sortConfig.columnKey, isAscending);
    }
  }
  handleCheckedState(tableData: TableItem[], toggleRow: CheckAction) {
    if (toggleRow.id === -1 && toggleRow.isForselectAll === false) {
      return [...tableData];
    } else {
      if (toggleRow.isForselectAll) {
        return [...tableData].map((item) => {
          const state = toggleRow.state;
          this.handleSetState(toggleRow, item.id);
          return {
            ...item,
            checked: state,
          };
        });
      } else {
        return this.handleRowStateForIndividualRow(tableData, toggleRow);
      }
    }
  }
  handleRowStateForIndividualRow(
    tableData: TableItem[],
    toggleRow: CheckAction,
  ) {
    return [...tableData].map((item) => {
      if (item.id === toggleRow.id) {
        this.handleSetState(toggleRow, item.id);
        return { ...item, checked: toggleRow.state } as TableItem;
      }
      return {
        ...item,
        checked: this.checkedItems.has(item.id),
      } as TableItem;
    });
  }
  handleSetState(toggleRow: CheckAction, id: number) {
    if (toggleRow.state) {
      this.checkedItems.add(id);
    } else {
      this.checkedItems.delete(id);
    }
  }
  /**
   * Event handler for sort table action.
   * @param sortAction The action containing sorting details.
   */
  sortTableEvent(sortAction: SortTableaction) {
    console.log(sortAction);
    this.sortChanged.next(sortAction);
  }

  /**
   * Event handler for load table action.
   * @param $event The event object.
   */
  loadTableEvent($event: Event) {
    console.log(' load event called');
    this.loadTable.next();
  }

  /**
   * Lifecycle hook that is called after data-bound properties of a directive are initialized.
   */
  ngOnInit(): void {}
}
