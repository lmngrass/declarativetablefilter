import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
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
import { TableData, TableItem } from './models/table.model';

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
  constructor(private getTableService: GetTableDataService) {
    this.viewModel$ = combineLatest({ filteredData: this.filteredTableData$ });
  }

  /** load table action on button click */
  private loadTable = new Subject<void>();
  /** exposed action for button click */
  loadTableAction$ = this.loadTable.asObservable();
  /** temporary form group to test filters */
  filterForm: FormGroup = new FormGroup({
    name: new FormControl(),
    age: new FormControl(),
  });
  /**
   * event Handler for button click
   */
  loadTableEvent($event: Event) {
    console.log('event called');
    this.loadTable.next();
  }
  /**
   * viewmodel for template
   */
  viewModel$!: Observable<{
    filteredData: TableData;
  }>;
  /**
   * Get table data on click
   */
  tableData$: Observable<TableData> = this.loadTableAction$.pipe(
    switchMap(() => this.getTableService.tableData$),
  );

  /**
   * filtered table data exposed
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
      return this.filterAndMap(value);
    }),
  );

  /** function filters and maps to appropriate type */
  filterAndMap(value: { formData: any; tableData: TableData }): TableData {
    const mapOfValues = new Map(Object.entries(value.formData));
    console.log(mapOfValues);
    const tableData = value.tableData.data;
    const filterdData: TableItem[] = tableData.filter((tableItem) => {
      const filterValueForName = String(
        mapOfValues.get('name') ? mapOfValues.get('name') : '',
      ).toLowerCase();
      const filterValueForAge = String(
        mapOfValues.get('age') ? mapOfValues.get('age') : '',
      ).toLowerCase();
      let nameComparison = true;
      let ageComparison = true;
      if (filterValueForName) {
        nameComparison = tableItem.name.includes(filterValueForName);
      }
      if (filterValueForAge) {
        ageComparison = String(tableItem.age).includes(filterValueForAge);
      }
      return nameComparison && ageComparison;
    });
    return {
      data: filterdData,
      state: 'success',
    };
  }
  ngOnInit(): void {}
}
