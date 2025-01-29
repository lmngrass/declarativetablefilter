import { TestBed } from '@angular/core/testing';

import { GetTableDataService } from './get-table-data.service';

describe('GetTableDataService', () => {
  let service: GetTableDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetTableDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
