// Challenge: timed exams, one per subject, one big card at a time. Each card has the
// subject's character on a tinted top, the title and description, how hard it is (the three
// bars), what is in it (chapters, questions, minutes) and where you are with it: first
// attempt, or attempt 2, 3 and the best score so far.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, FontFamilies, Motion, Radii, Space, useReducedMotion } from '../brand';
import { SUBJECTS } from '../data/courses';
import { EXAM_META, EXAM_MINUTES, EXAM_QUESTIONS, SYLLABUS } from '../data/exams';
import { LEVELS } from '../data/levels';
import { usePortal } from '../store/portal';
import { PAGE_TITLE, SUB } from '../theme/type';
import { ArrowRight, BookOpen, ClipboardList, Timer } from '../ui/icons';
import Backdrop from '../ui/Backdrop';
import Explainer, { SubWithLink } from '../ui/Explainer';
import Reveal from '../ui/Reveal';
import Shell from '../ui/Shell';
import Rail from './Rail';
import { fs, lh } from '../theme/fluid';

const firstSentence = (t) => (t || '').split('. ')[0].replace(/\.$/, '') + '.';

const POINTS = [
  { title: 'Timed exams', body: 'Each subject has a 36-question exam against a 45-minute clock, mixed from every exercise type.' },
  { title: 'Like the real thing', body: 'No hints and no feedback until you finish. You can take it again as often as you like, and your best score is kept.' },
  { title: 'What you miss comes back', body: 'Mistakes are added to Revisions as topics to improve on.' },
];

export default function Challenge() {
  const { go, examAttempts } = usePortal();
  const [about, setAbout] = useState(false);
  const header = (
    <View style={styles.header}>
      <Text style={PAGE_TITLE}>Challenge</Text>
      <SubWithLink onPress={() => setAbout(true)}>Timed exams on everything you have learned.</SubWithLink>
    </View>
  );
  return (
    <>
    <Shell active="challenge" rail={<Rail />} railFill header={header}>
      <View style={styles.list}>
        {SUBJECTS.map((s, i) => (
          <Reveal key={s.id} delay={40 + i * 70} y={10}>
            <ExamCard subject={s} attempts={(examAttempts && examAttempts[s.id]) || []} onPress={() => go('examIntro', { subjectId: s.id })} />
          </Reveal>
        ))}
      </View>
    </Shell>
      <Explainer open={about} onClose={() => setAbout(false)} title="How Challenge Works" points={POINTS} />
    </>
  );
}

function ExamCard({ subject, attempts, onPress }) {
  const meta = EXAM_META[subject.id] || EXAM_META.a;
  const reduced = useReducedMotion();
  const lift = useRef(new Animated.Value(0)).current;
  const [bw, setBw] = useState(0);
  // Hovering opens up the lines behind the card.
  const hello = (on) => {
    if (!reduced) Animated.timing(lift, { toValue: on ? 1 : 0, duration: on ? 260 : 200, easing: Motion.ease.out, useNativeDriver: Platform.OS !== 'web' }).start();
  };
  const tone = Colors.accent[meta.cardTone || meta.tone];
  const chapters = (SYLLABUS[subject.id] || []).length;
  const n = attempts.length;
  const best = n ? Math.max(...attempts.map((a) => a.score)) : null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      onHoverIn={() => hello(true)}
      onHoverOut={() => hello(false)}
      onFocus={() => hello(true)}
      onBlur={() => hello(false)}
      accessibilityLabel={`${subject.name}. ${n ? `Attempt ${n + 1}. Best ${best} of ${EXAM_QUESTIONS}.` : 'First attempt.'} ${chapters} chapters, ${EXAM_QUESTIONS} questions, ${EXAM_MINUTES} minutes.`}
      style={({ hovered, pressed }) => [styles.card, hovered && { borderColor: Colors.border.strong }, pressed && { transform: [{ scale: 0.99 }] }]}
    >
      {({ hovered }) => (
        <>
          <View style={[styles.top, { backgroundColor: tone.soft }]} onLayout={(e) => setBw(e.nativeEvent.layout.width)}>
            <Backdrop shape={meta.shape} color={tone.solid} width={bw} height={168} lift={lift} />
            <View style={[styles.attempt, { borderColor: tone.solid }]}>
              <Text style={[styles.attemptText, { color: tone.text }]}>{n ? `Attempt ${n + 1}` : 'First attempt'}</Text>
            </View>
            <View style={styles.level}>
              <Bars level={meta.level} />
              <Text style={styles.levelText}>{LEVELS[meta.level].name}</Text>
            </View>
          </View>

          <View style={styles.body}>
            <Text style={styles.title}>{subject.name}</Text>
            <Text style={styles.desc}>{firstSentence(subject.about)}</Text>

            <View style={styles.facts}>
              <Fact Icon={BookOpen} text={`${chapters} chapters`} />
              <Fact Icon={ClipboardList} text={`${EXAM_QUESTIONS} questions`} />
              <Fact Icon={Timer} text={`${EXAM_MINUTES} minutes`} />
            </View>

            <View style={styles.foot}>
              <Text style={styles.best}>{n ? `Best ${best} of ${EXAM_QUESTIONS}` : 'Not taken yet'}</Text>
              <View style={[styles.go, { backgroundColor: hovered ? tone.solid : tone.soft }]}>
                <ArrowRight size={20} color={hovered ? Colors.ink : tone.text} strokeWidth={2.6} />
              </View>
            </View>
          </View>
        </>
      )}
    </Pressable>
  );
}


