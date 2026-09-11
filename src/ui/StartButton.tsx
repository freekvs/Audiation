import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { unlockAudio, useAudioReady } from '../audio/webUnlock';
import { useT } from '../i18n';
import { COLORS } from '../theme';

type StartProps = {
  accessibilityLabel: string;
  label: string;
  onPress: () => void;
  pressedStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function AudioReadyLamp({ announce = false }: { announce?: boolean }) {
  const ready = useAudioReady();
  const t = useT();
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={ready ? t.common.audioReadyA11y : t.common.audioWaitA11y}
      accessibilityLiveRegion={announce ? 'polite' : 'none'}
      style={[styles.lamp, ready ? styles.lampReady : styles.lampWait]}
    />
  );
}

export function StartButton({
  accessibilityLabel,
  label,
  onPress,
  pressedStyle,
  style,
  textStyle,
}: StartProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        void unlockAudio();
        onPress();
      }}
      style={({ pressed }) => [style, pressed && pressedStyle]}
    >
      <View style={styles.row}>
        <AudioReadyLamp />
        <Text style={textStyle}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  lamp: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  lampReady: {
    backgroundColor: COLORS.hit,
  },
  lampWait: {
    backgroundColor: COLORS.lampWait,
  },
});
