import { useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import type { PianoKey } from './notes';
import { PianoKeyButton } from './PianoKey';

type Props = {
  compact: boolean;
  height: number;
  whiteKeys: PianoKey[];
  blackKeys: PianoKey[];
  showScaleButton?: boolean;
  onSelect?: (note: PianoKey) => void;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function PianoKeyboard({
  compact,
  height,
  whiteKeys,
  blackKeys,
  showScaleButton = true,
  onSelect,
}: Props) {
  const [rowWidth, setRowWidth] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tokens, setTokens] = useState<Partial<Record<string, number>>>({});
  const [playingScale, setPlayingScale] = useState(false);
  const scaleLock = useRef(false);

  const playNote = (id: string) => {
    setActiveId(id);
    setTokens((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
    const note = whiteKeys.find((item) => item.id === id) ?? blackKeys.find((item) => item.id === id);
    if (note) {
      onSelect?.(note);
    }
  };

  const playScale = async () => {
    if (scaleLock.current) {
      return;
    }

    scaleLock.current = true;
    setPlayingScale(true);

    for (const note of whiteKeys) {
      playNote(note.id);
      await delay(460);
    }

    setActiveId(null);
    setPlayingScale(false);
    scaleLock.current = false;
  };

  const onLayout = (event: LayoutChangeEvent) => {
    setRowWidth(event.nativeEvent.layout.width);
  };

  const whiteWidth = rowWidth / whiteKeys.length;
  const blackWidth = whiteWidth * 0.58;
  const blackHeight = height * 0.58;

  return (
    <View style={styles.wrap}>
      <View style={[styles.keyboard, { height }]} onLayout={onLayout}>
        <View style={styles.whiteRow}>
          {whiteKeys.map((note) => (
            <PianoKeyButton
              key={note.id}
              note={note}
              compact={compact}
              highlighted={activeId === note.id}
              playToken={tokens[note.id] ?? 0}
              onPlay={() => playNote(note.id)}
            />
          ))}
        </View>

        {rowWidth > 0
          ? blackKeys.map((note) => {
              const afterWhiteIndex = note.afterWhiteIndex ?? 0;
              const left = (afterWhiteIndex + 1) * whiteWidth - blackWidth / 2;
              return (
                <View
                  key={note.id}
                  pointerEvents="box-none"
                  style={[
                    styles.blackSlot,
                    {
                      left,
                      width: blackWidth,
                      height: blackHeight,
                    },
                  ]}
                >
                  <PianoKeyButton
                    note={note}
                    compact={compact}
                    highlighted={activeId === note.id}
                    playToken={tokens[note.id] ?? 0}
                    onPlay={() => playNote(note.id)}
                  />
                </View>
              );
            })
          : null}
      </View>

      {showScaleButton ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Speel C-majeur toonladder"
          onPress={() => {
            void playScale();
          }}
          disabled={playingScale}
          style={[styles.scaleButton, playingScale && styles.scaleButtonDisabled]}
        >
          <Text style={styles.scaleButtonText}>
            {playingScale ? 'Speelt C-majeur…' : 'Speel toonladder'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  keyboard: {
    position: 'relative',
    backgroundColor: '#2A2622',
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  whiteRow: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
  },
  blackSlot: {
    position: 'absolute',
    top: 0,
    zIndex: 2,
  },
  scaleButton: {
    backgroundColor: '#E07A5F',
    borderRadius: 16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  scaleButtonDisabled: {
    opacity: 0.7,
  },
  scaleButtonText: {
    color: '#1D1A16',
    fontSize: 16,
    fontWeight: '700',
  },
});
