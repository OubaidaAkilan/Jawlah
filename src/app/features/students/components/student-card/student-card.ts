import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AttendanceStatus } from '../../../../core/models/attendance.model';
import { CallResponseStatus, Student } from '../../../../core/models/student.model';
import { attendanceStatusLabel } from '../../utils/attendance.util';
import {
  CALL_STATUS_OPTIONS,
  callStatusLabel,
  resolveCallStatus,
} from '../../utils/call-status.util';
import {
  getCallUrl,
  getMapUrl,
  getWhatsAppUrl,
  MAP_UNAVAILABLE_MESSAGE,
  MAP_UNAVAILABLE_TITLE,
} from '../../utils/student-links.util';
import { ActionIconButton } from '../action-icon-button/action-icon-button';
import { StudentAvatar } from '../student-avatar/student-avatar';

@Component({
  selector: 'app-student-card',
  imports: [RouterLink, StudentAvatar, ActionIconButton],
  templateUrl: './student-card.html',
  styleUrl: './student-card.scss',
})
export class StudentCard {
  readonly student = input.required<Student>();
  readonly attendanceStatus = input<AttendanceStatus | null>(null);
  readonly absenceReason = input<string | null>(null);
  readonly showCallStatus = input(true);
  readonly updatingCallStatus = input(false);

  readonly callStatusChange = output<CallResponseStatus>();

  protected readonly statusLabel = attendanceStatusLabel;
  protected readonly callStatusLabel = callStatusLabel;
  protected readonly callStatusOptions = CALL_STATUS_OPTIONS;
  protected readonly resolveCallStatus = resolveCallStatus;

  protected getWhatsAppUrl = getWhatsAppUrl;
  protected getCallUrl = getCallUrl;
  protected getMapUrl = getMapUrl;
  protected readonly mapUnavailableTitle = MAP_UNAVAILABLE_TITLE;
  protected readonly mapUnavailableMessage = MAP_UNAVAILABLE_MESSAGE;

  protected onCallStatusClick(event: MouseEvent, status: CallResponseStatus): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.updatingCallStatus() || resolveCallStatus(this.student().responded_to_call_status) === status) {
      return;
    }

    this.callStatusChange.emit(status);
  }
}
