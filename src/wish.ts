import { WISH_EMAIL } from './about';
import type { LocaleId, Strings } from './i18n';
import { PRACTICE_PATH, type ScreenId } from './navigation';

export type WishKind = 'change' | 'new';

export type WishPlace = 'home' | 'app' | Exclude<ScreenId, 'home'>;

export const WISH_KINDS: WishKind[] = ['change', 'new'];

export const WISH_PLACES: WishPlace[] = [
  'home',
  'app',
  ...PRACTICE_PATH.filter((item) => item.kind === 'exercise').map((item) => item.screen),
  'piano',
  'calibrate',
];

export function wishKindLabel(kind: WishKind, t: Strings): string {
  return kind === 'change' ? t.wish.kindChange : t.wish.kindNew;
}

export function wishPlaceLabel(place: WishPlace, t: Strings): string {
  if (place === 'home') {
    return t.wish.whereHome;
  }
  if (place === 'app') {
    return t.wish.whereApp;
  }
  if (place === 'piano' || place === 'calibrate') {
    return t.tools[place].title;
  }
  return t.practice[place].title;
}

export function wishMailto(
  kind: WishKind,
  place: WishPlace,
  text: string,
  reply: string,
  locale: LocaleId,
  t: Strings,
): string {
  const subject = `Audiation: ${wishKindLabel(kind, t)} / ${wishPlaceLabel(place, t)}`;
  const lines = [
    `Soort: ${wishKindLabel(kind, t)}`,
    `Waar: ${wishPlaceLabel(place, t)}`,
    `Taal: ${locale}`,
    '',
    text.trim(),
  ];
  if (reply.trim()) {
    lines.push('', `Antwoord naar: ${reply.trim()}`);
  }
  const body = lines.join('\n');
  return `mailto:${WISH_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
