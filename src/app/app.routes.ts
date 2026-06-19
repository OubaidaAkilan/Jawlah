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
    path: 'attendance',
    loadComponent: () =>
      import('./features/students/pages/attendance-list/attendance-list').then(
        (m) => m.AttendanceList
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
  {
    path: 'messages/new',
    loadComponent: () =>
      import('./features/students/pages/send-message/send-message').then(
        (m) => m.SendMessage
      ),
  },
  {
    path: 'c/:token',
    loadComponent: () =>
      import('./features/students/pages/attendance-confirm/attendance-confirm').then(
        (m) => m.AttendanceConfirm
      ),
  },
];
