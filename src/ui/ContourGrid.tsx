import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { COLORS } from '../theme';

type Props = {
  count: number;
  guess: (number | null)[];
  truth: number[] | null;
  playIndex: number | null;
  locked: boolean;
  allHit: boolean;
  onPlace: (col: number, row: number) => void;
};

export function ContourGrid({
  count,
  guess,
  truth,
  playIndex,
  locked,
  allHit,
  onPlace,
}: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const ranks = Array.from({ length: count }, (_, index) => index);
  const cell = count <= 3 ? 56 : count <= 5 ? 48 : 40;
  const guessPoints = pointsFor(guess, count, size);
  const truthPoints = truth ? pointsFor(truth, count, size) : null;

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== size.width || height !== size.height) {
      setSize({ width, height });
    }
  };

  return (
    <View style={styles.gridWrap}>
      <View style={styles.axisCol} accessibilityElementsHidden>
        <Text style={styles.axisText}>hoog</Text>
        <Text style={styles.axisText}>laag</Text>
      </View>
      <View onLayout={onLayout} style={[styles.grid, { height: cell * count }]}>
        {guessPoints ? (
          <ContourLine points={guessPoints} color={allHit ? COLORS.hit : COLORS.accent} />
        ) : null}
        {truthPoints && !allHit ? (
          <ContourLine points={truthPoints} color={COLORS.hit} />
        ) : null}
        <View style={styles.gridCols}>
          {ranks.map((col) => (
            <View key={col} style={styles.gridCol}>
              {ranks.map((rowFromTop) => {
                const row = count - 1 - rowFromTop;
                const selected = guess[col] === row;
                const truthHere = truth?.[col] === row;
                const playing = playIndex === col;
                return (
                  <Pressable
                    key={row}
                    accessibilityRole="button"
                    accessibilityLabel={`Toon ${col + 1}, hoogte ${row + 1} van ${count}`}
                    accessibilityState={{ selected, disabled: locked }}
                    disabled={locked}
                    onPress={() => onPlace(col, row)}
                    style={({ pressed }) => [
                      styles.cell,
                      playing && styles.cellPlaying,
                      selected && styles.cellSelected,
                      truthHere && !allHit && styles.cellTruth,
                      selected && allHit && styles.cellHit,
                      pressed && !locked && styles.pressed,
                    ]}
                  >
                    {selected ? <View style={styles.dot} /> : null}
                    {truthHere && !selected && !allHit ? (
                      <View style={[styles.dot, styles.dotTruth]} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function pointsFor(
  values: (number | null)[],
  count: number,
  size: { width: number; height: number },
): { x: number; y: number }[] | null {
  if (size.width <= 0 || size.height <= 0) {
    return null;
  }
  if (values.some((value) => value == null)) {
    return null;
  }
  return values.map((rank, col) => ({
    x: ((col + 0.5) * size.width) / count,
    y: size.height - (((rank ?? 0) + 0.5) * size.height) / count,
  }));
}

function ContourLine({
  points,
  color,
}: {
  points: { x: number; y: number }[];
  color: string;
}) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {points.slice(0, -1).map((start, index) => {
        const end = points[index + 1]!;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.hypot(dx, dy);
        const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <View
            key={index}
            style={[
              styles.line,
              {
                left: (start.x + end.x) / 2 - length / 2,
                top: (start.y + end.y) / 2 - 1.5,
                width: length,
                backgroundColor: color,
                transform: [{ rotate: `${deg}deg` }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  gridWrap: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  axisCol: {
    width: 36,
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  axisText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.hint,
  },
  grid: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardLine,
    overflow: 'hidden',
  },
  gridCols: {
    flex: 1,
    flexDirection: 'row',
  },
  gridCol: {
    flex: 1,
    flexDirection: 'column',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardLine,
  },
  cellPlaying: {
    backgroundColor: 'rgba(224, 122, 95, 0.22)',
  },
  cellSelected: {
    backgroundColor: 'rgba(224, 122, 95, 0.18)',
  },
  cellTruth: {
    borderColor: COLORS.hit,
  },
  cellHit: {
    backgroundColor: 'rgba(129, 178, 154, 0.28)',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.accent,
  },
  dotTruth: {
    backgroundColor: COLORS.hit,
  },
  line: {
    position: 'absolute',
    height: 3,
    borderRadius: 2,
  },
  pressed: {
    opacity: 0.88,
  },
});
