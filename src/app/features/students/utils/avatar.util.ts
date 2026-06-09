const AVATAR_COLORS = ['#e78fb3', '#9656a1', '#ffc0ad', '#55423d'];

export function avatarColorFromName(name: string): string {
  const code = [...name.trim()].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

export function avatarTextColor(bgColor: string): string {
  return bgColor === '#55423d' ? '#fffffe' : '#271c19';
}

export function isValidPhotoUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim();
  return !!trimmed && /^https?:\/\//i.test(trimmed);
}

export function firstLetter(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';

  const match = trimmed.match(/[\p{L}]/u);
  const letter = match?.[0] ?? trimmed.charAt(0);
  return letter.toLocaleUpperCase();
}
