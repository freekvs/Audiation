import { useEffect, useRef, useState, type ReactNode } from 'react';
import { isUserCancelledError, useIAP, type Purchase } from 'expo-iap';

import type { ScreenId } from '../navigation';
import { prepareAds, showInterstitial } from './ads';
import { MonetizationContext, type AdsNotice } from './context';

export { useMonetization } from './context';
import { FALLBACK_PRICE, REMOVE_ADS_SKU } from './ids';
import { loadLicense, saveLicense } from './license';

function isRemoveAds(purchase: Purchase): boolean {
  if (purchase.purchaseState !== 'purchased') {
    return false;
  }
  if (purchase.productId === REMOVE_ADS_SKU) {
    return true;
  }
  return purchase.ids?.includes(REMOVE_ADS_SKU) ?? false;
}

export function MonetizationProvider({ children }: { children: ReactNode }) {
  const [adsRemoved, setAdsRemoved] = useState(false);
  const [priceLabel, setPriceLabel] = useState(FALLBACK_PRICE);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<AdsNotice | null>(null);
  const adsRemovedRef = useRef(false);
  const restoreAsk = useRef(false);
  const finished = useRef(new Set<string>());
  const finishRef = useRef<(purchase: Purchase) => Promise<void>>(async () => undefined);

  const { connected, products, availablePurchases, finishTransaction, fetchProducts, requestPurchase, getAvailablePurchases } =
    useIAP({
      onPurchaseSuccess: (purchase) => {
        if (purchase.productId !== REMOVE_ADS_SKU && !purchase.ids?.includes(REMOVE_ADS_SKU)) {
          return;
        }
        if (purchase.purchaseState === 'pending') {
          setNotice('pending');
          setBusy(false);
          return;
        }
        adsRemovedRef.current = true;
        setAdsRemoved(true);
        void saveLicense();
        setNotice('thanks');
        setBusy(false);
        void finishRef.current(purchase);
      },
      onPurchaseError: (error) => {
        setBusy(false);
        if (isUserCancelledError(error)) {
          return;
        }
        setNotice('failed');
      },
    });

  finishRef.current = async (purchase) => {
    const token = purchase.purchaseToken ?? purchase.id;
    if (finished.current.has(token)) {
      return;
    }
    finished.current.add(token);
    try {
      await finishTransaction({ purchase, isConsumable: false });
    } catch {
      finished.current.delete(token);
    }
  };

  useEffect(() => {
    void loadLicense().then((owned) => {
      if (owned) {
        adsRemovedRef.current = true;
        setAdsRemoved(true);
        return;
      }
      void prepareAds();
    });
  }, []);

  useEffect(() => {
    if (!connected) {
      return;
    }
    void fetchProducts({ skus: [REMOVE_ADS_SKU], type: 'in-app' });
    void getAvailablePurchases().catch(() => undefined);
  }, [connected, fetchProducts, getAvailablePurchases]);

  useEffect(() => {
    const product = products.find((item) => item.id === REMOVE_ADS_SKU);
    if (product?.displayPrice) {
      setPriceLabel(product.displayPrice);
    }
  }, [products]);

  useEffect(() => {
    const owned = availablePurchases.some(isRemoveAds);
    if (!owned) {
      if (restoreAsk.current) {
        setNotice('missing');
        restoreAsk.current = false;
        setBusy(false);
      }
      return;
    }
    adsRemovedRef.current = true;
    setAdsRemoved(true);
    void saveLicense();
    if (restoreAsk.current) {
      setNotice('restored');
      restoreAsk.current = false;
    }
    setBusy(false);
    for (const purchase of availablePurchases) {
      if (isRemoveAds(purchase)) {
        void finishRef.current(purchase);
      }
    }
  }, [availablePurchases]);

  const buy = () => {
    setNotice(null);
    setBusy(true);
    void requestPurchase({
      request: {
        apple: { sku: REMOVE_ADS_SKU },
        google: { skus: [REMOVE_ADS_SKU] },
      },
      type: 'in-app',
    }).catch((error: unknown) => {
      setBusy(false);
      if (isUserCancelledError(error)) {
        return;
      }
      setNotice('failed');
    });
  };

  const restore = () => {
    setNotice(null);
    setBusy(true);
    restoreAsk.current = true;
    void getAvailablePurchases().catch(() => {
      restoreAsk.current = false;
      setBusy(false);
      setNotice('failed');
    });
  };

  const openWithAd = (screen: ScreenId, go: (screen: ScreenId) => void) => {
    void (async () => {
      if (screen !== 'home' && !adsRemovedRef.current) {
        await showInterstitial();
      }
      go(screen);
    })();
  };

  return (
    <MonetizationContext.Provider
      value={{ adsRemoved, priceLabel, busy, notice, buy, restore, openWithAd }}
    >
      {children}
    </MonetizationContext.Provider>
  );
}
