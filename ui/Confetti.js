// A one-shot burst of coloured dots. For rare moments only (finishing a task).
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { Colors, useReducedMotion } from '../brand';

const ORDER = ['blue', 'orange', 'green', 'purple', 'pink', 'yellow', 'teal'];

export default function Confetti({ count = 14, radius = 96, delay = 120 }) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + (i % 2) * 0.2;
        const r = radius * (0.7 + ((i * 37) % 30) / 100);
        return { x: Math.cos(angle) * r, y: Math.sin(angle) * r, size: 6 + (i % 3) * 2, color: Colors.accent[ORDER[i % ORDER.length]].solid };
      }),
    [count, radius]
  );
  useEffect(() => {
    if (reduced) return;
    Animated.timing(v, { toValue: 1, duration: 900, delay, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }).start();
  }, [reduced, v, delay]);
  if (reduced) return null;
  return (
    <View pointerEvents="none" style={styles.layer}>
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: d.size,
            height: d.size,
            borderRadius: d.size / 2,
            backgroundColor: d.color,
            opacity: v.interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, d.x] }) },
              { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, d.y + 14] }) },
              { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ layer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' } });
