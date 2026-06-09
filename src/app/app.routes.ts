import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'students', pathMatch: 'full' },
  {
    path: 'students',
    loadComponent: () =>
      import('./features/students/pages/student-list/student-list').then(
        (m) => m.StudentList
      ),
  },
  {
    path: 'students/new',
    loadComponent: () =>
      import('./features/students/pages/student-form/student-form').then(
        (m) => m.StudentForm
      ),
  },
  {
    path: 'students/:id/edit',
    loadComponent: () =>
      import('./features/students/pages/student-form/student-form').then(
        (m) => m.StudentForm
      ),
  },
  {
    path: 'students/:id',
    loadComponent: () =>
      import('./features/students/pages/student-detail/student-detail').then(
        (m) => m.StudentDetail
      ),
  },
];
