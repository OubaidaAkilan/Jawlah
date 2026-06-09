import { NgTemplateOutlet } from '@angular/common';
import { Component, input, signal } from '@angular/core';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';

export type ActionIconType = 'whatsapp' | 'call' | 'map';

@Component({
  selector: 'app-action-icon-button',
  imports: [ConfirmDialog, NgTemplateOutlet],
  templateUrl: './action-icon-button.html',
  styleUrl: './action-icon-button.scss',
})
export class ActionIconButton {
  readonly href = input<string | null>(null);
  readonly label = input.required<string>();
  readonly type = input.required<ActionIconType>();
  readonly unavailableTitle = input<string | null>(null);
  readonly unavailableMessage = input<string | null>(null);

  protected readonly infoOpen = signal(false);

  protected get showUnavailableAction(): boolean {
    return !this.href() && !!this.unavailableMessage();
  }

  protected onUnavailableClick(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.infoOpen.set(true);
  }

  protected onInfoClose(): void {
    this.infoOpen.set(false);
  }
}
