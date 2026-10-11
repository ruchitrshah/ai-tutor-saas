// Homework: one card per subject. Top to bottom, a card says what it is, how far
// along you are, what the next task is, and what you can do:
//   Continue   → start the next task        (the one primary action)
//   All tasks  → the course's path          (secondary)
//   ⓘ          → course details, a modal    (icon-only, top right)
// The due date sits at the bottom, where the deadline matters, The info button is the only other icon on the card.
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { ColorUtils, Colors, Radii, Space } from '../brand';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import { SUBJECTS, subjectProgress, usePortal } from '../store/portal';
import { PAGE_TITLE, SUB, TITLE } from '../theme/type';
import { ArrowRight, Info } from '../ui/icons';
import DueTag from '../ui/DueTag';
import { SUBJECT_STYLE } from '../ui/kinds';
import LottieBurst from '../ui/LottieBurst';
import Reveal from '../ui/Reveal';
import Shell, { cardBox } from '../ui/Shell';
import Rail from './Rail';

export default function Homework() {
  const { user, done } = usePortal();
  const pending = SUBJECTS.filter((s) => !subjectProgress(s, done).complete).length;

  // The title stays put; the cards scroll underneath it.
  const header = (
    <View style={styles.header}>
      <Text style={PAGE_TITLE}>Homework</Text>
      <Text style={SUB}>
        Good to see you, {user.name.split(' ')[0]}. {pending} {pending === 1 ? 'subject has' : 'subjects have'} work due this week.
      </Text>
    </View>
  );

  return (
    <Shell active="homework" rail={<Rail />} railFill header={header}>
      <View style={styles.list}>
        {SUBJECTS.map((s, i) => (
          <Reveal key={s.id} delay={60 + i * 55}>
            <SubjectCard subject={s} />
          </Reveal>
        ))}
      </View>
    </Shell>
  );
}

function SubjectCard({ subject: s }) {
  const { go, done, openDetails } = usePortal();
  const p = subjectProgress(s, done);
  const accent = Colors.accent[SUBJECT_STYLE[s.id].accent];
  const phone = useWindowDimensions().width < 600;
  const [launching, setLaunching] = useState(false);
  const [hover, setHover] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const info = (
    <Pressable
      onPress={() => openDetails(s.id)}
      accessibilityRole="button"
      accessibilityLabel={`Course details for ${s.name}`}
      style={({ hovered, pressed }) => [styles.info, phone && styles.infoTop, (hovered || pressed) && { backgroundColor: Colors.surface.raised }]}
    >
      <Info size={20} strokeWidth={2} color={Colors.icon.secondary} />
    </Pressable>
  );

  const path = () => go('subject', { subjectId: s.id });

  // The button confirms the tap in place, then the screen follows: 170ms is long
  // enough to read as a response, short enough not to feel like waiting.
  const start = () => {
    if (launching) return;
    setLaunching(true);
    timer.current = setTimeout(() => go('task', { subjectId: s.id, taskId: p.next.id }), 170);
  };

  return (
    <Pressable
      accessible={false}
      focusable={false}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={[
        styles.card,
        Platform.select({ web: { transitionProperty: 'border-color', transitionDuration: '220ms', transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' } }),
        // Hover: no movement. A soft light in the subject's colour and one Lottie burst.
        hover && { borderColor: ColorUtils.rgba(accent.solid, 0.6) },
      ]}
    >
      <LottieBurst play={hover} colors={[accent.solid, accent.text, '#FFFFFF']} />
      {/* Phone: the deadline and the info button share the top row; the name follows. */}
      {phone ? (
        <View style={styles.topRow}>
          <DueTag subject={s} />
          {info}
        </View>
      ) : null}
      <View style={styles.top}>
        <View style={{ flex: 1, gap: Space[2] }}>
          <Text style={TITLE}>{s.name}</Text>
          <Text style={SUB}>{s.code} · Week {s.week} homework</Text>
        </View>
        {phone ? null : info}
      </View>

      <ProgressBar currentStep={p.count} totalSteps={p.total} sparkle={false} shine height={16} gap={p.total > 10 ? 3 : 6} fillColor={accent.solid} />

      {p.next ? (
        <View style={styles.next}>
          <Text style={TITLE} numberOfLines={1}>{p.next.title}</Text>
          <Text style={SUB} numberOfLines={2}>{p.next.sub}</Text>
        </View>
      ) : (
        <View style={styles.next}>
          <Text style={TITLE}>All tasks done</Text>
          <Text style={SUB}>Open the course to review any task.</Text>
        </View>
      )}

      <View style={[styles.footer, phone && styles.footerPhone]}>
        {p.next ? (
          <Button title={p.count === 0 ? 'Start' : 'Continue'} onPress={start} success={launching} SuccessIcon={ArrowRight} style={phone ? styles.btnFull : styles.btn} />
        ) : null}
        <Button title="All tasks" variant="outline" onPress={path} style={phone ? styles.btnFull : styles.btn} />
        {phone ? null : <DueTag subject={s} style={styles.due} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { gap: Space[4], alignSelf: 'stretch' },
  list: { gap: Space[24] },
  card: { ...cardBox, padding: Space[24], gap: Space[20] },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: Space[16] },
  info: { width: 44, height: 44, marginTop: -Space[8], marginRight: -Space[10], borderRadius: Radii.control.md, alignItems: 'center', justifyContent: 'center' },

  // The emphasis: the next task, one step lighter than the card. No border, no
  // colour: a layer, not a box. Text only.
  next: { gap: Space[2], padding: Space[16], borderRadius: Radii.card.default, backgroundColor: Colors.surface.raised },

  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: Space[12], rowGap: Space[12] },
  btn: { minWidth: 128 },
  btnFull: { alignSelf: 'stretch', width: '100%' },
  footerPhone: { flexDirection: 'column', alignItems: 'stretch' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 36 },
  // Centred on the 36px due pill; pulled in so the icon lines up with the card's padding.
  infoTop: { marginTop: 0, marginVertical: -Space[4] },
  due: { marginLeft: 'auto' },
});
