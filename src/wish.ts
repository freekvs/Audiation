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

export type WishMail = {
  address: string;
  subject: string;
  body: string;
};

export function wishMail(
  kind: WishKind,
  place: WishPlace,
  text: string,
  reply: string,
  locale: LocaleId,
  t: Strings,
): WishMail {
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
  return { address: WISH_EMAIL, subject, body: lines.join('\n') };
}

/** Encode `+` in the local part; some mail apps treat a raw `+` as a space. */
export function toMailto({ address, subject, body }: WishMail): string {
  const at = address.lastIndexOf('@');
  const local = encodeURIComponent(address.slice(0, at));
  const domain = address.slice(at + 1);
  return `mailto:${local}@${domain}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function toGmail({ address, subject, body }: WishMail): string {
  const url = new URL('https://mail.google.com/mail/');
  url.searchParams.set('view', 'cm');
  url.searchParams.set('fs', '1');
  url.searchParams.set('to', address);
  url.searchParams.set('su', subject);
  url.searchParams.set('body', body);
  return url.toString();
}

export function wishMailto(
  kind: WishKind,
  place: WishPlace,
  text: string,
  reply: string,
  locale: LocaleId,
  t: Strings,
): string {
  return toMailto(wishMail(kind, place, text, reply, locale, t));
}
