import { Component, computed, effect, input, signal } from '@angular/core';
import { Student } from '../../../../core/models/student.model';
import {
  avatarColorFromName,
  avatarTextColor,
  firstLetter,
  isValidPhotoUrl,
} from '../../utils/avatar.util';

@Component({
  selector: 'app-student-avatar',
  templateUrl: './student-avatar.html',
  styleUrl: './student-avatar.scss',
})
export class StudentAvatar {
  readonly student = input.required<Student>();
  readonly size = input<'small' | 'large'>('small');

  protected readonly imageFailed = signal(false);

  protected readonly letter = computed(() => firstLetter(this.student().full_name));
  protected readonly bgColor = computed(() => avatarColorFromName(this.student().full_name));
  protected readonly textColor = computed(() => avatarTextColor(this.bgColor()));
  protected readonly photoUrl = computed(() => {
    const url = this.student().student_photo;
    return isValidPhotoUrl(url) ? url!.trim() : null;
  });
  protected readonly showPhoto = computed(() => !!this.photoUrl() && !this.imageFailed());

  constructor() {
    effect(() => {
      this.student();
      this.imageFailed.set(false);
    });
  }

  protected onImageError(): void {
    this.imageFailed.set(true);
  }
}
