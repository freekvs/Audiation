import { StatusBar } from 'expo-status-bar';
import { ReactNode, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { useT } from '../i18n';
import { COLORS, CONTENT_MAX_WIDTH } from '../theme';
import { BetaWatermark } from './BetaWatermark';
import { ScrollLockContext } from './scrollLock';

type Props = {
  children: ReactNode;
  onBack?: () => void;
};

export function AppScreen({ children, onBack }: Props) {
  const { width, height } = useWindowDimensions();
  const compact = width < 380;
  const t = useT();
  const lockCount = useRef(0);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const scrollLock = useMemo(
    () => ({
      lock: () => {
        lockCount.current += 1;
        setScrollEnabled(false);
      },
      unlock: () => {
        lockCount.current = Math.max(0, lockCount.current - 1);
        if (lockCount.current === 0) {
          setScrollEnabled(true);
        }
      },
    }),
    [],
  );

  return (
    <ScrollLockContext.Provider value={scrollLock}>
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <BetaWatermark />
      <ScrollView
        scrollEnabled={scrollEnabled}
        nestedScrollEnabled={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.column, compact && styles.columnCompact]}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.common.backA11y}
              onPress={onBack}
              style={styles.backButton}
            >
              <Text style={styles.backText}>{t.common.back}</Text>
            </Pressable>
          ) : null}
          {children}
          {__DEV__ ? (
            <Text style={styles.sizeBadge}>
              {Math.round(width)} × {Math.round(height)} px
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
    </ScrollLockContext.Provider>
  );
}

export function useCompactLayout() {
  const { width, height } = useWindowDimensions();
  return {
    compact: width < 380,
    width,
    height,
  };
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  column: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    gap: 22,
  },
  columnCompact: {
    gap: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  backText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  sizeBadge: {
    fontSize: 12,
    color: COLORS.badge,
    fontVariant: ['tabular-nums'],
  },
});
