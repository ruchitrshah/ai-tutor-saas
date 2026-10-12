// One subject's homework as a path of tasks.
//  - The header is sticky; the path scrolls beneath a soft fade.
//  - Tasks sit under unit dividers, so 8 tasks or 40 read the same way.
//  - Three states, two colours:
//      done      amber coin with a check   (the secondary colour means "earned")
//      up next   blue coin, the task's own icon, a breathing halo and START
//      locked    grey coin, the task's own icon, "Locked" in the label
//    A node always shows what the task *is*; a lock is never a replacement for it.
//  - On arrival the path scrolls the next task into view.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ArrowLeft, MorphIcon, data } from '../ui/icons';

import { CONTROL, ColorUtils, Colors, FontFamilies, Motion, Radii, Space, useReducedMotion } from '../brand';
import Button from '../components/Button';
import { findSubject } from '../data/courses';
import { usePortal } from '../store/portal';
import { PAGE_TITLE, SUB, TITLE } from '../theme/type';
import Breathe, { Halo } from '../ui/Breathe';
import InView from '../ui/InView';
import { dueInfo } from '../ui/due';
import Reveal from '../ui/Reveal';
import Shell from '../ui/Shell';
import Rail from './Rail';
import { fs, lh } from '../theme/fluid';

// A gentle wobble so the path reads as a path, not a list.
const OFFSET = [0, -60, -90, -60, 0, 60, 90, 60];
const SIZE = 84;

