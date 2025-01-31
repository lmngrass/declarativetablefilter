import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  map,
  Observable,
  startWith,
  Subject,
  switchMap,
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
  private loadTable = new Subject<void>();

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
  sort$: Observable<SortTableaction> = this.sortChanged
    .asObservable()
    .pipe(startWith(this.initialSort));

  /**
   * Form group for filter inputs.
   */
  filterForm: FormGroup = new FormGroup({
    name: new FormControl(),
    age: new FormControl(),
  });

  filter$ = this.filterForm.valueChanges.pipe(startWith({}));
  /**
   * Observable for the view model used in the template.
   */
  readonly viewModel$: Observable<{
    tableData: TableData;
  }>;

  /**
   * Observable that emits table data on load action.
   */
  tableData$: Observable<TableData> = this.loadTableAction$.pipe(
    switchMap(() => this.getTableService.tableData$),
  );

  /**
   * Constructor for TableComponent.
   * @param getTableService Service to get table data.
   */
  constructor(private getTableService: GetTableDataService) {
    this.tableData$ = combineLatest([
      this.filter$,
      this.sort$,
      this.tableData$,
    ]).pipe(
      map(([filters, sortConfig, tableData]) => {
        const newData = [...tableData.data]
          .filter((tableItem) => filterForTableItem(filters, tableItem))
          .sort(
            this.sortBy(sortConfig) as (a: TableItem, b: TableItem) => number,
          );
        return {
          ...tableData,
          data: newData,
        };
      }),
    );
    this.viewModel$ = combineLatest({
      tableData: this.tableData$,
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
