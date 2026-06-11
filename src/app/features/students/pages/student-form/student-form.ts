import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StudentInsert } from '../../../../core/models/student.model';
import { normalizeJordanPhone, toLocalJordanPhone } from '../../../../core/utils/phone.util';
import { StudentsService } from '../../../../core/services/students.service';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { normalizeProgramFlags } from '../../utils/program.util';

@Component({
  selector: 'app-student-form',
  imports: [ReactiveFormsModule, RouterLink, ConfirmDialog],
  templateUrl: './student-form.html',
  styleUrl: './student-form.scss',
})
export class StudentForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly studentsService = inject(StudentsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly submitting = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isEdit = signal(false);
  protected readonly studentId = signal<string | null>(null);
  protected readonly studentName = signal('');
  protected readonly saveConfirmOpen = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    full_name: ['', Validators.required],
    age: [null as number | null, [Validators.required, Validators.min(3), Validators.max(18)]],
    grade: ['', Validators.required],
    school_name: ['', Validators.required],
    student_phone_number: [''],
    parent_name: ['', Validators.required],
    parent_phone_number: ['', Validators.required],
    home_address: ['', Validators.required],
    google_maps_link: [''],
    student_photo: [''],
    facebook_url: [''],
    instagram_url: [''],
    tiktok_url: [''],
    snapchat_url: [''],
    notes: [''],
    is_summer_program: [false],
    is_saturday_program: [false],
    is_unassigned_program: [false],
  });

  protected get cancelLink(): string[] {
    const id = this.studentId();
    return id ? ['/students', id] : ['/students'];
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.isEdit.set(true);
    this.studentId.set(id);
    this.loading.set(true);

    try {
      const student = await this.studentsService.getById(id);
      if (!student) {
        this.error.set('الطالب غير موجود');
        return;
      }

      this.studentName.set(student.full_name);
      this.form.patchValue({
        full_name: student.full_name,
        age: student.age,
        grade: student.grade,
        school_name: student.school_name,
        student_phone_number: student.student_phone_number
          ? toLocalJordanPhone(student.student_phone_number)
          : '',
        parent_name: student.parent_name,
        parent_phone_number: toLocalJordanPhone(student.parent_phone_number),
        home_address: student.home_address,
        google_maps_link: student.google_maps_link ?? '',
        student_photo: student.student_photo ?? '',
        facebook_url: student.facebook_url ?? '',
        instagram_url: student.instagram_url ?? '',
        tiktok_url: student.tiktok_url ?? '',
        snapchat_url: student.snapchat_url ?? '',
        notes: student.notes ?? '',
        is_summer_program: student.is_summer_program ?? false,
        is_saturday_program: student.is_saturday_program ?? false,
        is_unassigned_program: student.is_unassigned_program ?? false,
      });
    } catch {
      this.error.set('تعذر تحميل بيانات الطالب');
    } finally {
      this.loading.set(false);
    }
  }

  protected onProgramChange(changed: 'summer' | 'saturday' | 'unassigned'): void {
    const raw = this.form.getRawValue();

    if (changed === 'unassigned' && raw.is_unassigned_program) {
      this.form.patchValue(
        { is_summer_program: false, is_saturday_program: false },
        { emitEvent: false }
      );
      return;
    }

    if (
      (changed === 'summer' || changed === 'saturday') &&
      (raw.is_summer_program || raw.is_saturday_program)
    ) {
      this.form.patchValue({ is_unassigned_program: false }, { emitEvent: false });
    }
  }

  protected isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && control.touched;
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const studentPhone = raw.student_phone_number.trim();
    const parentPhone = raw.parent_phone_number.trim();

    try {
      if (studentPhone) normalizeJordanPhone(studentPhone);
      normalizeJordanPhone(parentPhone);
    } catch {
      this.error.set('رقم الهاتف غير صحيح. مثال: 0780110768');
      return;
    }

    this.error.set(null);

    if (this.isEdit()) {
      this.saveConfirmOpen.set(true);
      return;
    }

    void this.persistStudent();
  }

  protected onSaveConfirmed(): void {
    void this.persistStudent();
  }

  protected onSaveCancelled(): void {
    this.saveConfirmOpen.set(false);
  }

  private buildPayload(): Omit<StudentInsert, 'responded_to_call_status'> {
    const raw = this.form.getRawValue();
    const studentPhone = raw.student_phone_number.trim();
    const parentPhone = raw.parent_phone_number.trim();

    return {
      full_name: raw.full_name.trim(),
      age: raw.age!,
      grade: raw.grade.trim(),
      school_name: raw.school_name.trim(),
      student_phone_number: studentPhone || null,
      parent_name: raw.parent_name.trim(),
      parent_phone_number: parentPhone,
      home_address: raw.home_address.trim(),
      google_maps_link: raw.google_maps_link.trim() || null,
      student_photo: raw.student_photo.trim() || null,
      facebook_url: raw.facebook_url.trim() || null,
      instagram_url: raw.instagram_url.trim() || null,
      tiktok_url: raw.tiktok_url.trim() || null,
      snapchat_url: raw.snapchat_url.trim() || null,
      notes: raw.notes.trim() || null,
      ...normalizeProgramFlags({
        is_summer_program: raw.is_summer_program,
        is_saturday_program: raw.is_saturday_program,
        is_unassigned_program: raw.is_unassigned_program,
      }),
    };
  }

  private async persistStudent(): Promise<void> {
    this.submitting.set(true);
    this.error.set(null);

    try {
      const payload = this.buildPayload();
      const id = this.studentId();

      if (this.isEdit() && id) {
        const student = await this.studentsService.update(id, payload);
        await this.router.navigate(['/students', student.id]);
      } else {
        const student = await this.studentsService.create({
          ...payload,
          responded_to_call_status: 'not_contacted',
        });
        await this.router.navigate(['/students', student.id]);
      }
    } catch {
      this.error.set(
        this.isEdit()
          ? 'تعذر تحديث بيانات الطالب. تحقق من الصلاحيات.'
          : 'تعذر إضافة الطالب. تحقق من البيانات والصلاحيات.'
      );
    } finally {
      this.submitting.set(false);
      this.saveConfirmOpen.set(false);
    }
  }
}
