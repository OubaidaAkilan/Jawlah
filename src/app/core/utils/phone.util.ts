const JORDAN_COUNTRY_CODE = '+962';

export function normalizeJordanPhone(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;

  let digits = raw.replace(/[^\d+]/g, '');

  if (digits.startsWith('+962')) digits = digits.slice(4);
  else if (digits.startsWith('962')) digits = digits.slice(3);
  else if (digits.startsWith('0')) digits = digits.slice(1);

  if (digits.length !== 9) {
    throw new Error('Invalid Jordan phone number. Example: 0780110768');
  }

  return `${JORDAN_COUNTRY_CODE}${digits}`;
}

export function toLocalJordanPhone(e164: string): string {
  return `0${e164.replace('+962', '')}`;
}

export function toWhatsAppLink(phoneE164: string): string {
  return `https://wa.me/${phoneE164.replace('+', '')}`;
}
