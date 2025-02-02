import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  map,
  merge,
  Observable,
  of,
  shareReplay,
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
export class TableComponent {
  /** stores ids of checked items */
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

  /** intial sort configuration  */
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

  /** filter action */
  filter$ = this.filterForm.valueChanges.pipe(startWith({}));

  /**
   * intial action state for row
   * which reset everytime filter and sort is applied
   */
  initialRowCheckState: CheckAction = {
    isIntialState: true,
    id: -1,
    isForselectAll: true,
    state: false,
  };

  /** toggle row  */
  private readonly toggleRowCheck = new Subject<CheckAction>();

  /** exposed toogle row action */
  toggleRow$ = this.toggleRowCheck.asObservable();
  /**
   * toggle Row checkbox event for table data stream
   * @param event change event
   * @param id id of element beind changed it is -1 for select all operation rest it will id from data
   * @param isForSelectAll whether select all check is checked or not
   */
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
  /**
   * Observable for only filtered and sroted data
   */
  filteredAndSortedData$: Observable<TableData>;

  /**
   * table data after performing sort ,filter, checked operations
   */
  finalTableData$: Observable<TableData>;
  /**
   * state for select all checkbox after all the oeprations
   */
  selectAllCheckBoxState$: Observable<boolean>;

  constructor(private getTableService: GetTableDataService) {
    /** fitlered and sorted stream */
    this.filteredAndSortedData$ = combineLatest([
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
      tap((value) => console.log(value)),
      shareReplay(1),
    );

    /** reset action which will emit as soon as table data is changed */
    const resetAction$: Observable<CheckAction> =
      this.filteredAndSortedData$.pipe(map(() => this.initialRowCheckState));
    /** mergign so either of them emits */
    const mergedAction = merge(this.toggleRow$, resetAction$);

    this.finalTableData$ = combineLatest([
      mergedAction.pipe(
        tap((value) => console.log(`merged with ${JSON.stringify(value)} `)),
      ),
      this.filteredAndSortedData$,
    ]).pipe(
      map(([checkAction, tableData]) => {
        if (checkAction.isIntialState) {
          // that means filter was reset or we are at initial state
          console.log('initial state');
          // since we got here after clearing filter or doing something
          // or sort thus we can handle checked method here such that if the set has the data we will
          // set marked as checked for that here if not we mark false
          const updatedData = tableData.data.map((item) => ({
            ...item,
            checked: this.checkedItems.has(item.id),
          }));
          return {
            ...tableData,
            data: updatedData,
          };
        } else {
          console.log('existing handling');
          //here we appropariately handle which stores currently selected ids in ui for both select all and invidual state
          if (checkAction.id == -1 && !checkAction.isForselectAll) {
            console.log([tableData]);
            return { ...tableData };
          } else {
            let updatedDataTableData: TableItem[];
            if (checkAction.isForselectAll) {
              // handle select all operation here
              console.log('todo select all operation');
              // for select all we have to consider two scenarios
              updatedDataTableData = this.handleRowStateForAllRows(
                tableData.data,
                checkAction,
              );
            } else {
              updatedDataTableData = this.handleRowStateForIndividualRow(
                tableData.data,
                checkAction,
              );
            }
            return {
              ...tableData,
              data: updatedDataTableData,
            };
          }
        }
      }),
      shareReplay(1),
    );
    // select all checkbox  stream
    this.selectAllCheckBoxState$ = this.finalTableData$.pipe(
      map((tableData) => {
        return tableData.data.every((tableItem) => tableItem.checked);
      }),
    );
    // view model for ui
    this.viewModel$ = combineLatest({
      tableData: this.finalTableData$,
      selectAllCheckBoxState: this.selectAllCheckBoxState$,
    });
  }

  /** handle sorting based on configuration
   * @param sortConfig  configuration
   */
  sortBy(sortConfig: SortTableaction) {
    const isAscending = sortConfig.direction === 'ASC';
    if (sortConfig.sortType === 'string') {
      return sortArrayString(sortConfig.columnKey, isAscending);
    } else {
      return sortNumArray(sortConfig.columnKey, isAscending);
    }
  }

  handleRowStateForAllRows(
    tableData: TableItem[],
    checkRowAction: CheckAction,
  ) {
    const updateData = tableData.map((item) => {
      this.handleSetState(checkRowAction, item.id);
      return { ...item, checked: checkRowAction.state };
    });
    return [...updateData];
  }
  /**
   * Handle check row state and returns modified array
   * @param tableData tableData
   * @param toggleRow row configuration
   * @returns modified tableData after checking that particular id
   */
  handleRowStateForIndividualRow(
    tableData: TableItem[],
    checkRowAction: CheckAction,
  ) {
    return [...tableData].map((item) => {
      if (item.id === checkRowAction.id) {
        this.handleSetState(checkRowAction, item.id);
        return { ...item, checked: checkRowAction.state } as TableItem;
      }
      return {
        ...item,
        checked: this.checkedItems.has(item.id),
      } as TableItem;
    });
  }
  /**
   * Handles state of set which stores currrent checked id
   * @param toggleRow check row configuration
   * @param id id to be checked
   */
  handleSetState(checkRowAction: CheckAction, id: number) {
    if (checkRowAction.state) {
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
}
