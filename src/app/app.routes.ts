import { Routes } from '@angular/router';
import { TableComponent } from './components/table/table.component';
export const routes: Routes = [
  {
    path: 'table',
    loadComponent: () =>
      import('./components/table/table.component').then(
        (t) => t.TableComponent
      ),
  },
];
