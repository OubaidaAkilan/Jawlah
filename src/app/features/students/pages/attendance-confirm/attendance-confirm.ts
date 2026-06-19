import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MessagingService } from '../../../../core/services/messaging.service';

@Component({
  selector: 'app-attendance-confirm',
  imports: [FormsModule],
  templateUrl: './attendance-confirm.html',
  styleUrl: './attendance-confirm.scss',
})
export class AttendanceConfirm implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly messagingService = inject(MessagingService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly student = signal<{
    full_name: string;
    nickname: string;
    program: string;
  } | null>(null);
  protected readonly date = signal('');
  protected readonly text = signal('');
  protected readonly currentStatus = signal<string | null>(null);
  protected readonly currentAbsenceReason = signal<string | null>(null);

  protected readonly confirming = signal(false);
  protected readonly confirmed = signal(false);
  protected readonly confirmStatus = signal<string | null>(null);
  protected readonly confirmError = signal<string | null>(null);

  protected readonly showAbsenceReason = signal(false);
  protected readonly absenceReason = signal('');

  private studentId = '';
  private sig = '';

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.queryParams;
    this.studentId = params['student'] || '';
    const date = params['date'] || '';
    const text = params['text'] || '';
    this.sig = params['sig'] || '';

    if (!this.studentId || !date || !this.sig) {
      this.error.set('رابط غير صالح');
      this.loading.set(false);
      return;
    }

    this.date.set(date);
    this.text.set(text);

    try {
      const result = await this.messagingService.verifyConfirmationLink(
        this.studentId,
        date,
        text,
        this.sig
      );

      if (!result.valid || !result.student) {
        this.error.set(result.error || 'رابط غير صالح');
      } else {
        this.student.set(result.student);
        this.currentStatus.set(result.currentStatus || null);
        this.currentAbsenceReason.set(result.currentAbsenceReason || null);
      }
    } catch {
      this.error.set('حدث خطأ في الاتصال');
    } finally {
      this.loading.set(false);
    }
  }

  onPresent(): void {
    this.showAbsenceReason.set(false);
    this.absenceReason.set('');
    this.doConfirm('present');
  }

  onAbsence(): void {
    if (!this.showAbsenceReason()) {
      this.showAbsenceReason.set(true);
      return;
    }
    this.doConfirm('absence');
  }

  private async doConfirm(status: 'present' | 'absence'): Promise<void> {
    this.confirming.set(true);
    this.confirmError.set(null);

    try {
      const result = await this.messagingService.confirmAttendance({
        studentId: this.studentId,
        date: this.date(),
        text: this.text(),
        sig: this.sig,
        status,
        absenceReason: status === 'absence' ? (this.absenceReason() || null) : null,
      });

      if (result.success) {
        this.confirmed.set(true);
        this.confirmStatus.set(status);
        this.currentStatus.set(status);
        this.currentAbsenceReason.set(status === 'absence' ? (this.absenceReason() || null) : null);
      } else {
        this.confirmError.set(result.error || 'فشل تأكيد الحضور');
      }
    } catch {
      this.confirmError.set('حدث خطأ في الاتصال');
    } finally {
      this.confirming.set(false);
    }
  }
}