export default function Subject() {
  const { route, go, done, openDetails } = usePortal();
  const subject = findSubject(route.subjectId);
  const reduced = useReducedMotion();
  const nextRef = useRef(null);

  const firstOpen = subject ? subject.tasks.findIndex((t) => !done[t.id]) : -1;
  // Just finished the last task of this subject: one burst over the header.
  const subjectDone = !!subject && !!route.justCompleted && firstOpen === -1;

  // Bring the next task into view once the path has finished entering.
  useEffect(() => {
    if (firstOpen < 2 || Platform.OS !== 'web') return undefined;
    const t = setTimeout(() => {
      nextRef.current?.scrollIntoView?.({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }, 520);
    return () => clearTimeout(t);
  }, [firstOpen, reduced, subject?.id]);

  if (!subject) return null;

  const header = (
    <View style={styles.head}>
      <Pressable
        onPress={() => go('homework')}
        accessibilityRole="button"
        accessibilityLabel="Back to homework"
        style={({ hovered, pressed }) => [styles.back, (hovered || pressed) && { backgroundColor: Colors.surface.raised }]}
      >
        <ArrowLeft size={20} color={Colors.icon.primary} />
      </Pressable>
      <View style={{ flex: 1, gap: Space[4] }}>
        <Text style={PAGE_TITLE} numberOfLines={1}>{subject.name}</Text>
        <Text style={SUB} numberOfLines={1}>{subject.code} · Week {subject.week} · {dueInfo(subject).label}</Text>
      </View>
      <Button title="Course details" variant="outline" onPress={() => openDetails(subject.id)} />
    </View>
  );

  let prevUnit = null;
  return (
    <Shell active="homework" rail={<Rail />} railFill header={header}>
      <View style={styles.path}>
        {subject.tasks.map((t, i) => {
          const isDone = !!done[t.id];
          const isNext = i === firstOpen;
          const locked = !isDone && !isNext;
          const newUnit = t.unit && t.unit !== prevUnit;
          prevUnit = t.unit;
          const stagger = Math.min(i, 8) * 45;

          // Duolingo's path: done = gold coin, next = green coin, locked = grey.
          // done = gold coin, next = blue coin (the one action colour), locked = grey. Flat.
          const face = isDone ? Colors.brand.gold : isNext ? Colors.brand.primary : Colors.surface.raised;

          const nextTask = subject.tasks[i + 1];
          const joins = nextTask && !(nextTask.unit && nextTask.unit !== t.unit); // no line across a unit divider

          return (
            <React.Fragment key={t.id}>
              {newUnit && (
                <InView y={8} scaleFrom={1} style={styles.unit}>
                  <View style={styles.rule} />
                  <Text style={styles.unitText}>{t.unit}</Text>
                  <View style={styles.rule} />
                </InView>
              )}
              <InView delay={i < 6 ? stagger : 0} y={18}>
                <PathRow
                  index={i}
                  task={t}
                  face={face}
                  isDone={isDone}
                  isNext={isNext}
                  locked={locked}
                  joins={joins}
                  fresh={route.justCompleted === t.id}
                  late={route.justCompleted ? 380 : 220}
                  nextRef={isNext ? nextRef : undefined}
                  onOpen={() => go('task', { subjectId: subject.id, taskId: t.id })}
                />
              </InView>
            </React.Fragment>
          );
        })}
      </View>
    </Shell>
  );
}


// One stop on the path. Hovering a stop lifts it: a ring opens around the coin and the label
// leans in. Pressing a locked stop does not go anywhere, but it shakes, so it never feels dead.
function PathRow({ index, task: t, face, isDone, isNext, locked, joins, fresh, late, nextRef, onOpen }) {
  const reduced = useReducedMotion();
  const [hover, setHover] = useState(false);
  const ring = useRef(new Animated.Value(0)).current;
  const lean = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const native = Platform.OS !== 'web';

  const over = (on) => {
    setHover(on);
    if (reduced) return;
    const cfg = { toValue: on ? 1 : 0, duration: on ? 220 : 160, easing: Motion.ease.out, useNativeDriver: native };
    Animated.parallel([Animated.timing(ring, cfg), Animated.timing(lean, cfg)]).start();
  };
  const press = () => {
    if (!locked) { onOpen(); return; }
    if (reduced) return;
    Animated.sequence([-5, 5, -3, 3, 0].map((x) => Animated.timing(shake, { toValue: x, duration: 60, easing: Motion.ease.out, useNativeDriver: native }))).start();
  };

  const dx = OFFSET[(index + 1) % OFFSET.length] - OFFSET[index % OFFSET.length];
  const ringColor = isDone ? Colors.brand.gold : isNext ? Colors.brand.primary : Colors.border.control;

  return (
    <View style={[styles.nodeRow, { transform: [{ translateX: OFFSET[index % OFFSET.length] }] }]}>
      {joins ? <Connector dx={dx} filled={isDone} /> : null}
      <View style={styles.nodeCol} ref={nextRef}>
        {isNext && <StartTag late={late} />}
        <Animated.View pointerEvents="none" style={[styles.ring, { borderColor: ringColor, opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] }), transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.22] }) }] }]} />
        <Pop active={fresh}>
          <Animated.View style={{ transform: [{ translateX: shake }] }}>
            <Pressable
              onPress={press}
              onHoverIn={() => over(true)}
              onHoverOut={() => over(false)}
              onFocus={() => over(true)}
              onBlur={() => over(false)}
              accessibilityRole="button"
              accessibilityState={{ disabled: locked }}
              accessibilityLabel={`${t.title}${locked ? ', locked' : isDone ? ', done' : ', up next'}`}
              style={({ pressed }) => [styles.node, { backgroundColor: face }, hover && !locked && { transform: [{ scale: 1.06 }] }, pressed && !locked && { transform: [{ scale: 0.95 }] }]}
            >
              <NodeGlyph done={isDone} fresh={fresh} locked={locked} />
            </Pressable>
          </Animated.View>
        </Pop>
      </View>
      <Animated.View style={[styles.label, { transform: [{ translateX: lean.interpolate({ inputRange: [0, 1], outputRange: [0, locked ? 0 : 6] }) }] }]}>
        <Text style={[TITLE, locked && styles.dim, hover && !locked && { color: Colors.text.accent }]} numberOfLines={1}>{t.title}</Text>
        <Text style={[SUB, locked && styles.dim]} numberOfLines={2}>{locked ? 'Locked until the one before is done' : t.sub}</Text>
      </Animated.View>
    </View>
  );
}

