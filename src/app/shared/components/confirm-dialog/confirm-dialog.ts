import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('تأكيد');
  readonly cancelLabel = input('إلغاء');
  readonly variant = input<'default' | 'danger'>('default');
  readonly loading = input(false);
  readonly alertOnly = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  protected onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('confirm-dialog__backdrop')) {
      this.cancelled.emit();
    }
  }
}
