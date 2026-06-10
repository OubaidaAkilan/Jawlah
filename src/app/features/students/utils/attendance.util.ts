import { AttendanceStatus, AttendanceStatusFilter } from '../../../core/models/attendance.model';
import { PROGRAM_FILTER_OPTIONS, ProgramFilter } from './program.util';

export type { ProgramFilter as AttendanceProgramFilter };

export const ATTENDANCE_STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'present', label: 'حاضر' },
  { value: 'absence', label: 'غائب' },
];

export const ATTENDANCE_STATUS_FILTER_OPTIONS: {
  value: AttendanceStatusFilter;
  label: string;
}[] = [{ value: 'all', label: 'الكل' }, ...ATTENDANCE_STATUS_OPTIONS];

export const ATTENDANCE_PROGRAM_FILTER_OPTIONS = PROGRAM_FILTER_OPTIONS;

export function attendanceStatusLabel(status: AttendanceStatus): string {
  return ATTENDANCE_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}