// A dotted curve from this coin down to the next. Gold where you have been, grey ahead.
function Connector({ dx, filled }) {
  const pad = 10;
  const x0 = pad + (dx < 0 ? -dx : 0);
  const x1 = x0 + dx;
  const h = 32;
  return (
    <View pointerEvents="none" style={[styles.connector, { left: SIZE / 2 + Math.min(0, dx) - pad, width: Math.abs(dx) + pad * 2, height: h }]}>
      <Svg width={Math.abs(dx) + pad * 2} height={h}>
        <Path d={`M ${x0} 0 C ${x0} ${h / 2}, ${x1} ${h / 2}, ${x1} ${h}`} stroke={filled ? Colors.brand.gold : Colors.border.control} strokeWidth={4} strokeLinecap="round" strokeDasharray="1 10" fill="none" />
      </Svg>
    </View>
  );
}

// A node's icon is its state, and nothing else: play (do this), check (done), lock
// (not yet). When you have just finished a task, play morphs into the check after
// the coin has popped, so completion reads as one thing changing.
function NodeGlyph({ done, fresh, locked }) {
  const [showCheck, setShowCheck] = useState(done && !fresh);
  useEffect(() => {
    if (!done) { setShowCheck(false); return undefined; }
    if (!fresh) { setShowCheck(true); return undefined; }
    const t = setTimeout(() => setShowCheck(true), 620);
    return () => clearTimeout(t);
  }, [done, fresh]);
  return (
    <MorphIcon
      icon={showCheck ? data.Check : locked ? data.Lock : data.Play}
      size={showCheck ? 36 : 30}
      strokeWidth={showCheck ? 3.2 : 2.4}
      color={locked ? Colors.icon.muted : showCheck ? Colors.ink : Colors.brand.onPrimary}
      spring="bouncy"
      reducedMotion="user"
    />
  );
}

// The task you just finished lands with a small overshoot: it arrived.
function Pop({ active, children }) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(active && !reduced ? 0 : 1)).current;
  useEffect(() => {
    if (!active || reduced) return;
    Animated.spring(v, { toValue: 1, ...Motion.spring.pop, delay: 200, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [active, reduced, v]);
  return (
    <Animated.View style={{ transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }}>
      {children}
    </Animated.View>
  );
}

// START drops in, settles, then breathes. It is the one thing that moves while idle.
function StartTag({ late }) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) return;
    Animated.spring(v, { toValue: 1, ...Motion.spring.pop, delay: late, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [late, reduced, v]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.start, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] }]}
    >
      <Breathe amount={0.06} duration={1600}>
        <View style={styles.startFace}>
          <Text style={styles.startText}>START</Text>
        </View>
      </Breathe>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Same two-line header as Homework, starting at the same x. Back hangs in the gutter to its left.
  head: { flexDirection: 'row', alignItems: 'center', gap: Space[16], alignSelf: 'stretch', position: 'relative' },
  // 12px between the hanging button and the title, on every screen.
  back: { position: 'absolute', left: -(CONTROL + 12), top: 0, width: CONTROL, height: CONTROL, borderRadius: Radii.control.md, alignItems: 'center', justifyContent: 'center' },

  path: { alignItems: 'center', gap: Space[32], paddingTop: Space[16] },
  unit: { flexDirection: 'row', alignItems: 'center', gap: Space[20], alignSelf: 'stretch' },
  rule: { flex: 1, height: 2, borderRadius: 1, backgroundColor: Colors.border.subtle },
  // A caption: small, semi-bold, all capitals, spaced out.
  unitText: { fontFamily: FontFamilies.demi, fontSize: fs(15), lineHeight: lh(20), letterSpacing: 1.6, textTransform: 'uppercase', color: Colors.text.secondary },

  nodeRow: { flexDirection: 'row', alignItems: 'center', gap: Space[20], width: 360 },
  nodeCol: { alignItems: 'center', justifyContent: 'center', width: SIZE, height: SIZE },
  node: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { transitionProperty: 'transform', transitionDuration: '160ms', transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' } }),
  },

  ring: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 4 },
  connector: { position: 'absolute', top: SIZE },
  start: { position: 'absolute', top: -Space[44], zIndex: 3, alignItems: 'center' },
  startFace: { backgroundColor: Colors.brand.primary, borderRadius: Radii.control.md, paddingHorizontal: Space[16], paddingVertical: Space[8] },
  startText: { fontFamily: FontFamilies.demi, fontSize: fs(15), letterSpacing: 1.2, color: Colors.brand.onPrimary },

  label: { flex: 1, gap: Space[2] },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: Space[6] },
  dim: { color: Colors.text.muted },
});
