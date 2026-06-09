import { Student } from '../../../core/models/student.model';
import { toWhatsAppLink } from '../../../core/utils/phone.util';

export function getContactPhone(student: Student): string | null {
  return student.student_phone_number ?? student.parent_phone_number ?? null;
}

export function getWhatsAppUrl(student: Student): string | null {
  const phone = getContactPhone(student);
  return phone ? toWhatsAppLink(phone) : null;
}

export function getCallUrl(student: Student): string | null {
  const phone = getContactPhone(student);
  return phone ? `tel:${phone}` : null;
}

export const MAP_UNAVAILABLE_TITLE = 'الموقع غير متوفر';

export const MAP_UNAVAILABLE_MESSAGE =
  'الطالب لا يملك رابط موقع على الخريطة. يمكنك إضافته من صفحة التعديل.';

export function getMapUrl(student: Student): string | null {
  const link = student.google_maps_link?.trim();
  if (link?.startsWith('http')) {
    return link;
  }
  return null;
}

export function isValidUrl(value: string | null | undefined): boolean {
  const trimmed = value?.trim();
  return !!trimmed && (trimmed.startsWith('http') || trimmed.startsWith('www.'));
}

export function hasParentName(name: string | null | undefined): boolean {
  const trimmed = name?.trim();
  return !!trimmed && trimmed !== 'غير محدد';
}
