import type { LocaleId } from './i18n';

export const APP_AUTHOR = 'Freek van Steijn';
export const APP_EMAIL = 'fvsteijn@gmail.com';
/** Same inbox as APP_EMAIL (Gmail +tag). Filter on To: audiation-wens. */
export const WISH_EMAIL = 'fvsteijn+audiation-wens@gmail.com';
export const APP_VERSION = '1.0.9';
export const SITE_URL = 'https://audiation.app';
export const PRIVACY_URL = 'https://audiation.app/privacy';

/** Dutch pages stay on the bare path. Other languages use /en/, /de/, /fr/, /es/. */
export function localeUrl(base: string, locale: LocaleId): string {
  const url = new URL(base);
  url.searchParams.delete('lang');
  if (locale !== 'nl') {
    url.pathname = url.pathname === '/' ? `/${locale}/` : `/${locale}${url.pathname}`;
  }
  return url.toString();
}
