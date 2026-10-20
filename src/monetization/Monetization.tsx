import { type ReactNode } from 'react';

import { MonetizationContext, webMonetization } from './context';

export { useMonetization } from './context';

/** The website stays free, without a store purchase. Android and iOS sell the one-time remove-ads purchase. */
export function MonetizationProvider({ children }: { children: ReactNode }) {
  return <MonetizationContext.Provider value={webMonetization}>{children}</MonetizationContext.Provider>;
}