function Fact({ Icon, text }) {
  return (
    <View style={styles.fact}>
      <Icon size={20} color={Colors.icon.secondary} strokeWidth={2.2} />
      <Text style={styles.factText}>{text}</Text>
    </View>
  );
}

// Three bars: how many are filled says how demanding it is. The word sits beside them.
function Bars({ level }) {
  return (
    <View style={styles.bars} aria-hidden="true">
      {[1, 2, 3].map((i) => <View key={i} style={[styles.bar, i <= level && { backgroundColor: Colors.accent.orange.solid }]} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: Space[4], alignSelf: 'stretch' },
  list: { gap: Space[32], paddingBottom: Space[16] },
  card: { borderRadius: Radii.card.lg, borderWidth: 2, borderColor: Colors.border.subtle, backgroundColor: Colors.surface.card, overflow: 'hidden', ...Platform.select({ web: { cursor: 'pointer', transitionProperty: 'border-color', transitionDuration: '180ms' } }) },
  top: { height: 168, overflow: 'hidden', paddingHorizontal: Space[24], paddingTop: Space[20], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  attempt: { height: 34, paddingHorizontal: Space[14], justifyContent: 'center', borderRadius: 999, borderWidth: 2, backgroundColor: Colors.surface.card },
  attemptText: { fontFamily: FontFamilies.demi, fontSize: fs(15) },
  level: { flexDirection: 'row', alignItems: 'center', gap: Space[10], height: 34, paddingHorizontal: Space[12], borderRadius: 999, backgroundColor: Colors.surface.card },
  levelText: { fontFamily: FontFamilies.demi, fontSize: fs(15), color: Colors.text.primary },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 16 },
  bar: { width: 6, height: 16, borderRadius: 3, backgroundColor: Colors.border.subtle },
  body: { padding: Space[28], gap: Space[16] },
  title: { fontFamily: FontFamilies.heavy, fontSize: Platform.select({ web: 'clamp(22px, 0.8vw + 17px, 28px)', default: 24 }), lineHeight: Platform.select({ web: 'clamp(28px, 0.9vw + 21px, 34px)', default: 30 }), color: Colors.text.primary },
  desc: { fontFamily: FontFamilies.medium, fontSize: fs(17), lineHeight: lh(26), color: Colors.text.secondary },
  // One fact per line: they stay aligned and never wrap awkwardly on a narrow card.
  facts: { gap: Space[10], marginTop: Space[4] },
  fact: { flexDirection: 'row', alignItems: 'center', gap: Space[8] },
  factText: { fontFamily: FontFamilies.demi, fontSize: fs(15), color: Colors.text.primary },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Space[16], borderTopWidth: 2, borderTopColor: Colors.border.hairline, marginTop: Space[4] },
  best: { fontFamily: FontFamilies.medium, fontSize: fs(16), color: Colors.text.secondary },
  go: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { transitionProperty: 'background-color', transitionDuration: '180ms' } }) },
});
