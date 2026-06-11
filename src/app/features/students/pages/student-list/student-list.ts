import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CallResponseStatus, Student } from '../../../../core/models/student.model';
import { StudentsService } from '../../../../core/services/students.service';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { StudentCard } from '../../components/student-card/student-card';
import {
  CALL_STATUS_FILTER_OPTIONS,
  CallStatusFilter,
  resolveCallStatus,
} from '../../utils/call-status.util';
import { PROGRAM_FILTER_OPTIONS, ProgramFilter } from '../../utils/program.util';

@Component({
  selector: 'app-student-list',
  imports: [RouterLink, StudentCard, ConfirmDialog],
  templateUrl: './student-list.html',
  styleUrl: './student-list.scss',
})
export class StudentList implements OnInit {
  private readonly studentsService = inject(StudentsService);

  protected readonly students = signal<Student[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly program = signal<ProgramFilter>('all');
  protected readonly callStatus = signal<CallStatusFilter>('all');
  protected readonly searchQuery = signal('');
  protected readonly updatingStudentId = signal<string | null>(null);
  protected readonly resetConfirmOpen = signal(false);
  protected readonly resettingCallStatus = signal(false);
  protected readonly resetError = signal<string | null>(null);
  protected readonly callStatusError = signal<string | null>(null);

  protected readonly programOptions = PROGRAM_FILTER_OPTIONS;
  protected readonly callStatusOptions = CALL_STATUS_FILTER_OPTIONS;

  protected readonly filteredStudents = computed(() => {
    let list = this.students();
    const program = this.program();
    const callStatus = this.callStatus();
    const query = this.searchQuery().trim().toLocaleLowerCase();

    if (program === 'summer') {
      list = list.filter((student) => student.is_summer_program);
    } else if (program === 'saturday') {
      list = list.filter((student) => student.is_saturday_program);
    } else if (program === 'unassigned') {
      list = list.filter((student) => student.is_unassigned_program);
    }

    if (callStatus !== 'all') {
      list = list.filter(
        (student) => resolveCallStatus(student.responded_to_call_status) === callStatus
      );
    }

    if (!query) {
      return list;
    }

    return list.filter((student) =>
      student.full_name.toLocaleLowerCase().includes(query)
    );
  });

  protected setProgram(value: ProgramFilter): void {
    this.program.set(value);
  }

  protected setCallStatus(value: CallStatusFilter): void {
    this.callStatus.set(value);
  }

  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected openResetConfirm(): void {
    this.resetError.set(null);
    this.resetConfirmOpen.set(true);
  }

  protected onResetCancelled(): void {
    this.resetConfirmOpen.set(false);
  }

  protected async onResetConfirmed(): Promise<void> {
    this.resettingCallStatus.set(true);
    this.resetError.set(null);

    try {
      await this.studentsService.resetAllCallStatus();
      this.students.update((list) =>
        list.map((student) => ({ ...student, responded_to_call_status: 'not_contacted' }))
      );
      this.resetConfirmOpen.set(false);
    } catch {
      this.resetError.set('تعذر إعادة تعيين حالة الاتصال');
    } finally {
      this.resettingCallStatus.set(false);
    }
  }

  protected async onCallStatusChange(student: Student, status: CallResponseStatus): Promise<void> {
    this.updatingStudentId.set(student.id);
    this.callStatusError.set(null);

    const previousStatus = resolveCallStatus(student.responded_to_call_status);
    this.students.update((list) =>
      list.map((item) =>
        item.id === student.id ? { ...item, responded_to_call_status: status } : item
      )
    );

    try {
      const updated = await this.studentsService.updateCallStatus(student.id, status);
      this.students.update((list) =>
        list.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch {
      this.students.update((list) =>
        list.map((item) =>
          item.id === student.id ? { ...item, responded_to_call_status: previousStatus } : item
        )
      );
      this.callStatusError.set('تعذر تحديث حالة الاتصال. تحقق من صلاحيات Supabase.');
    } finally {
      this.updatingStudentId.set(null);
    }
  }

  async ngOnInit(): Promise<void> {
    try {
      const data = await this.studentsService.getAll();
      this.students.set(data);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
