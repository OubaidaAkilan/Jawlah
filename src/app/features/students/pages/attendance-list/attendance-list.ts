import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AttendanceProgramFilter,
  AttendanceStatusFilter,
  AttendanceWithStudent,
} from '../../../../core/models/attendance.model';
import { AttendanceService } from '../../../../core/services/attendance.service';
import { StudentCard } from '../../components/student-card/student-card';
import {
  ATTENDANCE_PROGRAM_FILTER_OPTIONS,
  ATTENDANCE_STATUS_FILTER_OPTIONS,
  todayDateString,
} from '../../utils/attendance.util';

@Component({
  selector: 'app-attendance-list',
  imports: [ReactiveFormsModule, RouterLink, StudentCard],
  templateUrl: './attendance-list.html',
  styleUrl: './attendance-list.scss',
})
export class AttendanceList implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly attendanceService = inject(AttendanceService);

  protected readonly records = signal<AttendanceWithStudent[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly programOptions = ATTENDANCE_PROGRAM_FILTER_OPTIONS;
  protected readonly statusOptions = ATTENDANCE_STATUS_FILTER_OPTIONS;

  protected readonly filters = this.fb.nonNullable.group({
    date: [todayDateString()],
    program: ['all' as AttendanceProgramFilter],
    status: ['all' as AttendanceStatusFilter],
  });

  async ngOnInit(): Promise<void> {
    await this.loadRecords();
    this.filters.valueChanges.subscribe(() => {
      void this.loadRecords();
    });
  }

  protected setProgram(value: AttendanceProgramFilter): void {
    this.filters.controls.program.setValue(value);
  }

  protected setStatus(value: AttendanceStatusFilter): void {
    this.filters.controls.status.setValue(value);
  }

  private async loadRecords(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);

    try {
      const data = await this.attendanceService.getFiltered(this.filters.getRawValue());
      this.records.set(data);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
