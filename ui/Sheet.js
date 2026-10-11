// A modal sheet: a scrim, a panel that rises and settles, a title row with a close
// button, and a scrolling body (the page behind stays put).
//
// Motion: the scrim fades in, the panel rises 12px and eases up from 97% (ease-out,
// 220ms). It leaves faster than it arrives (140ms). Escape, the X and a click outside
// all close it; focus moves into the dialog on open and back to the opener on close.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

// On web the sheet is drawn straight into <body>: a parent with a transform (like the animated
// rail) would otherwise become the "screen" that position: fixed measures against.
const createPortal = Platform.OS === 'web' ? require('react-dom').createPortal : null;

import { CONTROL, Colors, Motion, Radii, Space, useReducedMotion } from '../brand';
import { TITLE } from '../theme/type';
import { X } from './icons';

// `tall` makes it a near full-height page-style modal (edge to edge on a phone); `fill` is
// the same but for content that scrolls itself (a chat).
export default function Sheet({ open, onClose, title, width = 640, tall = false, fill = false, children }) {
  const phone = useWindowDimensions().width < 640;
  const full = tall || fill;
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false); // stays true while it animates out
  const v = useRef(new Animated.Value(0)).current;
  const panel = useRef(null);
  const opener = useRef(null);
  const native = Platform.OS !== 'web';

  useEffect(() => {
    if (open) {
      if (!native) opener.current = document.activeElement;
      setMounted(true);
      Animated.timing(v, { toValue: 1, duration: reduced ? 120 : 220, easing: Motion.ease.out, useNativeDriver: native }).start();
      const t = setTimeout(() => panel.current?.focus?.(), 60);
      return () => clearTimeout(t);
    }
    Animated.timing(v, { toValue: 0, duration: reduced ? 100 : 140, easing: Motion.ease.out, useNativeDriver: native }).start();
    // Unmount on a timer, not on the animation callback: animation frames are paused
    // in background tabs, and a modal must never stay mounted because of that.
    const gone = setTimeout(() => setMounted(false), reduced ? 100 : 150);
    try { opener.current?.focus?.(); } catch (e) { /* noop */ }
    return () => clearTimeout(gone);
  }, [open, reduced, v, native]);

  useEffect(() => {
    if (native || !open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, native]);

  if (!mounted) return null;
  const layer = (
    <View style={[styles.layer, full && phone && { padding: 0 }]} pointerEvents={open ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.overlay.scrim, opacity: v }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={[
          styles.panel,
          full && { height: phone ? '100%' : '88%' },
          full && phone && { maxHeight: '100%', borderRadius: 0, borderWidth: 0 },
          { maxWidth: width, opacity: v, transform: reduced ? [] : [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }] },
        ]}
      >
        <View style={[styles.head, phone && { paddingLeft: Space[20], paddingRight: Space[8] }]}>
          <Text style={[TITLE, { flex: 1 }]}>{title}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={({ hovered, pressed }) => [styles.close, (hovered || pressed) && { backgroundColor: Colors.surface.raised }]}>
            <X size={22} color={Colors.icon.secondary} />
          </Pressable>
        </View>
        {fill ? (
          <View style={styles.fill}>{children}</View>
        ) : (
          <ScrollView style={full ? styles.fill : styles.scroll} contentContainerStyle={[styles.body, phone && { paddingHorizontal: Space[16], paddingVertical: Space[20] }]} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
  return createPortal ? createPortal(layer, document.body) : layer;
}

const styles = StyleSheet.create({
  layer: { ...Platform.select({ web: { position: 'fixed' }, default: { position: 'absolute' } }), top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, alignItems: 'center', justifyContent: 'center', padding: Space[24] },
  panel: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: Colors.surface.card,
    borderWidth: 2,
    borderColor: Colors.border.subtle,
    borderRadius: Radii.dialog,
    overflow: 'hidden',
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: Space[16], paddingLeft: Space[28], paddingRight: Space[16], paddingVertical: Space[16], borderBottomWidth: 2, borderBottomColor: Colors.border.hairline },
  close: { width: CONTROL, height: CONTROL, borderRadius: Radii.control.md, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 0 },
  fill: { flex: 1, minHeight: 0 },
  body: { paddingHorizontal: Space[28], paddingVertical: Space[24], gap: Space[24] },
});
