// Practice: every kind of exercise the tutor can run, one card each. Cards for modules
// that exist today play a real session (it uses the same player as homework, but is a
// free session: it returns here and does not touch homework progress). Cards for
// modules still to build open a short sheet describing them.
//
// Same frame as Homework: sticky title, rail on the right, no decorative icons.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { ColorUtils, Colors, FontFamilies, Motion, Radii, Space, useReducedMotion } from '../brand';
import { MODULE_GROUPS } from '../data/modules';
import { usePortal } from '../store/portal';
import { H2, PAGE_TITLE, SUB, TITLE } from '../theme/type';
import { ArrowRight, Briefcase, CheckCheck, ClipboardCheck, ClipboardList, Code, Dumbbell, Mic, PenLine, Repeat, Target, Type, X } from '../ui/icons';
import Reveal from '../ui/Reveal';
import Shell from '../ui/Shell';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../components/Button';
import Dropdown from '../ui/Dropdown';
import Explainer, { SubWithLink } from '../ui/Explainer';
import GradientCard, { ACCENTS } from '../ui/GradientCard';
import { CHALLENGES, LEVELS } from '../data/levels';
import Rail from './Rail';
import { fs, lh } from '../theme/fluid';


const POINTS = [
  { title: 'Pick a level', body: 'Warm Up, Stretch or Challenge sets how many hints you get and how much your tutor tells.' },
  { title: 'Choose an exercise', body: 'Multiple choice, speaking, writing, code and more. Short, and you can repeat them as often as you like.' },
  { title: 'Mistakes are kept', body: 'Anything you miss goes to Revisions. Practice never changes your homework progress.' },
];

export default function Practice() {
  const { go } = usePortal();
  const [open, setOpen] = useState(null); // module shown in the sheet
  // Only the modules that are built and working. The backlog groups stay in data/modules.js.
  const group = MODULE_GROUPS.find((g) => g.visible !== false) || MODULE_GROUPS[0];

  const [about, setAbout] = useState(false);
  const [gridW, setGridW] = useState(0);
  const cell = { flexBasis: gridW >= 560 ? '48.5%' : '100%', flexGrow: 1, minWidth: 0 };
  const [level, setLevel] = useState(1); // 1 Warm Up · 2 Stretch · 3 Challenge: applies to every module
  const levelOptions = [1, 2, 3].map((n) => ({ key: n, label: LEVELS[n].name, leading: <LevelBars level={n} />, hint: `${n === 1 ? 'Three' : n === 2 ? 'Two' : 'One'} ${n === 3 ? 'hint' : 'hints'}` }));

  const header = (
    <View style={styles.header}>
      <View style={styles.headText}>
        <Text style={PAGE_TITLE}>Practice</Text>
        <SubWithLink onPress={() => setAbout(true)}>{LEVELS[level].blurb}</SubWithLink>
      </View>
      <Dropdown label="Level" value={level} options={levelOptions} onChange={setLevel} menuWidth={260} />
    </View>
  );

  const choose = (m) => {
    if (m.play) go('task', { ...m.play, from: 'practice' });
    else setOpen(m);
  };

  const sets = CHALLENGES.filter((c) => c.level === level);
  const modules = group.modules;
  const playAt = (p) => go('task', { ...p, from: 'practice', level });

  return (
    <>
    <Shell active="practice" rail={<Rail />} railFill header={header}>
      <Reveal delay={20} y={8}>
        <UploadHero onPress={() => go('uploads')} />
      </Reveal>

      {/* One level for everything below: how many hints, how much the tutor tells. */}
      <View style={styles.section}>
        <View style={styles.levelRow}>
          <View style={styles.levelText}>
            <Text style={H2}>Exercises</Text>
            <Text style={SUB}>{group.sub}</Text>
          </View>
        </View>
        <View key={level} style={styles.grid} onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
          {modules.map((m, i) => (
            <Reveal key={m.id} delay={30 + i * 40} y={8} style={cell}>
              <ExerciseCard Icon={ICON[m.id] || Dumbbell} accent={ACCENTS[i % ACCENTS.length]} title={m.name} text={m.does} onPress={() => (m.play ? playAt(m.play) : setOpen(m))} />
            </Reveal>
          ))}
          {group.key === 'built' && sets.map((c, i) => (
            <Reveal key={c.id} delay={30 + (modules.length + i) * 40} y={8} style={cell}>
              <ExerciseCard Icon={Target} accent={ACCENTS[(level + i + 2) % ACCENTS.length]} title={c.title} text={c.text} onPress={() => playAt(c.play)} />
            </Reveal>
          ))}
        </View>
      </View>
    </Shell>
      <ModuleSheet m={open} onClose={() => setOpen(null)} />
      <Explainer open={about} onClose={() => setAbout(false)} title="How Practice Works" points={POINTS} />
    </>
  );
}

