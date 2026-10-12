// Before the exam, on a white screen split in two. Left: the tutor, the subject, how long it
// is. Right: the curriculum, week by week, on a soft panel. The white bar along the bottom
// is the same one every exercise has and holds the one button; the X at the top left is the
// way out. No sidebar.
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Colors, FontFamilies, Radii, Space } from '../brand';
import Button from '../components/Button';
import { findSubject } from '../data/courses';
import { EXAM_META, EXAM_MINUTES, EXAM_QUESTIONS, SYLLABUS } from '../data/exams';
import { usePortal } from '../store/portal';
import { X } from '../ui/icons';
import { SUBJECT_STYLE } from '../ui/kinds';
import Reveal from '../ui/Reveal';
import { fs, lh } from '../theme/fluid';

const firstSentence = (t) => (t || '').split('. ')[0].replace(/\.$/, '') + '.';

export default function ExamIntro() {
  const { route, go, examAttempts } = usePortal();
  const { width } = useWindowDimensions();
  const subject = findSubject(route.subjectId);
  const weeks = SYLLABUS[subject.id] || [];
  const tries = (examAttempts && examAttempts[subject.id] ? examAttempts[subject.id].length : 0);
  const meta = EXAM_META[subject.id] || EXAM_META.a;
  const accent = Colors.accent[meta.tone];
  const split = width >= 900;
  const phone = width < 640;

  const left = (
    <Reveal y={10} duration={320} style={[styles.left, split ? styles.leftSplit : { paddingHorizontal: phone ? Space[20] : Space[40], paddingBottom: 190 }]}>
      <Text style={styles.title}>{subject.name}</Text>
      <Text style={[styles.facts, { color: accent.text }]}>{EXAM_QUESTIONS} questions · {EXAM_MINUTES} minutes · {tries ? `Attempt ${tries + 1}` : 'First attempt'}</Text>
      <Text style={styles.about}>{firstSentence(subject.about)}</Text>
      <Text style={styles.aside}>Anything you miss goes to Revisions.</Text>
    </Reveal>
  );

  // The left half is plain white: the copy near the centre line, and nothing else.
  const pane = (content, mode) => (
    <View
      style={[styles.pane, mode === 'split' ? styles.paneSplit : styles.paneStacked]}
    >
      {mode === 'split' ? <ScrollView style={styles.paneScroll} contentContainerStyle={styles.colScroll} showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}
    </View>
  );

  const right = (
    <Reveal y={10} delay={80} duration={320} style={[styles.right, split ? styles.rightSplit : { paddingHorizontal: phone ? Space[20] : Space[40] }]}>
      <Text style={styles.coverTitle}>Curriculum</Text>
      <View accessibilityRole="list" aria-label="Curriculum">
        {weeks.map(([chapter, subs], i) => (
          <View key={chapter} style={[styles.week, i > 0 && styles.weekLine]}>
            <View style={[styles.weekNum, { backgroundColor: accent.soft }]}>
              <Text style={[styles.weekNumText, { color: accent.text }]}>{i + 1}</Text>
            </View>
            <View style={styles.weekText}>
              <Text style={styles.chapter} numberOfLines={1}>{chapter}</Text>
              {!phone && <Text style={styles.subs} numberOfLines={1}>{subs}</Text>}
            </View>
          </View>
        ))}
      </View>
    </Reveal>
  );

  return (
    <View style={styles.root}>
      <View style={styles.main}>
        <Pressable onPress={() => go('challenge')} accessibilityRole="button" accessibilityLabel="Close, back to Challenge" style={({ hovered, pressed }) => [styles.close, (hovered || pressed) && { backgroundColor: Colors.surface.raised }]}>
          <X size={22} color={Colors.icon.secondary} strokeWidth={2.4} />
        </Pressable>
        {split ? (
          <View style={styles.cols}>
            {pane(left, 'split')}
            <ScrollView style={styles.colRight} contentContainerStyle={styles.colScroll} showsVerticalScrollIndicator={false}>{right}</ScrollView>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.stack} showsVerticalScrollIndicator={false}>
            {pane(left, 'stacked')}
            <View style={styles.rightStacked}>{right}</View>
          </ScrollView>
        )}
      </View>

      {/* The same bar as inside the exam: white, a hairline above, the action at the right. */}
      <View style={styles.bar}>
        <View style={[styles.barInner, { paddingHorizontal: phone ? Space[16] : Space[40] }]}>
          <Button title="Start Exam" onPress={() => go('exam', { subjectId: subject.id })} style={styles.start} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.page },
  main: { flex: 1, minHeight: 0 },
  close: { position: 'absolute', top: Space[20], left: Space[20], zIndex: 3, width: 44, height: 44, borderRadius: 7, alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { cursor: 'pointer' } }) },
  cols: { flex: 1, flexDirection: 'row' },
  pane: { overflow: 'hidden' },
  paneSplit: { flex: 1 },
  paneStacked: { minHeight: 360 },
  paneScroll: { flex: 1 },
  colRight: { flex: 1, backgroundColor: Colors.surface.raised },
  colScroll: { flexGrow: 1 },
  stack: { paddingTop: Space[72], paddingBottom: Space[24], gap: Space[24] },
  rightStacked: { backgroundColor: Colors.surface.raised, paddingVertical: Space[24] },

  left: { gap: Space[12], paddingTop: Space[72], paddingBottom: Space[32] },
  leftSplit: { alignSelf: 'flex-end', width: '100%', maxWidth: 560, paddingHorizontal: Space[48], paddingTop: Space[72] },
  title: { fontFamily: FontFamilies.heavy, fontSize: Platform.select({ web: 'clamp(30px, 2.2vw + 16px, 46px)', default: 32 }), lineHeight: Platform.select({ web: 'clamp(36px, 2.4vw + 20px, 52px)', default: 38 }), letterSpacing: -0.6, color: Colors.text.primary, marginTop: Space[8] },
  facts: { fontFamily: FontFamilies.demi, fontSize: fs(17), color: Colors.text.accent },
  about: { fontFamily: FontFamilies.medium, fontSize: fs(17), lineHeight: lh(26), color: Colors.text.secondary },
  aside: { fontFamily: FontFamilies.medium, fontSize: fs(16), lineHeight: lh(24), color: Colors.text.muted },

  right: { paddingTop: Space[72], paddingBottom: Space[32] },
  rightSplit: { alignSelf: 'flex-start', width: '100%', maxWidth: 560, paddingHorizontal: Space[48] },
  coverTitle: { fontFamily: FontFamilies.demi, fontSize: fs(15), letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.text.secondary, marginBottom: Space[8] },
  week: { flexDirection: 'row', alignItems: 'center', gap: Space[16], paddingVertical: Space[14] },
  weekLine: { borderTopWidth: 2, borderTopColor: Colors.border.hairline },
  weekNum: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  weekNumText: { fontFamily: FontFamilies.demi, fontSize: fs(16) },
  weekText: { flex: 1, minWidth: 0 },
  chapter: { fontFamily: FontFamilies.demi, fontSize: fs(18), lineHeight: lh(24), color: Colors.text.primary },
  subs: { fontFamily: FontFamilies.medium, fontSize: fs(15), lineHeight: lh(21), color: Colors.text.secondary },

  bar: { backgroundColor: Colors.surface.page, borderTopWidth: 2, borderTopColor: Colors.border.hairline },
  barInner: { width: '100%', maxWidth: 800, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', paddingVertical: Space[12], minHeight: 72 },
  start: { flex: 1 },
});
