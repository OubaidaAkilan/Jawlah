export type ProgramFilter = 'all' | 'summer' | 'saturday' | 'unassigned';

export const PROGRAM_FILTER_OPTIONS: { value: ProgramFilter; label: string }[] = [
  { value: 'all', label: 'كل البرامج' },
  { value: 'summer', label: 'برنامج الصيف' },
  { value: 'saturday', label: 'برنامج السبت' },
  { value: 'unassigned', label: 'غير مسجل' },
];

export interface ProgramFlags {
  is_summer_program: boolean;
  is_saturday_program: boolean;
  is_unassigned_program: boolean;
}

export function normalizeProgramFlags(flags: ProgramFlags): ProgramFlags {
  if (flags.is_unassigned_program) {
    return {
      is_unassigned_program: true,
      is_summer_program: false,
      is_saturday_program: false,
    };
  }

  return {
    ...flags,
    is_unassigned_program: false,
  };
}
