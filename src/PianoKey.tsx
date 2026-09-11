import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { playHz } from './audio/toneUri';
import { unlockAudio } from './audio/webUnlock';
import { relativeLabel, useNaming } from './naming';
import type { PianoKey } from './notes';

type Props = {
  note: PianoKey;
  highlighted: boolean;
  playToken: number;
  compact: boolean;
  onPlay: () => void;
};

export function PianoKeyButton({
  note,
  highlighted,
  playToken,
  compact,
  onPlay,
}: Props) {
  const { naming } = useNaming();
  const degree = relativeLabel(note, naming);

  useEffect(() => {
    if (playToken <= 0) {
      return;
    }

    void playHz(note.hz, { klank: 'sec' }).catch(() => undefined);
  }, [playToken, note.hz]);

  if (note.color === 'black') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Speel ${degree} ${note.name}`}
        onPress={() => {
          void unlockAudio();
          onPlay();
        }}
        style={[styles.blackKey, highlighted && styles.blackKeyActive]}
      >
        <Text style={[styles.blackLabel, compact && styles.blackLabelCompact]}>
          {naming === 'nashville' ? degree : note.name}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Speel ${degree} ${note.name}`}
      onPress={() => {
        void unlockAudio();
        onPlay();
      }}
      style={[styles.whiteKey, highlighted && styles.whiteKeyActive]}
    >
      <View style={styles.whiteCaption}>
        <Text style={[styles.solfege, compact && styles.solfegeCompact]}>
          {degree}
        </Text>
        <Text style={[styles.whiteName, compact && styles.whiteNameCompact]}>
          {note.name}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  whiteKey: {
    flex: 1,
    backgroundColor: '#F4F1EA',
    borderRightWidth: 1,
    borderRightColor: '#C9C2B6',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 10,
  },
  whiteKeyActive: {
    backgroundColor: '#E07A5F',
  },
  whiteCaption: {
    alignItems: 'center',
    gap: 2,
  },
  solfege: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3D3832',
  },
  solfegeCompact: {
    fontSize: 11,
  },
  whiteName: {
    fontSize: 11,
    color: '#6F6A64',
  },
  whiteNameCompact: {
    fontSize: 10,
  },
  blackKey: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1D1A16',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  blackKeyActive: {
    backgroundColor: '#81B29A',
  },
  blackLabel: {
    fontSize: 10,
    color: '#F4F1EA',
  },
  blackLabelCompact: {
    fontSize: 9,
  },
});
