import { Student } from './student.model';

export type AttendanceStatus = 'pending' | 'present' | 'absence';

export interface Attendance {
  id: string;
  student_id: string;
  date: string;
  status: AttendanceStatus;
  absence_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type AttendanceInsert = Omit<Attendance, 'id' | 'created_at' | 'updated_at'>;
export type AttendanceUpdate = Partial<AttendanceInsert>;

export type AttendanceProgramFilter = 'all' | 'summer' | 'saturday' | 'unassigned';
export type AttendanceStatusFilter = AttendanceStatus | 'all';

export interface AttendanceFilters {
  date: string;
  program: AttendanceProgramFilter;
  status: AttendanceStatusFilter;
}

export interface AttendanceWithStudent extends Attendance {
  students: Student;
}
