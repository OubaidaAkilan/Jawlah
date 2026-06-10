import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Attendance, AttendanceStatus } from '../../../../core/models/attendance.model';
import { AttendanceService } from '../../../../core/services/attendance.service';
import {
  ATTENDANCE_STATUS_OPTIONS,
  attendanceStatusLabel,
  todayDateString,
} from '../../utils/attendance.util';

@Component({
  selector: 'app-student-attendance',
  imports: [ReactiveFormsModule],
  templateUrl: './student-attendance.html',
  styleUrl: './student-attendance.scss',
})
export class StudentAttendance implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly attendanceService = inject(AttendanceService);

  readonly studentId = input.required<string>();

  protected readonly records = signal<Attendance[]>([]);
  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly statusOptions = ATTENDANCE_STATUS_OPTIONS;
  protected readonly statusLabel = attendanceStatusLabel;

  protected readonly form = this.fb.nonNullable.group({
    date: [todayDateString(), Validators.required],
    status: ['pending' as AttendanceStatus, Validators.required],
    absence_reason: [''],
  });

  async ngOnInit(): Promise<void> {
    await this.loadRecords();
  }

  protected get showAbsenceReason(): boolean {
    return this.form.controls.status.value === 'absence';
  }

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (raw.status === 'absence' && !raw.absence_reason.trim()) {
      this.error.set('سبب الغياب مطلوب عند تسجيل غياب');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    try {
      await this.attendanceService.create({
        student_id: this.studentId(),
        date: raw.date,
        status: raw.status,
        absence_reason: raw.status === 'absence' ? raw.absence_reason.trim() : null,
      });

      this.form.reset({
        date: todayDateString(),
        status: 'pending',
        absence_reason: '',
      });
      await this.loadRecords();
    } catch {
      this.error.set('تعذر تسجيل الحضور. قد يكون مسجلاً لهذا اليوم.');
    } finally {
      this.submitting.set(false);
    }
  }

  private async loadRecords(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.attendanceService.getByStudent(this.studentId());
      this.records.set(data);
    } catch {
      this.error.set('تعذر تحميل سجل الحضور');
    } finally {
      this.loading.set(false);
    }
  }
}
