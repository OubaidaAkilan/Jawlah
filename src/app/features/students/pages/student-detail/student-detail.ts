import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Student } from '../../../../core/models/student.model';
import { toLocalJordanPhone } from '../../../../core/utils/phone.util';
import { StudentsService } from '../../../../core/services/students.service';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import {
  getCallUrl,
  getMapUrl,
  getWhatsAppUrl,
  hasParentName,
  isValidUrl,
  MAP_UNAVAILABLE_MESSAGE,
  MAP_UNAVAILABLE_TITLE,
} from '../../utils/student-links.util';
import { ActionIconButton } from '../../components/action-icon-button/action-icon-button';
import { StudentAttendance } from '../../components/student-attendance/student-attendance';
import { StudentAvatar } from '../../components/student-avatar/student-avatar';

@Component({
  selector: 'app-student-detail',
  imports: [RouterLink, StudentAvatar, ActionIconButton, StudentAttendance, ConfirmDialog],
  templateUrl: './student-detail.html',
  styleUrl: './student-detail.scss',
})
export class StudentDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly studentsService = inject(StudentsService);

  protected readonly student = signal<Student | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly deleteConfirmOpen = signal(false);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);

  protected readonly getWhatsAppUrl = getWhatsAppUrl;
  protected readonly getCallUrl = getCallUrl;
  protected readonly getMapUrl = getMapUrl;
  protected readonly isValidUrl = isValidUrl;
  protected readonly hasParentName = hasParentName;
  protected readonly toLocalPhone = toLocalJordanPhone;
  protected readonly mapUnavailableTitle = MAP_UNAVAILABLE_TITLE;
  protected readonly mapUnavailableMessage = MAP_UNAVAILABLE_MESSAGE;

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }

    try {
      const data = await this.studentsService.getById(id);
      if (!data) {
        this.notFound.set(true);
      } else {
        this.student.set(data);
      }
    } catch {
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected openDeleteConfirm(): void {
    this.deleteError.set(null);
    this.deleteConfirmOpen.set(true);
  }

  protected onDeleteCancelled(): void {
    this.deleteConfirmOpen.set(false);
  }

  protected async onDeleteConfirmed(): Promise<void> {
    const s = this.student();
    if (!s) return;

    this.deleting.set(true);
    this.deleteError.set(null);

    try {
      await this.studentsService.delete(s.id);
      await this.router.navigate(['/students']);
    } catch {
      this.deleteError.set('تعذر حذف الطالب. تحقق من الصلاحيات.');
    } finally {
      this.deleting.set(false);
      this.deleteConfirmOpen.set(false);
    }
  }
}