// The big card at the top: bring your own material. A deep teal → blue → violet field,
// and faint target rings.
function UploadHero({ onPress }) {
  const { width } = useWindowDimensions();
  const [w, setW] = useState(0);
  const small = (w || width) < 560;
  const copyMax = small ? undefined : 560;
  return (
    <LinearGradient
      colors={['#0A4F82', '#0B78BC']}
      locations={[0, 1]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={[styles.hero, small && { minHeight: 300, padding: Space[24] }]}
    >
      <View style={[styles.heroText, copyMax ? { maxWidth: copyMax } : null]}>
        <Text style={styles.heroTitle}>Learn From Your Own Material</Text>
        <Text style={styles.heroSub}>Upload notes, slides, a PDF or a link. Your tutor builds a course just for you, then quizzes you on it.</Text>
      </View>
      <Button title="Upload Material" variant="white" onPress={onPress} style={styles.heroBtn} />
    </LinearGradient>
  );
}

// How demanding a level is: three bars, one filled for Warm Up, two for Stretch, all three
// for Challenge. The word is always beside it, so it never relies on the bars alone.
function LevelBars({ level }) {
  return (
    <View style={styles.bars} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.bar, i <= level && { backgroundColor: Colors.accent.orange.solid }]} />
      ))}
    </View>
  );
}

// Which glyph each exercise gets. It says what you do, not which course it belongs to.
const ICON = { mcq: CheckCheck, case: Briefcase, quiz: ClipboardCheck, speak: Mic, write: PenLine, code: Code, cloze: Type, match: Repeat, order: ClipboardList };

