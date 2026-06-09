import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Student } from '../../../../core/models/student.model';
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

  protected getWhatsAppUrl = getWhatsAppUrl;
  protected getCallUrl = getCallUrl;
  protected getMapUrl = getMapUrl;
  protected readonly mapUnavailableTitle = MAP_UNAVAILABLE_TITLE;
  protected readonly mapUnavailableMessage = MAP_UNAVAILABLE_MESSAGE;
}
