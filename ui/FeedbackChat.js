// Tutor feedback: the right rail on the homework screens is a chat about how the student is
// doing. The tutor opens with what it can help with, answers in a few lines from the student's real
// numbers, and always offers the next question to ask.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, FontFamilies, Radii, Space, useReducedMotion } from '../brand';
import { feedbackReply, openingChips } from '../tutor/feedback';
import { usePortal } from '../store/portal';
import TutorAvatar from './TutorAvatar';
import Reveal from '../ui/Reveal';
import { Composer } from '../ui/TutorDock';
import { fs, lh } from '../theme/fluid';

let ids = 0;
const nextId = () => `f${ids++}`;

export default function FeedbackChat() {
  const { go, skills, stats, user } = usePortal();
  const name = 'AI Tutor';
  const reduced = useReducedMotion();
  const first = user.name.split(' ')[0];
  const scroll = useRef(null);
  const timer = useRef(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState(() => [
    { id: nextId(), from: 'tutor', text: `Hi ${first}. I've looked at your homework and practice. Ask me anything about how you're doing.`, chips: openingChips() },
  ]);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const t = setTimeout(() => scroll.current && scroll.current.scrollToEnd({ animated: !reduced }), 60);
    return () => clearTimeout(t);
  }, [messages, busy, reduced]);

  const ask = useCallback((q) => {
    const text = q.trim();
    if (!text || busy) return;
    setDraft('');
    // The suggestions under the last tutor message go away once you answer them.
    setMessages((m) => [...m.map((x) => ({ ...x, chips: null })), { id: nextId(), from: 'me', text }]);
    setBusy(true);
    timer.current = setTimeout(() => {
      const r = feedbackReply(text, { skills, stats, name: first });
      setMessages((m) => [...m, { id: nextId(), from: 'tutor', text: r.text, chips: r.chips }]);
      setBusy(false);
    }, reduced ? 0 : 750);
  }, [busy, skills, stats, first, reduced]);

  const chip = (c) => { if (c.go) { go(c.go); } else ask(c.ask); };

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <View style={styles.who}>
          <TutorAvatar size={44} />
          <View>
            <Text style={styles.whoName}>{name}</Text>
            <Text style={styles.whoSub}>Your progress, in chat</Text>
          </View>
        </View>
      </View>

      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <View style={styles.col}>
          {messages.map((m) => (
            <Reveal key={m.id} y={10} duration={240} style={styles.item}>
              {m.from === 'tutor' ? (
                <View style={styles.tutorRow}>
                  <View style={styles.avatar}><TutorAvatar size={32} /></View>
                  <View style={styles.tutorBubble}><Text style={styles.msg}>{m.text}</Text></View>
                </View>
              ) : (
                <View style={styles.meRow}><View style={styles.meBubble}><Text style={styles.msg}>{m.text}</Text></View></View>
              )}
              {m.chips && m.chips.length ? (
                <View style={styles.chips}>
                  {m.chips.map((c) => (
                    <Pressable key={c.label} onPress={() => chip(c)} accessibilityRole="button" style={({ hovered, pressed }) => [styles.chip, hovered && { backgroundColor: Colors.surface.hover }, pressed && { transform: [{ scale: 0.97 }] }]}>
                      <Text style={styles.chipText}>{c.label}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </Reveal>
          ))}
          {busy ? (
            <View style={[styles.tutorRow, styles.item]}>
              <View style={styles.avatar}><TutorAvatar size={32} /></View>
              <View style={styles.tutorBubble}><Dots /></View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.bar}>
        <Composer value={draft} onChange={setDraft} onSend={(t) => ask(t)} busy={busy} placeholder="Ask about your progress" autoFocus={false} />
      </View>
    </View>
  );
}

// Three dots rising in turn: "thinking".
function Dots() {
  const reduced = useReducedMotion();
  const vals = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (reduced) return undefined;
    const loops = vals.map((v, i) => Animated.loop(Animated.sequence([
      Animated.delay(i * 140),
      Animated.timing(v, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(v, { toValue: 0, duration: 320, easing: Easing.in(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
      Animated.delay(280 - i * 140),
    ])));
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [reduced, vals]);
  return (
    <View style={styles.dots} accessibilityLabel="Your tutor is typing">
      {vals.map((v, i) => <Animated.View key={i} style={[styles.dot, { opacity: reduced ? 0.6 : v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }), transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, backgroundColor: Colors.surface.card },
  top: { flexDirection: 'row', alignItems: 'center', gap: Space[12], paddingHorizontal: Space[20], paddingVertical: Space[16], borderBottomWidth: 2, borderBottomColor: Colors.border.hairline },
  who: { flexDirection: 'row', alignItems: 'center', gap: Space[12] },
  whoName: { fontFamily: FontFamilies.demi, fontSize: fs(17), lineHeight: lh(24), color: Colors.text.primary },
  whoSub: { fontFamily: FontFamilies.medium, fontSize: fs(15), lineHeight: lh(20), color: Colors.text.secondary },
  list: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: Space[16], paddingTop: Space[20], paddingBottom: Space[16] },
  col: { width: '100%', gap: Space[16] },
  item: { gap: Space[12] },
  tutorRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Space[8] },
  avatar: { width: 32, height: 32 },
  tutorBubble: { maxWidth: '84%', flexShrink: 1, paddingHorizontal: Space[16], paddingVertical: Space[12], backgroundColor: Colors.surface.raised, borderWidth: 2, borderColor: Colors.border.subtle, borderRadius: Radii.bubble, borderBottomLeftRadius: 4 },
  meRow: { alignItems: 'flex-end' },
  meBubble: { maxWidth: '84%', paddingHorizontal: Space[16], paddingVertical: Space[12], backgroundColor: Colors.brand.soft, borderWidth: 2, borderColor: Colors.brand.borderSoft, borderRadius: Radii.bubble, borderBottomRightRadius: 4 },
  msg: { fontFamily: FontFamilies.medium, fontSize: fs(16), lineHeight: lh(24), color: Colors.text.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Space[8], paddingLeft: 44 },
  chip: { minHeight: 44, paddingHorizontal: Space[16], justifyContent: 'center', borderRadius: Radii.control.md, borderWidth: 2, borderColor: Colors.border.subtle, backgroundColor: Colors.surface.card },
  chipText: { fontFamily: FontFamilies.demi, fontSize: fs(15), color: Colors.text.action },
  dots: { flexDirection: 'row', gap: 6, height: 24, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.text.secondary },
  // Same footer as the task tutor: hairline above, 12px / 24px around the composer.
  bar: { paddingHorizontal: Space[24], paddingTop: Space[12], paddingBottom: Space[16], borderTopWidth: 1, borderTopColor: Colors.border.hairline },
});
