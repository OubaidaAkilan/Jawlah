import { CallResponseStatus } from '../../../core/models/student.model';

export const CALL_STATUS_OPTIONS: { value: CallResponseStatus; label: string }[] = [
  { value: 'not_contacted', label: 'لم يتم التواصل بعد' },
  { value: 'no_answer', label: 'لم يتم الرد' },
  { value: 'contacted', label: 'تم التواصل' },
];

export type CallStatusFilter = CallResponseStatus | 'all';

export const CALL_STATUS_FILTER_OPTIONS: { value: CallStatusFilter; label: string }[] = [
  { value: 'all', label: 'الكل' },
  ...CALL_STATUS_OPTIONS,
];

export function resolveCallStatus(
  status: CallResponseStatus | null | undefined
): CallResponseStatus {
  return status ?? 'not_contacted';
}

export function callStatusLabel(status: CallResponseStatus | null | undefined): string {
  return (
    CALL_STATUS_OPTIONS.find((option) => option.value === resolveCallStatus(status))?.label ??
    'لم يتم التواصل بعد'
  );
}
