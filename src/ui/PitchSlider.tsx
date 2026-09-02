import { useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, Platform, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../theme';
import { useScrollLock } from './scrollLock';

type Marker = {
  cents: number;
  color: string;
};

type Props = {
  value: number;
  spanCents: number;
  onChange: (cents: number) => void;
  disabled?: boolean;
  markers?: Marker[];
  lowLabel?: string;
  highLabel?: string;
};

export function PitchSlider({
  value,
  spanCents,
  onChange,
  disabled,
  markers,
  lowLabel = 'Lager',
  highLabel = 'Hoger',
}: Props) {
  const widthRef = useRef(1);
  const originXRef = useRef(0);
  const spanRef = useRef(spanCents);
  const disabledRef = useRef(disabled);
  const onChangeRef = useRef(onChange);
  const trackRef = useRef<View>(null);
  const { lock, unlock } = useScrollLock();
  const lockRef = useRef(lock);
  const unlockRef = useRef(unlock);
  spanRef.current = spanCents;
  disabledRef.current = disabled;
  onChangeRef.current = onChange;
  lockRef.current = lock;
  unlockRef.current = unlock;

  const [trackWidth, setTrackWidth] = useState(1);
  const span = Math.max(1, spanCents);

  const syncTrack = (width?: number) => {
    if (width != null && width > 1) {
      widthRef.current = width;
      setTrackWidth(width);
    }
    trackRef.current?.measureInWindow((x, _y, measuredWidth) => {
      originXRef.current = x;
      if (measuredWidth > 1) {
        widthRef.current = measuredWidth;
        setTrackWidth(measuredWidth);
      }
    });
  };

  const setFromPageX = (pageX: number) => {
    if (disabledRef.current) {
      return;
    }
    const width = Math.max(1, widthRef.current);
    const t = Math.max(0, Math.min(1, (pageX - originXRef.current) / width));
    onChangeRef.current(t * spanRef.current);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onStartShouldSetPanResponderCapture: () => !disabledRef.current,
      onMoveShouldSetPanResponderCapture: () => !disabledRef.current,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (event) => {
        lockRef.current();
        const { locationX, pageX } = event.nativeEvent;
        const width = Math.max(1, widthRef.current);
        if (!disabledRef.current) {
          const t = Math.max(0, Math.min(1, locationX / width));
          onChangeRef.current(t * spanRef.current);
        }
        trackRef.current?.measureInWindow((x, _y, measuredWidth) => {
          originXRef.current = x;
          if (measuredWidth > 1) {
            widthRef.current = measuredWidth;
            setTrackWidth(measuredWidth);
          }
          setFromPageX(pageX);
        });
      },
      onPanResponderMove: (event, gesture) => {
        const pageX = gesture.moveX > 0 ? gesture.moveX : event.nativeEvent.pageX;
        setFromPageX(pageX);
      },
      onPanResponderRelease: () => unlockRef.current(),
      onPanResponderTerminate: () => unlockRef.current(),
    }),
  ).current;

  const onLayout = (event: LayoutChangeEvent) => {
    syncTrack(event.nativeEvent.layout.width);
  };

  const thumbLeft = (value / span) * trackWidth;
  const webHitStyle = Platform.OS === 'web' ? ({ touchAction: 'none', cursor: 'ew-resize' } as object) : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.labels}>
        <Text style={styles.label}>{lowLabel}</Text>
        <Text style={styles.label}>{highLabel}</Text>
      </View>
      <View
        ref={trackRef}
        collapsable={false}
        accessibilityRole="adjustable"
        accessibilityLabel="Toonhoogte"
        accessibilityState={{ disabled: !!disabled }}
        onLayout={onLayout}
        style={[styles.hit, disabled && styles.hitDisabled, webHitStyle]}
        {...pan.panHandlers}
      >
        <View pointerEvents="none" style={styles.track}>
          {markers?.map((marker) => (
            <View
              key={`${marker.color}-${Math.round(marker.cents)}`}
              style={[
                styles.marker,
                {
                  left: (marker.cents / span) * trackWidth,
                  backgroundColor: marker.color,
                },
              ]}
            />
          ))}
        </View>
        <View pointerEvents="none" style={[styles.thumb, { left: thumbLeft }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.hint,
    letterSpacing: 0.6,
  },
  hit: {
    height: 64,
    justifyContent: 'center',
  },
  hitDisabled: {
    opacity: 0.85,
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.cardLine,
  },
  marker: {
    position: 'absolute',
    top: -5,
    width: 4,
    height: 20,
    marginLeft: -2,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 32,
    height: 32,
    marginLeft: -16,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    borderWidth: 2,
    borderColor: COLORS.text,
  },
});
