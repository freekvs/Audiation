import { StatusBar } from 'expo-status-bar';
import { ReactNode } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { COLORS, CONTENT_MAX_WIDTH } from '../theme';

type Props = {
  children: ReactNode;
  onBack?: () => void;
};

export function AppScreen({ children, onBack }: Props) {
  const { width, height } = useWindowDimensions();
  const compact = width < 380;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.column, compact && styles.columnCompact]}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Terug naar start"
              onPress={onBack}
              style={styles.backButton}
            >
              <Text style={styles.backText}>Naar start</Text>
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
