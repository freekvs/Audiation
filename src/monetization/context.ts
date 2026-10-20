import { createContext, useContext } from 'react';

import type { ScreenId } from '../navigation';
import { FALLBACK_PRICE } from './ids';

export type AdsNotice = 'pending' | 'missing' | 'failed' | 'restored' | 'thanks';

export type MonetizationValue = {
  adsRemoved: boolean;
  priceLabel: string;
  busy: boolean;
  notice: AdsNotice | null;
  buy: () => void;
  restore: () => void;
  openWithAd: (screen: ScreenId, go: (screen: ScreenId) => void) => void;
};

export const webMonetization: MonetizationValue = {
  adsRemoved: true,
  priceLabel: FALLBACK_PRICE,
  busy: false,
  notice: null,
  buy: () => undefined,
  restore: () => undefined,
  openWithAd: (screen, go) => {
    go(screen);
  },
};

export const MonetizationContext = createContext<MonetizationValue>(webMonetization);

export function useMonetization() {
  return useContext(MonetizationContext);
}