// One exercise: a tinted icon tile, the name, a short line, and an arrow that slides in on
// hover. The whole card is the button.
function ExerciseCard({ Icon, accent, title, text, onPress }) {
  const c = Colors.accent[accent] || Colors.accent.blue;
  const [on, setOn] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setOn(true)}
      onHoverOut={() => setOn(false)}
      onFocus={() => setOn(true)}
      onBlur={() => setOn(false)}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${text}`}
      style={({ pressed }) => [styles.card, on && { borderColor: Colors.border.strong }, pressed && { transform: [{ scale: 0.99 }] }]}
    >
      <View style={[styles.tile, { backgroundColor: c.soft }, on && { transform: [{ scale: 1.06 }] }]}>
        <Icon size={26} color={c.text} strokeWidth={2.2} />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
        <Text style={styles.cardSub} numberOfLines={3}>{text}</Text>
      </View>
      <View pointerEvents="none" style={[styles.cardArrow, { opacity: on ? 1 : 0, transform: [{ translateX: on ? 0 : -6 }] }]}>
        <ArrowRight size={20} color={c.text} strokeWidth={2.6} />
      </View>
    </Pressable>
  );
}

// The sheet for a module that is not built yet: what it is, how the tutor helps, where
// it earns its place. A scrim, a rising panel, Escape / outside / X to close.
function ModuleSheet({ m, onClose }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(null);
  const v = useRef(new Animated.Value(0)).current;
  const panel = useRef(null);

  useEffect(() => {
    if (m) {
      setShown(m);
      Animated.timing(v, { toValue: 1, duration: reduced ? 120 : 220, easing: Motion.ease.out, useNativeDriver: Platform.OS !== 'web' }).start();
      const t = setTimeout(() => panel.current?.focus?.(), 60);
      return () => clearTimeout(t);
    }
    Animated.timing(v, { toValue: 0, duration: reduced ? 100 : 140, easing: Motion.ease.out, useNativeDriver: Platform.OS !== 'web' }).start();
    // Unmount on a timer, not the animation callback: animation frames pause in
    // background tabs, and a modal must never stay mounted because of that.
    const gone = setTimeout(() => setShown(null), reduced ? 100 : 150);
    return () => clearTimeout(gone);
  }, [m, reduced, v]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !m) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [m, onClose]);

  if (!shown) return null;
  return (
    <View style={styles.layer} pointerEvents={m ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.overlay.scrim, opacity: v }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={shown.name}
        style={[styles.sheet, { opacity: v, transform: reduced ? [] : [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }] }]}
      >
        <View style={styles.sheetHead}>
          <View style={{ flex: 1, gap: Space[6], alignItems: 'flex-start' }}>
            <Text style={TITLE}>{shown.name}</Text>
          </View>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={({ hovered, pressed }) => [styles.close, (hovered || pressed) && { backgroundColor: Colors.surface.raised }]}>
            <X size={22} color={Colors.icon.secondary} />
          </Pressable>
        </View>
        <Fact label="What you do" text={shown.does} />
        <Fact label="How the tutor helps" text={shown.tutor} />
        <Fact label="Good for" text={shown.fits} />
        <View style={styles.note}>
          <Text style={SUB}>Not built yet. This card marks the module so it can be planned and added to homework.</Text>
        </View>
      </Animated.View>
    </View>
  );
}

function Fact({ label, text }) {
  return (
    <View style={{ gap: Space[2] }}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={SUB}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: Space[16], alignSelf: 'stretch', zIndex: 30 },
  headText: { flex: 1, flexBasis: 220, gap: Space[4], minWidth: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space[16] },
  card: { flex: 1, minHeight: 168, gap: Space[16], padding: Space[24], borderRadius: Radii.card.lg, borderWidth: 2, borderColor: Colors.border.subtle, backgroundColor: Colors.surface.card, ...Platform.select({ web: { cursor: 'pointer', transitionProperty: 'border-color', transitionDuration: '180ms' } }) },
  tile: { width: 52, height: 52, borderRadius: 10, alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { transitionProperty: 'transform', transitionDuration: '180ms', transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' } }) },
  cardText: { gap: Space[4] },
  cardTitle: { fontFamily: FontFamilies.demi, fontSize: Platform.select({ web: 'clamp(17px, 0.4vw + 14px, 20px)', default: 18 }), lineHeight: Platform.select({ web: 'clamp(24px, 0.5vw + 19px, 27px)', default: 25 }), color: Colors.text.primary },
  cardSub: { fontFamily: FontFamilies.medium, fontSize: fs(16), lineHeight: lh(23), color: Colors.text.secondary },
  cardArrow: { position: 'absolute', top: Space[24], right: Space[24], ...Platform.select({ web: { transitionProperty: 'opacity, transform', transitionDuration: '180ms', transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' } }) },
  list: { gap: Space[12] },
  section: { gap: Space[16], marginTop: Space[40] },
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: Space[16], zIndex: 30 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 18 },
  bar: { width: 6, height: 18, borderRadius: 3, backgroundColor: Colors.border.subtle },
  levelText: { flex: 1, flexBasis: 240, minWidth: 0, gap: Space[4] },
  hero: { minHeight: 300, padding: Space[32], borderRadius: Radii.dialog, overflow: 'hidden', justifyContent: 'space-between', gap: Space[24] },
  heroText: { gap: Space[8] },
  heroTitle: { fontFamily: FontFamilies.heavy, fontSize: Platform.select({ web: 'clamp(24px, 1.6vw + 16px, 34px)', default: 28 }), lineHeight: Platform.select({ web: 'clamp(30px, 1.8vw + 20px, 40px)', default: 34 }), letterSpacing: -0.4, color: '#FFFFFF' },
  heroSub: { fontFamily: FontFamilies.medium, fontSize: Platform.select({ web: 'clamp(16px, 0.4vw + 13px, 19px)', default: 17 }), lineHeight: Platform.select({ web: 'clamp(24px, 0.5vw + 19px, 28px)', default: 25 }), color: 'rgba(255,255,255,0.92)' },
  heroBtn: { alignSelf: 'flex-start' },


  layer: { ...Platform.select({ web: { position: 'fixed' }, default: { position: 'absolute' } }), top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, alignItems: 'center', justifyContent: 'center', padding: Space[24] },
  sheet: {
    width: '100%',
    maxWidth: 560,
    gap: Space[20],
    padding: Space[28],
    backgroundColor: Colors.surface.card,
    borderWidth: 2,
    borderColor: Colors.border.subtle,
    borderRadius: Radii.dialog,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', gap: Space[16] },
  close: { width: 48, height: 48, borderRadius: Radii.option, alignItems: 'center', justifyContent: 'center', marginTop: -Space[8], marginRight: -Space[8] },
  factLabel: { fontFamily: FontFamilies.demi, fontSize: fs(15), letterSpacing: 0.9, textTransform: 'uppercase', color: Colors.text.secondary },
  note: { padding: Space[16], borderRadius: Radii.control.md, backgroundColor: Colors.surface.raised },
});
