// Course details, as a modal. It opens over whatever you are looking at (the
// homework list or a course's path), so you never leave your place. It is short on
// purpose: what the course is, and who runs it. The panel
// scrolls inside itself; the page behind stays put.
//
// Motion: the scrim fades in, the panel rises and settles (ease-out, 200ms). It
// leaves faster than it arrives (140ms). Escape, the X and a click outside all
// close it; focus moves into the dialog on open and back on close.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CONTROL, Colors, FontFamilies, Motion, Radii, Space, useReducedMotion } from '../brand';
import { findSubject } from '../data/courses';
import { usePortal } from '../store/portal';
import { SUB, TITLE } from '../theme/type';
import { X } from '../ui/icons';
import { fs } from '../theme/fluid';

export function DetailsModal() {
  const { detailsId, closeDetails } = usePortal();
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(null); // keeps content mounted while it animates out
  const v = useRef(new Animated.Value(0)).current;
  const panelRef = useRef(null);
  const opener = useRef(null);

  useEffect(() => {
    if (detailsId) {
      if (Platform.OS === 'web') opener.current = document.activeElement;
      setShown(detailsId);
      Animated.timing(v, { toValue: 1, duration: reduced ? 120 : 220, easing: Motion.ease.out, useNativeDriver: Platform.OS !== 'web' }).start();
      const t = setTimeout(() => panelRef.current?.focus?.(), 60);
      return () => clearTimeout(t);
    }
    Animated.timing(v, { toValue: 0, duration: reduced ? 100 : 140, easing: Motion.ease.out, useNativeDriver: Platform.OS !== 'web' }).start();
    // Unmount on a timer, not the animation callback: animation frames pause in
    // background tabs, and a modal must never stay mounted because of that.
    const gone = setTimeout(() => setShown(null), reduced ? 100 : 150);
    try { opener.current?.focus?.(); } catch (e) { /* noop */ }
    return () => clearTimeout(gone);
  }, [detailsId, reduced, v]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !detailsId) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeDetails(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [detailsId, closeDetails]);

  const s = findSubject(shown);
  if (!s) return null;

  const initials = s.faculty.name.replace(/^(Prof\.|Dr\.)\s*/, '').split(' ').map((w) => w[0]).join('');

  return (
    <View style={styles.layer} pointerEvents={detailsId ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: v }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeDetails} accessibilityLabel="Close course details" />
      </Animated.View>

      <Animated.View
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`${s.name} course details`}
        style={[
          styles.panel,
          {
            opacity: v,
            transform: reduced ? [] : [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }],
          },
        ]}
      >
        <View style={styles.head}>
          <View style={{ flex: 1, gap: Space[2] }}>
            <Text style={TITLE} numberOfLines={1}>{s.name}</Text>
            <Text style={SUB}>{s.code} · {s.format}</Text>
          </View>
          <Pressable
            onPress={closeDetails}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={({ hovered, pressed }) => [styles.close, (hovered || pressed) && { backgroundColor: Colors.surface.raised }]}
          >
            <X size={20} color={Colors.icon.secondary} />
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <Section title="About this course">
            <Text style={SUB}>{s.about}</Text>
          </Section>

          <Section title="Who runs it" last>
            <View style={styles.person}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={TITLE}>{s.faculty.name}</Text>
                <Text style={SUB}>{s.faculty.role}</Text>
              </View>
            </View>
            <Text style={SUB}>Faculty set the material, the syllabus week and the integrity rules for this course.</Text>
          </Section>

        </ScrollView>
      </Animated.View>
    </View>
  );
}

// A section: title, content below, a hairline after (except the last).
function Section({ title, last, children }) {
  return (
    <View style={[styles.section, !last && styles.divider]}>
      <View style={styles.sectionHead}>
        <Text style={TITLE}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { ...Platform.select({ web: { position: 'fixed' }, default: { position: 'absolute' } }), top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, alignItems: 'center', justifyContent: 'center', padding: Space[24] },
  scrim: { backgroundColor: Colors.overlay.scrim },
  panel: {
    width: '100%',
    maxWidth: 640,
    maxHeight: '88%',
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.border.hairline,
    borderRadius: Radii.card.default,
    overflow: 'hidden',
    ...Platform.select({ web: { outlineStyle: 'none' } }),
    shadowColor: Colors.shadow.color,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.3,
    shadowRadius: 48,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: Space[16], paddingHorizontal: Space[28], paddingVertical: Space[20], borderBottomWidth: 1, borderBottomColor: Colors.border.hairline },
  close: { width: CONTROL, height: CONTROL, borderRadius: Radii.option, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 0 },
  body: { paddingHorizontal: Space[28], paddingBottom: Space[16] },
  section: { gap: Space[16], paddingVertical: Space[28] },
  divider: { borderBottomWidth: 1, borderBottomColor: Colors.border.hairline },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: Space[8] },
  person: { flexDirection: 'row', alignItems: 'center', gap: Space[16] },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.brand.soft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FontFamilies.demi, fontSize: fs(16), color: Colors.text.accent },
});
