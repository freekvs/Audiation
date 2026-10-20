import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { fmt, useT } from '../i18n';
import { useMonetization, type AdsNotice } from '../monetization/context';
import { COLORS } from '../theme';

function noticeText(notice: AdsNotice, t: ReturnType<typeof useT>): string {
  if (notice === 'pending') {
    return t.ads.pending;
  }
  if (notice === 'missing') {
    return t.ads.missing;
  }
  if (notice === 'failed') {
    return t.ads.failed;
  }
  if (notice === 'restored') {
    return t.ads.restored;
  }
  return t.ads.thanks;
}

export function RemoveAdsCard() {
  const t = useT();
  const { adsRemoved, priceLabel, busy, notice, buy, restore } = useMonetization();

  if (Platform.OS === 'web') {
    return null;
  }

  if (adsRemoved) {
    return (
      <View style={[styles.card, styles.cardOwned]}>
        <Text style={styles.title}>{t.ads.ownedTitle}</Text>
        <Text style={styles.body}>{notice === 'thanks' || notice === 'restored' ? noticeText(notice, t) : t.ads.ownedBody}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t.ads.title}</Text>
      <Text style={styles.body}>{t.ads.body}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={fmt(t.ads.buyA11y, { price: priceLabel })}
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        onPress={buy}
        style={({ pressed }) => [styles.buy, busy && styles.busy, pressed && styles.pressed]}
      >
        <Text style={styles.buyText}>{fmt(t.ads.buy, { price: priceLabel })}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.ads.restoreA11y}
        disabled={busy}
        onPress={restore}
        style={({ pressed }) => [styles.restore, pressed && styles.pressed]}
      >
        <Text style={styles.restoreText}>{t.ads.restore}</Text>
      </Pressable>
      {notice ? <Text style={styles.notice}>{noticeText(notice, t)}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.accent,
    gap: 12,
  },
  cardOwned: {
    borderColor: COLORS.hit,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.muted,
  },
  buy: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buyText: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  restore: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreText: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  notice: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.close,
  },
  busy: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.88,
  },
});
