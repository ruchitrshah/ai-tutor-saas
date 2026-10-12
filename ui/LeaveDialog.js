// "Skip this activity?" A speed bump, not a wall: it asks whether it is really that hard,
// says how many hints are still unused, and offers to use one. The tutor peeks over the
// top edge of the panel (outside it, not inside) with a sad face; the panel is drawn over
// the bottom of the character so it looks like it is leaning on the edge.
//
// "Keep Going" is the big button and takes focus; leaving is the quiet one underneath.
// Escape or a tap on the scrim also means keep going. It arrives in 220ms and leaves in
// 140ms; the tutor rises a beat after the panel.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, FontFamilies, Motion, Radii, Space, useReducedMotion } from '../brand';
import Button from '../components/Button';
import { SUB } from '../theme/type';
import { fs, lh } from '../theme/fluid';

export default function LeaveDialog({ open, hintsLeft, onStay, onHint, onLeave, exam = false }) {
  const reduced = useReducedMotion();
  const native = Platform.OS !== 'web';
  const [mounted, setMounted] = useState(false);
  const v = useRef(new Animated.Value(0)).current;
  const panel = useRef(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.timing(v, { toValue: 1, duration: reduced ? 100 : 220, easing: Motion.ease.out, useNativeDriver: native }).start();
      const t = setTimeout(() => {
        const first = panel.current && panel.current.querySelector && panel.current.querySelector('button');
        if (first) first.focus(); else panel.current && panel.current.focus && panel.current.focus();
      }, 80);
      return () => clearTimeout(t);
    }
    Animated.timing(v, { toValue: 0, duration: reduced ? 80 : 140, easing: Motion.ease.out, useNativeDriver: native }).start();
    const gone = setTimeout(() => setMounted(false), reduced ? 90 : 160);
    return () => clearTimeout(gone);
  }, [open, reduced, v, native]);

  useEffect(() => {
    if (native || !open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onStay(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onStay, native]);

  if (!mounted) return null;

  // One line under the title: what help is left, then what skipping costs.
  const left = hintsLeft;
  const help =
    left < 0
      ? "Quizzes have no hints, but you've got this."
      : left > 0
        ? `You still have ${left} ${left === 1 ? 'hint' : 'hints'} left to get you through.`
        : 'Ask me a question first, I can help you get unstuck.';
  const line = exam ? 'Your time keeps counting only while you are here. Leave now and the exam is saved as unfinished.' : `${help} Skip now and it's saved as unfinished.`;

  return (
    <View style={styles.layer} pointerEvents={open ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.overlay.scrim, opacity: v }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onStay} accessibilityLabel="Keep going" focusable={false} />
      </Animated.View>

      <Animated.View
        style={[styles.stack, { opacity: v, transform: reduced ? [] : [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }] }]}
      >
        <View ref={panel} tabIndex={-1} role="alertdialog" aria-modal="true" aria-label={exam ? "Leave this exam?" : "Skip this activity?"} style={styles.panel}>
          <Text style={styles.title}>{exam ? 'Leave this exam?' : 'Skip this activity?'}</Text>
          <Text style={[SUB, styles.text]}>{line}</Text>
          <View style={styles.actions}>
            <Button title="Keep Going" onPress={onStay} style={styles.full} />
            {!exam && left > 0 ? <Button title={`Use a Hint (${left} left)`} variant="outline" labelColor={Colors.brand.onPrimary} onPress={onHint} style={styles.full} /> : null}
            <Button title={exam ? "Leave Exam" : "Skip Anyway"} variant="ghost" labelColor={Colors.status.danger} onPress={onLeave} style={styles.full} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { ...Platform.select({ web: { position: 'fixed' }, default: { position: 'absolute' } }), top: 0, left: 0, right: 0, bottom: 0, zIndex: 120, alignItems: 'center', justifyContent: 'center', padding: Space[24] },
  stack: { width: '100%', maxWidth: 440, alignItems: 'center' },
  panel: {
    zIndex: 2,
    alignSelf: 'stretch',
    gap: Space[12],
    padding: Space[28],
    backgroundColor: Colors.surface.card,
    borderWidth: 2,
    borderColor: Colors.border.subtle,
    borderRadius: Radii.dialog,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  title: { fontFamily: FontFamilies.demi, fontSize: fs(24), lineHeight: lh(30), color: Colors.text.primary, textAlign: 'center' },
  text: { textAlign: 'center' },
  actions: { gap: Space[8], marginTop: Space[12] },
  full: { alignSelf: 'stretch' },
});
