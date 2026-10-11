// Section tabs: equal-width segments that fill their container, with one indicator that
// slides to the chosen tab (220ms, ease-out). 48px tall like every control. Left / Right
// arrows move between tabs; the chosen tab is the only one in the tab order.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { CONTROL, Colors, FontFamilies, Motion, Radii, Space, useReducedMotion } from '../brand';
import { fs } from '../theme/fluid';

export default function SegmentedTabs({ tabs, value, onChange, label }) {
  const reduced = useReducedMotion();
  const [w, setW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const idx = Math.max(0, tabs.findIndex((t) => t.key === value));
  const seg = w ? (w - PAD * 2) / tabs.length : 0;
  const placed = useRef(false);

  useEffect(() => {
    if (!seg) return;
    if (!placed.current || reduced) { x.setValue(idx * seg); placed.current = true; return; }
    Animated.timing(x, { toValue: idx * seg, duration: 220, easing: Motion.ease.out, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [idx, seg, reduced, x]);

  const onKey = (e) => {
    const k = e.nativeEvent ? e.nativeEvent.key : e.key;
    if (k !== 'ArrowRight' && k !== 'ArrowLeft') return;
    e.preventDefault && e.preventDefault();
    const next = (idx + (k === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    onChange(tabs[next].key);
  };

  return (
    <View style={styles.bar} role="tablist" aria-label={label} onLayout={(e) => setW(e.nativeEvent.layout.width)} onKeyDown={onKey}>
      {seg > 0 && <Animated.View pointerEvents="none" style={[styles.pill, { width: seg, transform: [{ translateX: x }] }]} />}
      {tabs.map((t) => {
        const on = t.key === value;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            style={({ hovered, pressed }) => [styles.tab, !on && hovered && { backgroundColor: Colors.surface.hover }, pressed && { transform: [{ scale: 0.98 }] }]}
          >
            <View style={styles.tabInner}>
              {t.leading || null}
              <Text style={[styles.text, on && { color: Colors.text.accent }]} numberOfLines={1}>{t.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const PAD = 4;
const styles = StyleSheet.create({
  bar: { alignSelf: 'stretch', flexDirection: 'row', padding: PAD, borderRadius: Radii.card.default, backgroundColor: Colors.surface.raised },
  pill: { position: 'absolute', left: PAD, top: PAD, bottom: PAD, borderRadius: Radii.control.md, backgroundColor: Colors.surface.card, borderWidth: 2, borderColor: Colors.brand.primary },
  tab: { flex: 1, minHeight: CONTROL - PAD, alignItems: 'center', justifyContent: 'center', borderRadius: Radii.control.md, paddingHorizontal: Space[8] },
  tabInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Space[8], minWidth: 0 },
  text: { fontFamily: FontFamilies.demi, fontSize: fs(16), color: Colors.text.secondary },
});
