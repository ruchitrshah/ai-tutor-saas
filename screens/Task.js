// The task player. It uses the same frame as every other screen: the work in
// the centre column, the tutor in the right rail. One header (close + progress),
// four players: MCQ (practice / case / quiz), speaking, writing, code.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Check, ChevronLeft, Play, RotateCcw, Terminal, X } from '../ui/icons';

import { CONTROL, ColorUtils, Colors, FontFamilies, Motion, Palette, Radii, Space, useReducedMotion } from '../brand';
import Button from '../components/Button';
import OptionShell from '../components/OptionShell';
import ProgressBar from '../components/ProgressBar';
import { SKILL_OF, findSubject, findTask } from '../data/courses';
import { usePortal } from '../store/portal';
import { recap } from '../tutor/engine';
import { SUB, TITLE } from '../theme/type';
import { KIND, SKILL_STYLE } from '../ui/kinds';
import Reveal from '../ui/Reveal';
import Shell, { cardBox } from '../ui/Shell';
import TutorDock, { Beats, MAX_HINTS, TutorRecap } from '../ui/TutorDock';
import LeaveDialog from '../ui/LeaveDialog';
import TutorAvatar from '../ui/TutorAvatar';
import { fs, lh } from '../theme/fluid';

export default function Task() {
  const { route, go, completeTask } = usePortal();
  const subject = findSubject(route.subjectId);
  // A course built from the student's own material carries its task inline.
  const task = route.custom || findTask(subject, route.taskId);
  const { user, lang, skills } = usePortal();
  const [finished, setFinished] = useState(null); // { lines, stats, skill }

  // A task opened from Practice or Revisions is a free session: it returns there and does
  // not change homework progress.
  const origin = route.from; // 'practice' | 'revisions' | undefined (homework)
  const practice = !!origin;
  const close = useCallback(() => (origin ? go(origin) : go('subject', { subjectId: subject?.id })), [go, subject, origin]);
  const closeDone = useCallback(
    () => (origin ? go(origin) : go('subject', { subjectId: subject?.id, justCompleted: task.id })),
    [go, subject, task, origin]
  );
  const finish = useCallback(
    (lines, stats) => {
      // The skill this task trains, and how far it moves: shown on the completion screen.
      const key = SKILL_OF[task.kind];
      const before = key ? skills[key] : null;
      if (!practice) completeTask(task.id, task.kind);
      setFinished({ lines, stats: stats || null, skill: key && !practice ? { key, before, after: Math.min(1, before + 0.15) } : null });
    },
    [completeTask, task, practice, skills]
  );

  if (!task) return null;

  if (finished) {
    // Same segment count as the task, all filled, and the same right column, so
    // nothing in the frame moves when the task ends.
    const total = task.items ? task.items.length : task.pairs ? task.pairs.length : 2;
    return (
      <Page
        kind={task.kind}
        onClose={closeDone}
        step={total}
        total={total}
        rail={<TutorRecap message={recap({ name: user.name.split(' ')[0], lang })} />}
      >
        <Complete
          task={task}
          finished={finished}
          name={user.name.split(' ')[0]}
          backLabel={origin === 'revisions' ? 'Back to Revisions' : origin === 'practice' ? 'Back to Practice' : 'Back to your path'}
          onDone={closeDone}
        />
      </Page>
    );
  }

  const Player = { practice: Mcq, case: Mcq, quiz: Mcq, speak: Speak, write: Write, code: Code, blank: Blank, match: Match, order: Order }[task.kind];
  return <Player task={task} onClose={close} onFinish={finish} />;
}

// ── Completion ────────────────────────────────────────────────────────────────
// A calm finish: a check, the tutor's line, three numbers, the skill this trained, then
// the way on. Every step is skippable by just pressing the button.
function Complete({ task, finished, name, backLabel, onDone }) {
  const reduced = useReducedMotion();
  const { stats, skill } = finished;
  const tiles = stats
    ? [
        { label: 'Right first time', value: stats.firstTry, of: stats.answered },
        { label: 'Hints used', value: stats.hints },
        { label: 'Breakthroughs', value: stats.breakthroughs },
      ]
    : [];
  return (
    <View style={styles.complete}>
      <View style={styles.medalWrap}>
        <Reveal y={6} scaleFrom={0.9} duration={260}>
          <View style={styles.medal}>
            <Check size={36} color={Colors.accent.blue.text} strokeWidth={2.8} />
          </View>
        </Reveal>
      </View>

      <Reveal delay={260}>
        <Text style={[TITLE, styles.centerText]}>Task complete</Text>
      </Reveal>
      {/* One line under the title; the task's name is already in the header. */}
      <Reveal delay={320}>
        <Text style={[SUB, styles.centerText]}>{finished.lines[0]}</Text>
      </Reveal>

      {tiles.length > 0 && (
        <View style={styles.tiles}>
          {tiles.map((t, i) => (
            <Reveal key={t.label} delay={460 + i * 70} y={10} style={styles.tile}>
              <Text style={TITLE}>
                <CountUp to={t.value} delay={560 + i * 70} />
                {t.of != null ? ` of ${t.of}` : ''}
              </Text>
              <Text style={styles.tileLabel}>{t.label}</Text>
            </Reveal>
          ))}
        </View>
      )}

      {skill && (
        <Reveal delay={640} y={10} style={styles.skill}>
          <SkillGain skill={skill} />
        </Reveal>
      )}

      <Reveal delay={reduced ? 0 : 760} y={8}>
        <Button title={backLabel} onPress={onDone} style={styles.cta} />
      </Reveal>
    </View>
  );
}

// Counts from 0 up to a number once, easing out so it settles instead of ticking.
function CountUp({ to, delay = 0 }) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(reduced ? to : 0);
  useEffect(() => {
    if (reduced || to === 0) { setN(to); return undefined; }
    let raf; let t0;
    const dur = 520;
    const tick = (now) => {
      t0 = t0 || now;
      const k = Math.min(1, (now - t0) / dur);
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    const start = setTimeout(() => { raf = requestAnimationFrame(tick); }, delay);
    return () => { clearTimeout(start); if (raf) cancelAnimationFrame(raf); };
  }, [to, delay, reduced]);
  return n;
}

// The skill this task trains, filling from where it was to where it is now.
function SkillGain({ skill }) {
  const [val, setVal] = useState(skill.before);
  useEffect(() => {
    const t = setTimeout(() => setVal(skill.after), 450);
    return () => clearTimeout(t);
  }, [skill]);
  const accent = Colors.accent[SKILL_STYLE[skill.key].accent];
  const label = skill.key.charAt(0).toUpperCase() + skill.key.slice(1);
  return (
    <View style={{ gap: Space[8] }}>
      <View style={styles.skillTop}>
        <Text style={TITLE}>{label}</Text>
        <Text style={[SUB, { color: accent.text }]}>+{Math.round((skill.after - skill.before) * 100)}%</Text>
      </View>
      <ProgressBar currentStep={val} totalSteps={1} sparkle={false} height={16} fillColor={Colors.brand.primary} />
    </View>
  );
}

// A correct answer gives a small pop: 1 → 1.03 → 1, in about a third of a second.
function PopOnce({ children }) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 120, easing: Motion.ease.out, useNativeDriver: Platform.OS !== 'web' }),
      Animated.spring(v, { toValue: 0, ...Motion.spring.settle, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, [reduced, v]);
  return <Animated.View style={{ transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }] }}>{children}</Animated.View>;
}

// ── Frame ─────────────────────────────────────────────────────────────────────
// On a phone the tutor is not squeezed under the work. It lives in a sheet that rises from
// the bottom, opened from the tutor's face beside the progress bar (a dot says it has
// something new), and the chevron slides it back down. Exercises call `open()` when they
// ask the tutor for something (a hint, "Ask Bear").
const TutorUI = React.createContext({ open: () => {}, phone: false });

function TutorSheet({ open, onClose, children }) {
  const reduced = useReducedMotion();
  const { height } = useWindowDimensions();
  const native = Platform.OS !== 'web';
  const v = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setShown(true);
      Animated.timing(v, { toValue: 1, duration: reduced ? 100 : 300, easing: Motion.ease.out, useNativeDriver: native }).start();
      return undefined;
    }
    Animated.timing(v, { toValue: 0, duration: reduced ? 80 : 220, easing: Motion.ease.out, useNativeDriver: native }).start();
    const t = setTimeout(() => setShown(false), reduced ? 90 : 240);
    return () => clearTimeout(t);
  }, [open, reduced, v, native]);

  useEffect(() => {
    if (native || !open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, native]);

  // The back button leads the tutor's own header row, so the sheet has one top bar, not two.
  const back = (
    <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Back to the exercise" style={({ hovered, pressed }) => [styles.sheetBack, (hovered || pressed) && { backgroundColor: Colors.surface.raised }]}>
      <ChevronLeft size={26} color={Colors.icon.secondary} strokeWidth={2.4} />
    </Pressable>
  );

  return (
    <Animated.View
      pointerEvents={open ? 'auto' : 'none'}
      aria-hidden={!open}
      style={[styles.sheet, { transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }) }], ...Platform.select({ web: { visibility: shown ? 'visible' : 'hidden' } }) }]}
    >
      <View style={{ flex: 1 }}>{React.isValidElement(children) ? React.cloneElement(children, { leading: back }) : children}</View>
    </Animated.View>
  );
}

export function Page({ kind, onClose, step, total, rail, leave, headerRight, continuous = false, children }) {
  const { route } = usePortal();
  const { width } = useWindowDimensions();
  // Where the page is too narrow to hang the close button in the margin, it sits in line.
  const inline = width < 1100;
  const phone = width < 640;
  // Closing mid-activity asks first (see LeaveDialog); `leave` carries what it needs.
  const [asking, setAsking] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const [footer, setFooter] = useState(null);
  const footerCtx = useMemo(() => ({ set: setFooter }), []);
  const openRef = useRef(false);
  openRef.current = tutorOpen;
  const hintsLeft = leave && leave.hintsLeft ? leave.hintsLeft() : null;
  const openTutor = useCallback(() => { setTutorOpen(true); setUnread(false); }, []);
  const closeTutor = useCallback(() => setTutorOpen(false), []);
  const ctx = useMemo(() => ({ open: openTutor, phone }), [openTutor, phone]);
  const dockEl = phone && rail && React.isValidElement(rail)
    ? React.cloneElement(rail, { onSays: () => { if (!openRef.current) setUnread(true); } })
    : rail;

  const header = (
    <View style={styles.top}>
      <Pressable
        onPress={() => (leave ? setAsking(true) : onClose())}
        accessibilityRole="button"
        accessibilityLabel="Close task"
        style={({ hovered, pressed }) => [styles.close, inline && styles.closeInline, (hovered || pressed) && { backgroundColor: Colors.surface.raised }]}
      >
        <X size={22} color={Colors.icon.secondary} strokeWidth={2.4} />
      </Pressable>
      {continuous ? (
        <ProgressBar currentStep={Math.min(1, step / Math.max(total, 1))} totalSteps={1} sparkle={false} height={12} fillColor={Colors.brand.primary} style={styles.progress} />
      ) : (
        <ProgressBar currentStep={step} totalSteps={Math.max(total, 1)} sparkle={false} height={12} gap={6} fillColor={Colors.brand.primary} style={styles.progress} />
      )}
      {headerRight}
      {phone && rail ? (
        <Pressable onPress={openTutor} accessibilityRole="button" accessibilityLabel={unread ? 'Open your tutor, new message' : 'Open your tutor'} style={({ pressed }) => [styles.tutorBtn, pressed && { transform: [{ scale: 0.95 }] }]}>
          {({ hovered }) => (
            <>
              <TutorAvatar size={36} hovered={hovered} />
              {unread ? <View style={styles.unread} /> : null}
            </>
          )}
        </Pressable>
      ) : null}
    </View>
  );
  return (
    <TutorUI.Provider value={ctx}>
     <FooterCtx.Provider value={footerCtx}>
      <Shell active={route.from || 'homework'} header={header} rail={phone ? null : rail} railFill bottomNav={false} autoCollapse>
        {children}
      </Shell>
      {/* Outside the Shell: its content is wrapped in a transform, which would pin a
          fixed-position layer to the column instead of the window. */}
      {footer ? (
        <View pointerEvents="box-none" style={[styles.footDock, { left: 0, right: !phone && rail && width >= 1180 ? 442 : 0 }]}>
          <View style={[styles.footInner, { paddingHorizontal: phone ? Space[16] : Space[40] }]}>{footer}</View>
        </View>
      ) : null}
      {phone && rail ? <TutorSheet open={tutorOpen} onClose={closeTutor}>{dockEl}</TutorSheet> : null}
      {leave ? (
        <LeaveDialog
          exam={!!leave.exam}
          open={asking}
          hintsLeft={hintsLeft}
          onStay={() => setAsking(false)}
          onHint={() => { setAsking(false); if (phone) openTutor(); leave.onHint && leave.onHint(); }}
          onLeave={() => { setAsking(false); onClose(); }}
        />
      ) : null}
     </FooterCtx.Provider>
    </TutorUI.Provider>
  );
}

// The row under the work: always fixed to the bottom of the screen, beside the sidebar and
// the tutor. Its content comes from whichever exercise is showing; FooterBar hands it to
// the Page, which draws it outside the scrolling column (a fixed bar inside the column's
// animated wrapper would be pinned to the wrong box).
const FooterCtx = React.createContext(null);
export function FooterBar({ children }) {
  const ctx = React.useContext(FooterCtx);
  useEffect(() => { if (ctx) ctx.set(children); });
  useEffect(() => () => { if (ctx) ctx.set(null); }, [ctx]);
  return null;
}

// A message that rises from the bottom, just above the footer, until it is dismissed. It
// comes back on the next miss (`tick` changes) and goes away when the answer is right.
function Snack({ message, tick }) {
  const reduced = useReducedMotion();
  const native = Platform.OS !== 'web';
  const [open, setOpen] = useState(!!message);
  const [mounted, setMounted] = useState(!!message);
  const v = useRef(new Animated.Value(message ? 1 : 0)).current;

  useEffect(() => { setOpen(!!message); }, [message, tick]);
  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.timing(v, { toValue: 1, duration: reduced ? 100 : 220, easing: Motion.ease.out, useNativeDriver: native }).start();
      return undefined;
    }
    Animated.timing(v, { toValue: 0, duration: reduced ? 80 : 140, easing: Motion.ease.out, useNativeDriver: native }).start();
    const t = setTimeout(() => setMounted(false), reduced ? 90 : 160);
    return () => clearTimeout(t);
  }, [open, reduced, v, native]);

  if (!mounted) return null;
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.snackWrap, { opacity: v, transform: reduced ? [] : [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}
    >
      <View style={styles.snack} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <View style={styles.snackIcon}><X size={14} color="#FFFFFF" strokeWidth={3.6} /></View>
        <Text style={styles.snackText}>{message}</Text>
        <Pressable onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel="Dismiss" style={({ hovered, pressed }) => [styles.snackX, (hovered || pressed) && { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
          <X size={18} color="#FFFFFF" strokeWidth={2.4} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

// The A–D badge on an answer row. One component for every state, so it stays mounted
// and its fill and border *transition* rather than snapping: outline (open), filled
// (chosen), check (correct), cross (wrong). The shape changes too, so colour is never
// the only signal.
const BADGE_TONE = {
  open: { borderColor: Colors.border.control, backgroundColor: 'transparent' },
  chosen: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.primary },
  correct: { borderColor: Colors.status.success, backgroundColor: Colors.status.success },
  wrong: { borderColor: Colors.status.dangerFill, backgroundColor: Colors.status.dangerFill },
};
export function Letter({ letter, state }) {
  const mark = state === 'correct' ? Check : state === 'wrong' ? X : null;
  const Mark = mark;
  return (
    <View style={[styles.letter, BADGE_TONE[state]]}>
      {Mark ? (
        <Reveal key={state} y={0} scaleFrom={0.6} duration={200}>
          <Mark size={16} strokeWidth={3.4} color="#FFFFFF" />
        </Reveal>
      ) : (
        <Text style={[styles.letterText, { color: state === 'chosen' ? Colors.brand.onPrimary : Colors.text.secondary }]}>{letter}</Text>
      )}
    </View>
  );
}

// Where you are, in words. No icon: the title says it.
export function Eyebrow({ children }) {
  return <Text style={SUB}>{children}</Text>;
}

// ── MCQ: practice, case study, quiz ───────────────────────────────────────────
function Mcq({ task, onClose, onFinish }) {
  const { recordAnswer } = usePortal();
  const dock = useRef(null);
  const quiz = task.kind === 'quiz';
  const items = task.items;

  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [wrong, setWrong] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | right
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0); // answers right first time, in a row
  const tally = useRef({ answered: 0, firstTry: 0, hints: 0, breakthroughs: 0 });
  const item = items[i];

  useEffect(() => {
    setPicked(null);
    setWrong([]);
    setStatus('idle');
  }, [i]);

  const check = () => {
    if (picked == null) return;
    const ok = picked === item.answer;
    if (quiz) {
      // No feedback mid-quiz: lock in and move on.
      recordAnswer(item.topic, { firstTry: ok, usedHint: false });
      const next = score + (ok ? 1 : 0);
      setScore(next);
      tally.current.answered += 1;
      if (ok) tally.current.firstTry += 1;
      if (i + 1 < items.length) setI(i + 1);
      else onFinish([`You got ${next} of ${items.length}.`, 'Anything you missed goes on your weak-spots list, and we will go back over it together.'], { ...tally.current });
      return;
    }
    if (ok) {
      const usedHint = (dock.current?.level?.() || 0) > 0;
      const firstTry = wrong.length === 0 && !usedHint;
      recordAnswer(item.topic, { firstTry, usedHint });
      setStatus('right');
      tally.current.answered += 1;
      tally.current.hints += dock.current?.level?.() || 0;
      if (firstTry) tally.current.firstTry += 1;
      else tally.current.breakthroughs += 1;
      const run = firstTry ? streak + 1 : 0;
      setStreak(run);
      dock.current?.correct({ firstTry, streak: run });
    } else {
      setWrong((w) => [...w, picked]);
      setPicked(null);
      setStreak(0);
      dock.current?.wrong({ wrongCount: wrong.length + 1 });
    }
  };

  const next = () => {
    if (i + 1 < items.length) setI(i + 1);
    else onFinish([`You worked through all ${items.length}.`, 'I noted where a nudge helped and where you flew, so the shaky bits come back next time.'], { ...tally.current });
  };

  const breakthrough = wrong.length > 0 || (dock.current?.level?.() || 0) > 0;

  return (
    <Page
      kind={task.kind}
      onClose={onClose}
      leave={{ hintsLeft: () => (quiz ? -1 : (dock.current?.left?.() ?? MAX_HINTS)), onHint: () => dock.current?.hint?.() }}
      step={i + (status === 'right' ? 1 : 0)}
      total={items.length}
      rail={<TutorDock ref={dock} kind="mcq" item={item} locked={quiz} resetKey={`${task.id}-${i}`} />}
    >
      <Eyebrow>{task.title} · {i + 1} of {items.length}</Eyebrow>
      <Text style={[TITLE, styles.q]}>{item.text}</Text>
      <View style={styles.options} role="radiogroup" aria-label={item.text}>
        {item.options.map((opt, k) => {
          const eliminated = wrong.includes(k);
          const right = status === 'right' && picked === k;
          const state = right ? 'correct' : eliminated ? 'wrong' : picked === k ? 'chosen' : 'open';
          const tile = (
            <OptionShell
              lead={<Letter letter={'ABCD'[k]} state={state} />}
              label={opt}
              selected={picked === k && !right}
              result={right ? 'correct' : eliminated ? 'wrong' : undefined}
              disabled={eliminated || status === 'right'}
              trailing={right ? 'Correct' : eliminated ? 'Not this one' : undefined}
              onPress={() => setPicked(k)}
              role="radio"
            />
          );
          return (
            <Reveal key={`${i}-${k}`} delay={80 + k * 45} y={8}>
              <View style={{ position: 'relative' }}>
                {/* The right answer pops and bursts; nothing else moves. */}
                {right ? <PopOnce>{tile}</PopOnce> : tile}
              </View>
            </Reveal>
          );
        })}
      </View>

      <FooterBar>
        {status === 'right' ? (
          <>
            <Reveal y={6} scaleFrom={0.96} style={styles.banner}>
              <View style={styles.bannerIcon}>
                <Check size={18} color="#FFFFFF" strokeWidth={3.2} />
              </View>
              <Text style={[TITLE, { color: Colors.status.successText }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
                {breakthrough ? 'Breakthrough' : 'Correct'}
              </Text>
            </Reveal>
            <Button title={i + 1 < items.length ? 'Next Question' : 'Finish'} onPress={next} style={styles.action} />
          </>
        ) : (
          <>
            <View style={{ flex: 1 }} />
            <Snack message={wrong.length > 0 ? 'Not quite. Your tutor has a nudge on the right.' : null} tick={wrong.length} />
            <Button
              title={quiz ? (i + 1 < items.length ? 'Lock in' : 'Finish quiz') : 'Check'}
              variant="success"
              disabled={picked == null}
              onPress={check}
              style={styles.action}
            />
          </>
        )}
      </FooterBar>
    </Page>
  );
}

// ── Shared by the three newer players ─────────────────────────────────────────
// The row under the work: a "correct" banner and the way on, or a gentle miss note and
// the check button. Same shape as the multiple choice footer.
function Footer({ right, breakthrough, streak, last, onNext, missNote, missTick, checkDisabled, onCheck, hideCheck, onReset }) {
  return (
    <FooterBar>
      {right ? (
        <>
          <Reveal y={6} scaleFrom={0.96} style={styles.banner}>
            <View style={styles.bannerIcon}><Check size={18} color="#FFFFFF" strokeWidth={3.2} /></View>
            <Text style={[TITLE, { color: Colors.status.successText }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
              {breakthrough ? 'Breakthrough' : 'Correct'}
            </Text>
          </Reveal>
          <Button title={last ? 'Finish' : 'Next Question'} onPress={onNext} style={styles.action} />
        </>
      ) : (
        <>
          {onReset ? <Button title="Reset" variant="outline" onPress={onReset} style={styles.resetBtn} /> : null}
          <View style={{ flex: 1 }} />
          <Snack message={missNote} tick={missTick} />
          {hideCheck ? null : <Button title="Check" variant="success" disabled={checkDisabled} onPress={onCheck} style={styles.action} />}
        </>
      )}
    </FooterBar>
  );
}

// A word chip: the bank in "fill in the blank".
export function Chip({ label, state, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={state === 'wrong' || state === 'correct' || state === 'taken'}
      role="radio"
      aria-checked={state === 'chosen' || state === 'correct'}
      accessibilityLabel={`${label}${state === 'wrong' ? ', not this one' : state === 'correct' ? ', correct' : ''}`}
      style={({ hovered, pressed }) => [
        styles.chip,
        state === 'chosen' && styles.chipChosen,
        state === 'correct' && styles.chipCorrect,
        state === 'wrong' && styles.chipWrong,
        state === 'taken' && styles.chipTaken,
        state === 'open' && hovered && { backgroundColor: Colors.surface.raised },
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <Text style={[styles.chipText, state === 'chosen' && { color: Colors.text.accent }, state === 'correct' && { color: Colors.status.successText }, state === 'wrong' && { color: Colors.text.muted, textDecorationLine: 'line-through' }]}>{label}</Text>
    </Pressable>
  );
}

// The sentence with its gap. The empty gap is a dashed blue slot that breathes slowly, so it
// reads as "the answer goes here"; a chosen word settles into it with a small pop; a right
// answer turns it green. Still under reduced motion.
export function Sentence({ before, after, shown, state }) {
  const reduced = useReducedMotion();
  const breathe = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const first = useRef(true);

  useEffect(() => {
    if (reduced || state !== 'empty') { breathe.setValue(0); return undefined; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(breathe, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [state, reduced, breathe]);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (reduced || state === 'empty') return;
    pop.setValue(0.9);
    Animated.spring(pop, { toValue: 1, ...Motion.spring.pop, useNativeDriver: false }).start();
  }, [shown, state, reduced, pop]);

  const empty = state === 'empty';
  const ok = state === 'right';
  const blue = Colors.brand.primary;
  const gapStyle = {
    backgroundColor: empty
      ? breathe.interpolate({ inputRange: [0, 1], outputRange: [ColorUtils.rgba(blue, 0.06), ColorUtils.rgba(blue, 0.2)] })
      : ok ? ColorUtils.rgba(Colors.status.success, 0.14) : Colors.brand.soft,
    borderColor: empty
      ? breathe.interpolate({ inputRange: [0, 1], outputRange: [ColorUtils.rgba(blue, 0.45), blue] })
      : ok ? Colors.status.success : blue,
    borderStyle: empty ? 'dashed' : 'solid',
    transform: [{ scale: pop }],
  };
  const words = (t) => t.trim().split(/\s+/).filter(Boolean);
  return (
    <View style={styles.sentence} accessibilityLabel={`${before} blank ${after}`}>
      {words(before).map((w, k) => <Text key={`b${k}`} style={[TITLE, styles.sWord]}>{w}</Text>)}
      <Animated.View style={[styles.gapBox, gapStyle]}>
        <Text style={[TITLE, { color: ok ? Colors.status.successText : Colors.text.accent }]}>{shown || ' '}</Text>
      </Animated.View>
      {words(after).map((w, k) => <Text key={`a${k}`} style={[TITLE, styles.sWord]}>{w}</Text>)}
    </View>
  );
}

// ── Fill in the blank ─────────────────────────────────────────────────────────
function Blank({ task, onClose, onFinish }) {
  const { recordAnswer } = usePortal();
  const dock = useRef(null);
  const items = task.items;
  const [i, setI] = useState(0);
  const [word, setWord] = useState(null); // index into options
  const [tried, setTried] = useState([]); // option indexes that were wrong
  const [status, setStatus] = useState('idle');
  const [streak, setStreak] = useState(0);
  const [misses, setMisses] = useState(0);
  const tally = useRef({ answered: 0, firstTry: 0, hints: 0, breakthroughs: 0 });
  const item = items[i];
  const [before, after] = item.text.split('____');

  useEffect(() => { setWord(null); setTried([]); setStatus('idle'); setMisses(0); }, [i]);

  const entry = word != null ? item.options[word] : '';
  const right = status === 'right';
  const shown = right ? item.options[item.answer] : entry;

  const check = () => {
    if (!entry) return;
    const ok = entry.toLowerCase() === item.options[item.answer].toLowerCase();
    if (ok) {
      const usedHint = (dock.current?.level?.() || 0) > 0;
      const firstTry = misses === 0 && !usedHint;
      recordAnswer(item.topic, { firstTry, usedHint });
      setStatus('right');
      tally.current.answered += 1;
      tally.current.hints += dock.current?.level?.() || 0;
      if (firstTry) tally.current.firstTry += 1; else tally.current.breakthroughs += 1;
      const run = firstTry ? streak + 1 : 0;
      setStreak(run);
      dock.current?.correct({ firstTry, streak: run });
    } else {
      const k = item.options.findIndex((o) => o.toLowerCase() === entry.toLowerCase());
      if (k >= 0) setTried((t) => [...t, k]);
      setWord(null);
      setMisses((m) => m + 1);
      setStreak(0);
      dock.current?.wrong({ wrongCount: misses + 1 });
    }
  };

  const next = () => {
    if (i + 1 < items.length) setI(i + 1);
    else onFinish([`You filled in all ${items.length}.`, 'I noted where a nudge helped and where you flew.'], { ...tally.current });
  };

  return (
    <Page
      kind="practice"
      onClose={onClose}
      leave={{ hintsLeft: () => (dock.current?.left?.() ?? MAX_HINTS), onHint: () => dock.current?.hint?.() }}
      step={i + (right ? 1 : 0)}
      total={items.length}
      rail={<TutorDock ref={dock} kind="mcq" item={item} resetKey={`${task.id}-${i}`} />}
    >
      <Eyebrow>{task.title} · {i + 1} of {items.length}</Eyebrow>
      <Sentence before={before} after={after} shown={shown} state={right ? 'right' : entry ? 'filled' : 'empty'} />

      <View style={styles.bank} role="radiogroup" aria-label="Choose a word">
        {item.options.map((o, k) => (
          <Chip key={o} label={o} state={right && k === item.answer ? 'correct' : tried.includes(k) ? 'wrong' : word === k ? 'chosen' : 'open'} onPress={() => setWord(k)} />
        ))}
      </View>

      <Footer
        right={right}
        breakthrough={misses > 0 || (dock.current?.level?.() || 0) > 0}
        streak={streak}
        last={i + 1 >= items.length}
        onNext={next}
        missNote={misses > 0 ? 'Not quite. Your tutor has a nudge on the right.' : null}
        missTick={misses}
        checkDisabled={!entry}
        onCheck={check}
      />
    </Page>
  );
}

// ── Drag and drop (web) ───────────────────────────────────────────────────────
// Native HTML5 drag and drop on a View's DOM node. Touch and keyboard use the tap path
// that every exercise also has, so nothing depends on dragging.
export function Draggable({ id, disabled, children, style }) {
  const ref = useRef(null);
  useEffect(() => {
    if (Platform.OS !== 'web' || !ref.current) return undefined;
    const el = ref.current;
    el.setAttribute('draggable', disabled ? 'false' : 'true');
    const start = (e) => { e.dataTransfer.setData('text/plain', String(id)); e.dataTransfer.effectAllowed = 'move'; el.style.opacity = '0.45'; };
    const end = () => { el.style.opacity = ''; };
    el.addEventListener('dragstart', start);
    el.addEventListener('dragend', end);
    return () => { el.removeEventListener('dragstart', start); el.removeEventListener('dragend', end); };
  }, [id, disabled]);
  return <View ref={ref} style={[style, Platform.select({ web: { cursor: disabled ? 'default' : 'grab' } })]}>{children}</View>;
}

export function DropZone({ onDropId, children, style, activeStyle }) {
  const ref = useRef(null);
  const [over, setOver] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'web' || !ref.current) return undefined;
    const el = ref.current;
    const hover = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOver(true); };
    const leave = (e) => { if (!e.relatedTarget || !el.contains(e.relatedTarget)) setOver(false); };
    const drop = (e) => { e.preventDefault(); setOver(false); onDropId(e.dataTransfer.getData('text/plain')); };
    el.addEventListener('dragenter', hover);
    el.addEventListener('dragover', hover);
    el.addEventListener('dragleave', leave);
    el.addEventListener('drop', drop);
    return () => { el.removeEventListener('dragenter', hover); el.removeEventListener('dragover', hover); el.removeEventListener('dragleave', leave); el.removeEventListener('drop', drop); };
  }, [onDropId]);
  return <View ref={ref} style={[style, over && activeStyle]}>{children}</View>;
}

// ── Match pairs ───────────────────────────────────────────────────────────────
// Pick a term and it takes the next free colour; pick a meaning and it joins that term in
// the same colour and number. Link all five, then Check. Tap a linked tile to undo it.
export const PAIR_COLORS = [Colors.accent.blue.solid, Colors.accent.purple.solid, Colors.accent.orange.solid, Colors.accent.yellow.solid, '#2BC4B0'];

export function PairTile({ label, c, state, onPress, disabled, chip }) {
  const col = c != null ? PAIR_COLORS[c] : null;
  const ok = state === 'correct';
  const bad = state === 'wrong';
  const accent = ok ? Colors.status.success : bad ? Colors.status.dangerFill : col;
  // Tinted, not filled: the tile stays calm and the coloured badge carries the state.
  const border = accent || Colors.border.subtle;
  const bg = accent ? ColorUtils.rgba(accent, ok || bad ? 0.1 : 0.14) : Colors.surface.card;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      role="button"
      accessibilityLabel={`${label}${c != null ? `, pair ${c + 1}` : ''}${ok ? ', matched' : bad ? ', not a match' : ''}`}
      style={({ hovered, pressed }) => [styles.pair, chip && styles.pairChip, { borderColor: border, backgroundColor: bg }, state === 'idle' && hovered && { backgroundColor: Colors.surface.raised }, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <View style={[styles.pairNum, accent && { backgroundColor: accent, borderColor: accent }]}>
        {ok ? <Check size={14} strokeWidth={3.6} color="#FFFFFF" /> : bad ? <X size={14} strokeWidth={3.6} color="#FFFFFF" /> : c != null ? <Text style={styles.pairNumText}>{c + 1}</Text> : null}
      </View>
      <Text style={[styles.pairText, chip && { flex: 0 }]}>{label}</Text>
    </Pressable>
  );
}

function Match({ task, onClose, onFinish }) {
  const { recordAnswer } = usePortal();
  const dock = useRef(null);
  const pairs = task.pairs;
  const n = pairs.length;
  const [links, setLinks] = useState([]); // { t, m, c }
  const [active, setActive] = useState(null); // term waiting for its meaning
  const [verdict, setVerdict] = useState(null); // { [t]: true | false } after a check
  const [done, setDone] = useState(false);
  const [misses, setMisses] = useState(0);
  const tally = useRef({ answered: 0, firstTry: 0, hints: 0, breakthroughs: 0 });

  const freeColor = () => PAIR_COLORS.findIndex((_, c) => !links.some((l) => l.c === c));
  const linkOf = (key, k) => links.find((l) => l[key] === k);

  const tapTerm = (t) => {
    if (done) return;
    const l = linkOf('t', t);
    if (l) { setLinks((x) => x.filter((y) => y !== l)); setVerdict(null); return; }
    setActive(active === t ? null : t);
  };
  // Join a term to a meaning. Either one may already be linked: that link is replaced, and a
  // re-linked term keeps its colour.
  const linkPair = (t, m) => {
    if (done || t == null || m == null || Number.isNaN(t) || Number.isNaN(m)) return;
    setLinks((x) => {
      const old = x.find((l) => l.t === t);
      const rest = x.filter((l) => l.t !== t && l.m !== m);
      const used = (c) => rest.some((l) => l.c === c);
      const c = old ? old.c : PAIR_COLORS.findIndex((_, k) => !used(k));
      return [...rest, { t, m, c }];
    });
    setActive(null);
    setVerdict(null);
  };
  const tapMeaning = (m) => {
    if (done) return;
    const l = linkOf('m', m);
    if (l) { setLinks((x) => x.filter((y) => y !== l)); setVerdict(null); return; }
    if (active == null) return;
    linkPair(active, m);
  };
  const [mw, setMw] = useState(0);
  const [cur, setCur] = useState(0); // phone: which term is showing
  const stacked = mw > 0 && mw < 520; // phones: one term at a time
  const reset = () => { setLinks([]); setActive(null); setVerdict(null); setCur(0); };

  const check = () => {
    const v = {};
    links.forEach((l) => { v[l.t] = l.t === l.m; });
    const right = links.filter((l) => l.t === l.m).length;
    if (right === n) {
      const usedHint = (dock.current?.level?.() || 0) > 0;
      const firstTry = misses === 0 && !usedHint;
      pairs.forEach(() => recordAnswer(task.topic, { firstTry, usedHint }));
      tally.current = { answered: n, firstTry: firstTry ? n : 0, hints: dock.current?.level?.() || 0, breakthroughs: firstTry ? 0 : n };
      setVerdict(v);
      setDone(true);
      dock.current?.correct({ firstTry, streak: 0 });
    } else {
      setVerdict(v);
      setMisses((k) => k + 1);
      dock.current?.wrong({ wrongCount: misses + 1 });
    }
  };

  const nowColor = active != null ? freeColor() : null;
  const stateOf = (l) => (!verdict ? 'linked' : verdict[l.t] ? 'correct' : 'wrong');
  const rightCount = verdict ? Object.values(verdict).filter(Boolean).length : 0;
  const wrongShown = verdict && !done;

  return (
    <Page
      kind="practice"
      onClose={onClose}
      leave={{ hintsLeft: () => (dock.current?.left?.() ?? MAX_HINTS), onHint: () => dock.current?.hint?.() }}
      step={done ? n : links.length}
      total={n}
      rail={<TutorDock ref={dock} kind="mcq" item={{ text: 'Match each term to its meaning', ladder: task.ladder, topic: task.topic }} resetKey={task.id} />}
    >
      <Eyebrow>{task.title}</Eyebrow>
      <Text style={[TITLE, styles.q]}>Match each term to its meaning</Text>
      <View onLayout={(e) => setMw(e.nativeEvent.layout.width)} style={styles.matchWrap}>
        {stacked ? (
          /* Phone: one term at a time, with every meaning to choose from. */
          <View style={styles.stepper}>
            <View style={styles.stepDots} role="tablist" aria-label="Terms">
              {pairs.map((p, t) => {
                const l = linkOf('t', t);
                const st = l ? stateOf(l) : 'idle';
                const col = l ? PAIR_COLORS[l.c] : null;
                const ok = st === 'correct';
                const bad = st === 'wrong';
                const fill = ok ? Colors.status.success : bad ? Colors.status.dangerFill : col;
                return (
                  <Pressable
                    key={p.term}
                    onPress={() => !done && setCur(t)}
                    role="tab"
                    aria-selected={cur === t}
                    accessibilityLabel={`${p.term}${l ? ', linked' : ''}${ok ? ', matched' : bad ? ', not a match' : ''}`}
                    style={[styles.stepDot, cur === t && styles.stepDotOn, fill && { backgroundColor: fill, borderColor: fill }]}
                  >
                    {ok ? <Check size={16} strokeWidth={3.6} color="#FFFFFF" /> : bad ? <X size={16} strokeWidth={3.6} color="#FFFFFF" /> : <Text style={[styles.stepDotText, fill && { color: Colors.ink }]}>{t + 1}</Text>}
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.termCard}>
              <Text style={styles.termLabel}>Term {cur + 1} of {n}</Text>
              <Text style={styles.termWord}>{pairs[cur].term}</Text>
            </View>
            <View style={styles.matchCol} role="radiogroup" aria-label={`Meaning of ${pairs[cur].term}`}>
              {task.shuffle.map((m) => {
                const owner = linkOf('m', m);
                const mine = owner && owner.t === cur;
                const other = owner && owner.t !== cur;
                const st = mine ? stateOf(owner) : 'idle';
                return (
                  <OptionShell
                    key={pairs[m].meaning}
                    label={pairs[m].meaning}
                    compact
                    selected={mine && st === 'linked'}
                    result={mine && st === 'correct' ? 'correct' : mine && st === 'wrong' ? 'wrong' : undefined}
                    trailing={other ? pairs[owner.t].term : undefined}
                    disabled={done || !!other}
                    onPress={() => { linkPair(cur, m); setTimeout(() => setCur((c) => Math.min(c + 1, n - 1)), 260); }}
                    role="radio"
                  />
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.matchCols}>
            <View style={styles.matchCol} role="group" aria-label="Terms">
              {pairs.map((p, t) => {
                const l = linkOf('t', t);
                const isActive = active === t;
                return (
                  <Draggable key={p.term} id={`${t}`} disabled={done}>
                    <PairTile
                      label={p.term}
                      c={l ? l.c : isActive ? nowColor : null}
                      state={l ? stateOf(l) : isActive ? 'active' : 'idle'}
                      disabled={done}
                      onPress={() => tapTerm(t)}
                    />
                  </Draggable>
                );
              })}
            </View>
            <View style={styles.matchCol} role="group" aria-label="Meanings">
              {task.shuffle.map((m) => {
                const l = linkOf('m', m);
                return (
                  <DropZone key={pairs[m].meaning} onDropId={(id) => linkPair(parseInt(String(id), 10), m)} activeStyle={styles.pairOver}>
                    <PairTile
                      label={pairs[m].meaning}
                      c={l ? l.c : null}
                      state={l ? stateOf(l) : 'idle'}
                      disabled={done || (!l && active == null)}
                      onPress={() => tapMeaning(m)}
                    />
                  </DropZone>
                );
              })}
            </View>
          </View>
        )}
      </View>
      <Footer
        right={done}
        breakthrough={misses > 0}
        streak={0}
        last
        onNext={() => onFinish([`You matched all ${n}.`, 'I noted the pairs that took a second try.'], tally.current)}
        missNote={wrongShown ? `Not quite. ${rightCount} of ${n} match.` : null}
        missTick={misses}
        checkDisabled={links.length !== n}
        onCheck={check}
        onReset={!done && (links.length > 0 || active != null) ? reset : null}
      />
    </Page>
  );
}

// ── Put in order ──────────────────────────────────────────────────────────────
// Drag a step into a slot (or onto another slot to swap), or just tap: a tapped step goes
// to the first free slot, and tapping a placed step sends it back.
function Order({ task, onClose, onFinish }) {
  const { recordAnswer } = usePortal();
  const dock = useRef(null);
  const items = task.items;
  const [i, setI] = useState(0);
  const item = items[i];
  const n = item.steps.length;
  const [slots, setSlots] = useState(Array(n).fill(null)); // step index or null, by position
  const [status, setStatus] = useState('idle');
  const [placed, setPlaced] = useState(null); // how many were in the right place after a miss
  const [misses, setMisses] = useState(0);
  const [streak, setStreak] = useState(0);
  const tally = useRef({ answered: 0, firstTry: 0, hints: 0, breakthroughs: 0 });
  const right = status === 'right';

  useEffect(() => { setSlots(Array(items[i].steps.length).fill(null)); setStatus('idle'); setPlaced(null); setMisses(0); }, [i, items]);

  const bank = item.shuffle.filter((k) => !slots.includes(k));
  const filled = slots.every((k) => k != null);

  const place = (k, pos) => {
    if (right || k == null || Number.isNaN(k)) return;
    setSlots((prev) => {
      const next = [...prev];
      const from = next.indexOf(k);
      const displaced = next[pos];
      if (from >= 0) next[from] = displaced == null ? null : displaced; // swap with where it came from
      next[pos] = k;
      return next;
    });
    setPlaced(null);
  };
  const unplace = (k) => {
    if (right) return;
    setSlots((prev) => prev.map((x) => (x === k ? null : x)));
    setPlaced(null);
  };
  const tapBank = (k) => { const pos = slots.indexOf(null); if (pos >= 0) place(k, pos); };
  const reset = () => { setSlots(Array(n).fill(null)); setPlaced(null); };

  const check = () => {
    const hits = slots.filter((k, pos) => k === pos).length;
    if (hits === n) {
      const usedHint = (dock.current?.level?.() || 0) > 0;
      const firstTry = misses === 0 && !usedHint;
      recordAnswer(item.topic, { firstTry, usedHint });
      setStatus('right');
      tally.current.answered += 1;
      tally.current.hints += dock.current?.level?.() || 0;
      if (firstTry) tally.current.firstTry += 1; else tally.current.breakthroughs += 1;
      const run = firstTry ? streak + 1 : 0;
      setStreak(run);
      dock.current?.correct({ firstTry, streak: run });
    } else {
      setPlaced(hits);
      setMisses((m) => m + 1);
      setStreak(0);
      dock.current?.wrong({ wrongCount: misses + 1 });
    }
  };

  const next = () => {
    if (i + 1 < items.length) setI(i + 1);
    else onFinish([`You ordered all ${items.length}.`, 'I noted where a nudge helped.'], { ...tally.current });
  };

  return (
    <Page
      kind="practice"
      onClose={onClose}
      leave={{ hintsLeft: () => (dock.current?.left?.() ?? MAX_HINTS), onHint: () => dock.current?.hint?.() }}
      step={i + (right ? 1 : 0)}
      total={items.length}
      rail={<TutorDock ref={dock} kind="mcq" item={item} resetKey={`${task.id}-${i}`} />}
    >
      <Eyebrow>{task.title} · {i + 1} of {items.length}</Eyebrow>
      <Text style={[TITLE, styles.q]}>{item.text}</Text>

      <View style={styles.slots} role="list" aria-label="Your order">
        {slots.map((k, pos) => (
          <View key={pos} style={styles.slotRow}>
            <View style={[styles.slotNum, right && { backgroundColor: Colors.status.success, borderColor: Colors.status.success }]}>
              <Text style={[styles.slotNumText, right && { color: '#FFFFFF' }]}>{pos + 1}</Text>
            </View>
            <DropZone onDropId={(id) => place(parseInt(String(id), 10), pos)} style={{ flex: 1 }} activeStyle={styles.slotOver}>
              {k != null ? (
                <Draggable id={k} disabled={right}>
                  <OptionShell label={item.steps[k]} compact hug result={right ? 'correct' : undefined} disabled={right} onPress={() => unplace(k)} role="button" />
                </Draggable>
              ) : (
                <View style={styles.slotEmpty}><Text style={styles.slotHint}>Drop a step here</Text></View>
              )}
            </DropZone>
          </View>
        ))}
      </View>

      {!right && bank.length > 0 && (
        <DropZone onDropId={(id) => unplace(parseInt(String(id), 10))} style={styles.bankBlock} activeStyle={styles.bankOver}>
          <Text style={SUB}>Drag a step into place, or tap it.</Text>
          <View style={styles.bank}>
            {bank.map((k) => (
              <Draggable key={k} id={k} style={styles.hugWrap}>
                <OptionShell label={item.steps[k]} compact hug onPress={() => tapBank(k)} role="button" />
              </Draggable>
            ))}
          </View>
        </DropZone>
      )}

      <Footer
        right={right}
        breakthrough={misses > 0 || (dock.current?.level?.() || 0) > 0}
        streak={streak}
        last={i + 1 >= items.length}
        onNext={next}
        missNote={placed != null ? `Not quite. ${placed} of ${n} in the right place.` : null}
        missTick={misses}
        checkDisabled={!filled}
        onCheck={check}
        onReset={!right && (placed != null || slots.some((k) => k != null)) ? reset : null}
      />
    </Page>
  );
}

// ── Speaking (voice-first) ────────────────────────────────────────────────────
function Speak({ task, onClose, onFinish }) {
  const dock = useRef(null);
  const [phase, setPhase] = useState('ready'); // ready | recording | recorded
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (phase !== 'recording') return undefined;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const stop = () => {
    setPhase('recorded');
    dock.current?.hint();
  };
  const start = () => { setSecs(0); setPhase('recording'); };
  const mmss = `0:${String(secs).padStart(2, '0')}`;

  return (
    <Page
      kind="speak"
      onClose={onClose}
      leave={{ hintsLeft: () => null, onHint: () => dock.current?.hint?.() }}
      step={phase === 'recorded' ? 1 : 0}
      total={2}
      rail={<TutorDock ref={dock} kind="speak" probes={task.probes} probesHi={task.probesHi} resetKey={task.id} />}
    >
      <Eyebrow>{task.title}</Eyebrow>
      <Text style={[TITLE, styles.q]}>{task.prompt}</Text>

      <View style={styles.recorder}>
        {/* One line per state. While recording the button is red and shows the live beat;
            nothing is transcribed on screen. */}
        <Text style={[SUB, styles.centerText]} accessibilityLiveRegion="polite">
          {phase === 'ready' && 'Your tutor listens, then asks.'}
          {phase === 'recording' && 'Say it to the board.'}
          {phase === 'recorded' && `Recorded ${mmss}. Tutor has a question.`}
        </Text>
        {phase === 'recording' ? (
          <Button variant="danger" onPress={stop} accessibilityLabel={`Stop recording, ${mmss}`} style={styles.cta}>
            <Beats color={Colors.ink} />
          </Button>
        ) : (
          <Button title={phase === 'recorded' ? 'Record again' : 'Start speaking'} variant={phase === 'recorded' ? 'outline' : 'primary'} onPress={start} style={styles.cta} />
        )}
      </View>

      <FooterBar>
        <Button title="Finish" variant="success" disabled={phase !== 'recorded'} onPress={() => onFinish(['You said it out loud, and that is the hard part.', 'Faculty see that you rehearsed, not what you said.'])} style={styles.action} />
      </FooterBar>
    </Page>
  );
}

// ── Writing ───────────────────────────────────────────────────────────────────
function Write({ task, onClose, onFinish }) {
  const dock = useRef(null);
  const [text, setText] = useState(task.starter || '');
  const [checked, setChecked] = useState(false);
  const [focus, setFocus] = useState(false);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const check = () => {
    if (words < 4) {
      dock.current?.say("Write a bit more first. Even rough is fine, and then I'll ask you something about it.");
      return;
    }
    setChecked(true);
    dock.current?.hint();
  };

  return (
    <Page
      kind="write"
      onClose={onClose}
      leave={{ hintsLeft: () => null, onHint: () => dock.current?.hint?.() }}
      step={checked ? 1 : 0}
      total={2}
      rail={<TutorDock ref={dock} kind="write" probes={task.probes} probesHi={task.probesHi} resetKey={task.id} />}
    >
      <Eyebrow>{task.title}</Eyebrow>
      <Text style={[TITLE, styles.q]}>{task.prompt}</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        multiline
        placeholder="Write your answer here"
        placeholderTextColor={Colors.text.placeholder}
        style={[styles.area, focus && { borderColor: Colors.brand.primary }, Platform.OS === 'web' && { outlineStyle: 'none' }]}
      />
      <FooterBar>
        <Text style={[SUB, { flex: 1 }]}>{words} words</Text>
        <Button title="Check my draft" variant="outline" onPress={check} style={styles.action} />
        <Button title="Finish" variant="success" disabled={!checked || words < 8} onPress={() => onFinish(['Draft saved.', 'I asked what to cut; I did not rewrite it for you. That was all you.'])} style={styles.action} />
      </FooterBar>
    </Page>
  );
}

// ── Code lab ──────────────────────────────────────────────────────────────────
const FIXED = /range\(\s*1\s*,\s*(6|5\s*\+\s*1)\s*\)|range\(\s*6\s*\)/;

// The editor is always dark, in either theme: code reads best light-on-dark and it should
// look like a place to work. The font is Geist Mono (loaded in App.js).
const ED = {
  bg: '#1B1C21', bar: '#24252B', line: '#2E3038', gutter: '#6B7280', text: '#D8DADF',
  keyword: '#C586C0', builtin: '#DCDCAA', number: '#B5CEA8', string: '#CE9178', comment: '#6A9955',
  ok: '#89E219', bad: '#FF7878',
};
const MONO = Platform.select({ web: "'Geist Mono', ui-monospace, Menlo, Consolas, monospace", default: 'Courier' });
const LINE_H = 24;
const KEYWORDS = /^(for|in|if|else|elif|while|def|return|import|from|and|or|not|True|False|None|class|pass|break|continue)$/;
const BUILTINS = /^(print|range|len|int|str|input|sum|min|max)$/;

// A light Python colouring: comment, string, number, keyword, builtin. Per line, so a bad
// guess can never shift the layout (the text itself is always the same characters).
function highlight(line) {
  const out = [];
  const re = /(#.*$)|("[^"]*"|'[^']*')|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)|(\s+|.)/g;
  let m; let k = 0;
  while ((m = re.exec(line)) !== null) {
    const [t, com, str, num, word] = m;
    let color = ED.text;
    if (com) color = ED.comment;
    else if (str) color = ED.string;
    else if (num) color = ED.number;
    else if (word) color = KEYWORDS.test(word) ? ED.keyword : BUILTINS.test(word) ? ED.builtin : ED.text;
    out.push(<Text key={k++} style={{ color }}>{t}</Text>);
  }
  return out;
}

// ── Code lab ──────────────────────────────────────────────────────────────────
function Code({ task, onClose, onFinish }) {
  const { recordAnswer } = usePortal();
  const tutorUI = React.useContext(TutorUI);
  const dock = useRef(null);
  const [code, setCode] = useState(task.starter);
  const [out, setOut] = useState(null);
  const [runs, setRuns] = useState(0);
  const [focus, setFocus] = useState(false);
  const fixed = FIXED.test(code);
  const solved = out === task.expected;
  const name = 'AI Tutor';
  const lines = code.split('\n');
  const rows = Math.max(lines.length, 8);

  const run = () => {
    const nextRuns = runs + 1;
    setRuns(nextRuns);
    if (fixed) {
      setOut(task.expected);
      recordAnswer('Loops', { firstTry: false, usedHint: true });
      dock.current?.codeFixed();
    } else {
      setOut(task.buggyOutput);
      if (nextRuns === 1) dock.current?.hint();
    }
  };
  const reset = () => { setCode(task.starter); setOut(null); };

  return (
    <Page
      kind="code"
      onClose={onClose}
      leave={{ hintsLeft: () => null, onHint: () => dock.current?.hint?.() }}
      step={solved ? 1 : 0}
      total={2}
      rail={<TutorDock ref={dock} kind="code" probes={task.probes} probesHi={task.probesHi} resetKey={task.id} />}
    >
      <Eyebrow>{task.title}</Eyebrow>
      <Text style={[TITLE, styles.q]}>{task.prompt}</Text>

      <View style={[styles.editor, focus && { borderColor: Colors.brand.primary }]}>
        <View style={styles.edBar}>
          <Terminal size={18} color={ED.gutter} strokeWidth={2.2} />
          <Text style={styles.edFile}>main.py</Text>
          <View style={styles.edLang}><Text style={styles.edLangText}>Python</Text></View>
          <View style={{ flex: 1 }} />
          <Pressable onPress={reset} accessibilityRole="button" accessibilityLabel="Reset code to the start" style={({ hovered, pressed }) => [styles.edBtn, hovered && { backgroundColor: ED.line }, pressed && { transform: [{ scale: 0.97 }] }]}>
            <RotateCcw size={16} color={ED.text} strokeWidth={2.4} />
            <Text style={styles.edBtnText}>Reset</Text>
          </Pressable>
          <Pressable onPress={run} accessibilityRole="button" accessibilityLabel="Run the code" style={({ hovered, pressed }) => [styles.edRun, hovered && { opacity: 0.92 }, pressed && { transform: [{ scale: 0.97 }] }]}>
            <Play size={16} color={Colors.brand.onPrimary} fill={Colors.brand.onPrimary} strokeWidth={2.4} />
            <Text style={styles.edRunText}>Run</Text>
          </Pressable>
        </View>

        <View style={styles.edBody}>
          <View style={styles.gutter} aria-hidden="true">
            {lines.map((_, n) => <Text key={n} style={styles.gutterNum}>{n + 1}</Text>)}
          </View>
          <View style={[styles.codeBox, { height: rows * LINE_H }]}>
            {Platform.OS === 'web' ? (
              <Text pointerEvents="none" style={[styles.codeText, styles.codeUnder]} aria-hidden="true">
                {lines.map((l, n) => <Text key={n}>{highlight(l)}{n < lines.length - 1 ? '\n' : ''}</Text>)}
              </Text>
            ) : null}
            <TextInput
              value={code}
              onChangeText={(v) => { setCode(v); setOut(null); }}
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              multiline
              scrollEnabled={false}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              accessibilityLabel="Python code"
              cursorColor={ED.text}
              style={[styles.codeText, styles.codeInput, Platform.OS === 'web' ? { color: 'transparent', caretColor: ED.text, outlineStyle: 'none', whiteSpace: 'pre', overflow: 'hidden' } : { color: ED.text }]}
            />
          </View>
        </View>

        <View style={[styles.edOut, { position: 'relative' }]}>
          <View style={[styles.dot, { backgroundColor: out == null ? ED.gutter : solved ? ED.ok : ED.bad }]} />
          <Text style={[styles.outText, solved && { color: ED.ok }, out != null && !solved && { color: ED.bad }]} accessibilityLiveRegion="polite">
            {out == null ? 'Run the code to see what it prints.' : solved ? out : `${out}  (expected ${task.expected})`}
          </Text>
        </View>
      </View>

      <FooterBar>
        <View style={{ flex: 1 }} />
        <Button title={`Ask ${name}`} variant="outline" onPress={() => { tutorUI.open(); dock.current?.hint?.(); }} style={styles.action} />
        <Button title="Finish" variant="success" disabled={!solved} onPress={() => onFinish(['Bug found and fixed.', 'Logged as a breakthrough: you spotted the off-by-one yourself.'])} style={styles.action} />
      </FooterBar>
    </Page>
  );
}

const styles = StyleSheet.create({
  // The title column starts at the same x on every screen. Back / close hang in the gutter to its left.
  top: { flexDirection: 'row', alignItems: 'center', minHeight: CONTROL, position: 'relative' },
  close: { position: 'absolute', left: -(CONTROL + 12), top: 0, width: CONTROL, height: CONTROL, borderRadius: Radii.control.md, alignItems: 'center', justifyContent: 'center' },
  closeInline: { position: 'relative', left: 0, marginRight: Space[8] },
  progress: { flex: 1 },

  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: Space[12] },
  q: { marginTop: Space[20], marginBottom: Space[28], fontFamily: FontFamilies.demi, fontSize: Platform.select({ web: 'clamp(17px, 0.3vw + 15px, 20px)', default: 18 }), lineHeight: Platform.select({ web: 'clamp(25px, 0.4vw + 22px, 29px)', default: 26 }) },
  options: { gap: Space[16] },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: Space[12], marginTop: Space[32], minHeight: 48 },
  banner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Space[12] },
  bannerIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.status.success, alignItems: 'center', justifyContent: 'center' },
  action: { minWidth: 148 },
  footDock: { ...Platform.select({ web: { position: 'fixed' }, default: { position: 'absolute' } }), bottom: 0, zIndex: 8, backgroundColor: Colors.surface.page, borderTopWidth: 2, borderTopColor: Colors.border.hairline },
  footInner: { width: '100%', maxWidth: 800, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: Space[12], paddingVertical: Space[12], minHeight: 72 },
  snackWrap: { position: 'absolute', left: 0, right: 0, bottom: '100%', marginBottom: Space[12], paddingHorizontal: Space[16] },
  snack: { flexDirection: 'row', alignItems: 'center', gap: Space[12], paddingLeft: Space[16], paddingRight: Space[8], paddingVertical: Space[14], minHeight: 56, borderRadius: 8, backgroundColor: '#26343B' },
  snackIcon: { width: 24, height: 24, flexShrink: 0, borderRadius: 12, backgroundColor: Colors.status.dangerFill, alignItems: 'center', justifyContent: 'center' },
  snackText: { flex: 1, fontFamily: FontFamilies.medium, fontSize: fs(16), lineHeight: lh(22), color: '#FFFFFF' },
  snackX: { width: 36, height: 36, borderRadius: 6, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  tutorBtn: { width: 48, height: 48, marginLeft: Space[8], borderRadius: Radii.control.md, alignItems: 'center', justifyContent: 'center' },
  unread: { position: 'absolute', top: 6, right: 6, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.status.dangerFill, borderWidth: 2, borderColor: Colors.surface.page },
  sheet: { ...Platform.select({ web: { position: 'fixed' }, default: { position: 'absolute' } }), top: 0, left: 0, right: 0, bottom: 0, zIndex: 110, backgroundColor: Colors.surface.card },
  sheetBack: { width: 44, height: 44, flexShrink: 0, borderRadius: Radii.control.md, alignItems: 'center', justifyContent: 'center' },
  editor: { borderRadius: Radii.card.default, borderWidth: 2, borderColor: ED.line, backgroundColor: ED.bg, overflow: 'hidden' },
  edBar: { flexDirection: 'row', alignItems: 'center', gap: Space[10], paddingHorizontal: Space[16], minHeight: 56, backgroundColor: ED.bar, borderBottomWidth: 2, borderBottomColor: ED.line },
  edFile: { fontFamily: MONO, fontSize: fs(15), color: ED.text },
  edLang: { paddingHorizontal: Space[10], height: 24, justifyContent: 'center', borderRadius: 5, backgroundColor: 'rgba(28,176,246,0.16)' },
  edLangText: { fontFamily: FontFamilies.demi, fontSize: fs(15), letterSpacing: 0.4, color: '#49C0F8' },
  edBtn: { flexDirection: 'row', alignItems: 'center', gap: Space[8], minHeight: 40, paddingHorizontal: Space[12], borderRadius: Radii.control.md },
  edBtnText: { fontFamily: FontFamilies.demi, fontSize: fs(15), color: ED.text },
  edRun: { flexDirection: 'row', alignItems: 'center', gap: Space[8], minHeight: 40, paddingHorizontal: Space[16], borderRadius: Radii.control.md, backgroundColor: Colors.brand.primary },
  edRunText: { fontFamily: FontFamilies.demi, fontSize: fs(15), color: Colors.brand.onPrimary },
  edBody: { flexDirection: 'row', paddingVertical: Space[16] },
  gutter: { width: 52, paddingRight: Space[12], alignItems: 'flex-end' },
  gutterNum: { fontFamily: MONO, fontSize: fs(15), lineHeight: LINE_H, color: ED.gutter },
  codeBox: { flex: 1, position: 'relative', paddingRight: Space[16], minWidth: 0 },
  codeText: { fontFamily: MONO, fontSize: fs(15), lineHeight: LINE_H, padding: 0, margin: 0, letterSpacing: 0, color: ED.text },
  codeUnder: { position: 'absolute', left: 0, top: 0, right: 0, ...Platform.select({ web: { whiteSpace: 'pre' } }) },
  codeInput: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderWidth: 0, backgroundColor: 'transparent', textAlignVertical: 'top' },
  edOut: { flexDirection: 'row', alignItems: 'center', gap: Space[12], paddingHorizontal: Space[16], paddingVertical: Space[14], backgroundColor: '#141519', borderTopWidth: 2, borderTopColor: ED.line },
  dot: { width: 10, height: 10, borderRadius: 5 },
  outText: { flex: 1, fontFamily: MONO, fontSize: fs(15), lineHeight: lh(22), color: ED.text },
  sentence: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 6, marginTop: Space[20], marginBottom: Space[28] },
  sWord: { lineHeight: lh(36) },
  gapBox: { minWidth: 112, height: 40, paddingHorizontal: Space[12], borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: Space[12] },
  hugWrap: { maxWidth: '100%' },
  chip: { minHeight: CONTROL, paddingHorizontal: Space[20], justifyContent: 'center', borderRadius: Radii.control.md, borderWidth: 2, borderColor: Colors.border.subtle, backgroundColor: Colors.surface.card },
  chipChosen: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.soft },
  chipCorrect: { borderColor: Colors.status.success, backgroundColor: Colors.status.successSoft },
  chipTaken: { opacity: 0.45 },
  chipWrong: { backgroundColor: Colors.surface.raised, opacity: 0.7 },
  chipText: { fontFamily: FontFamilies.demi, fontSize: fs(16), color: Colors.text.primary },
  typed: { marginTop: Space[20], marginBottom: 0, maxWidth: 360 },
  matchCols: { flexDirection: 'row', gap: Space[16], alignItems: 'flex-start', alignSelf: 'stretch' },
  matchCol: { flex: 1, gap: Space[12], minWidth: 0 },
  slots: { gap: Space[10] },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: Space[12] },
  slotNum: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: Colors.border.control, alignItems: 'center', justifyContent: 'center' },
  slotNumText: { fontFamily: FontFamilies.demi, fontSize: fs(15), color: Colors.text.secondary },
  slotEmpty: { minHeight: 60, borderRadius: Radii.option, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.border.subtle, justifyContent: 'center', paddingHorizontal: Space[16] },
  slotHint: { fontFamily: FontFamilies.medium, fontSize: fs(15), color: Colors.text.muted },
  slotOver: { borderRadius: Radii.option, backgroundColor: Colors.brand.soft },
  bankOver: { borderRadius: Radii.card.default, backgroundColor: Colors.surface.raised },
  resetBtn: { minWidth: 120 },
  matchWrap: { alignSelf: 'stretch' },
  stepper: { gap: Space[20] },
  stepDots: { flexDirection: 'row', justifyContent: 'space-between', gap: Space[8] },
  stepDot: { flex: 1, maxWidth: 56, height: 44, borderRadius: 8, borderWidth: 2, borderColor: Colors.border.control, alignItems: 'center', justifyContent: 'center' },
  stepDotOn: { borderWidth: 3, borderColor: Colors.text.primary },
  stepDotText: { fontFamily: FontFamilies.demi, fontSize: fs(16), color: Colors.text.secondary },
  termCard: { alignItems: 'center', gap: Space[4], paddingVertical: Space[20], borderRadius: Radii.card.default, backgroundColor: Colors.surface.raised },
  termLabel: { fontFamily: FontFamilies.medium, fontSize: fs(15), color: Colors.text.secondary },
  termWord: { fontFamily: FontFamilies.heavy, fontSize: fs(28), lineHeight: lh(34), color: Colors.text.primary },
  pairOver: { borderRadius: Radii.option, backgroundColor: Colors.brand.soft },
  pair: { flexDirection: 'row', alignItems: 'center', gap: Space[12], minHeight: 60, paddingHorizontal: Space[14], paddingVertical: Space[10], borderRadius: Radii.option, borderWidth: 2, ...Platform.select({ web: { cursor: 'pointer', transitionProperty: 'background-color, border-color', transitionDuration: '180ms', transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' } }) },
  pairNum: { width: 28, height: 28, flexShrink: 0, borderRadius: 14, borderWidth: 2, borderColor: Colors.border.control, alignItems: 'center', justifyContent: 'center' },
  pairNumText: { fontFamily: FontFamilies.demi, fontSize: fs(15), color: Colors.ink },
  pairChip: { alignSelf: 'flex-start', minHeight: 48, paddingVertical: Space[6] },
  pairText: { flex: 1, minWidth: 0, fontFamily: FontFamilies.medium, fontSize: fs(16), lineHeight: lh(22), color: Colors.text.primary },
  bankBlock: { gap: Space[12], marginTop: Space[24] },
  cta: { alignSelf: 'center', minWidth: 220, marginTop: Space[12] },

  letter: { width: 28, height: 28, flexShrink: 0, borderRadius: Radii.control.sm, borderWidth: 2, alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { transitionProperty: 'background-color, border-color', transitionDuration: '180ms', transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' } }) },
  letterText: { fontFamily: FontFamilies.demi, fontSize: fs(15) },

  recorder: { ...cardBox, alignItems: 'center', gap: Space[12], padding: Space[40] },

  area: {
    minHeight: 220,
    padding: Space[16],
    borderRadius: Radii.option,
    borderWidth: 2,
    borderColor: Colors.border.hairline,
    backgroundColor: Colors.surface.card,
    color: Colors.text.primary,
    fontFamily: FontFamilies.medium,
    fontSize: fs(15),
    lineHeight: lh(24),
    textAlignVertical: 'top',
  },
  mono: { fontFamily: Platform.select({ web: 'ui-monospace, Menlo, monospace', default: 'Courier' }), fontSize: fs(15), lineHeight: lh(22), color: Colors.text.primary },
  console: { gap: Space[4], padding: Space[20], borderRadius: Radii.option, backgroundColor: Colors.surface.raised, marginTop: Space[16] },

  complete: { gap: Space[12], alignItems: 'center', paddingTop: Space[64] },
  medalWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: Space[12] },
  medal: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.brand.soft, alignItems: 'center', justifyContent: 'center' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: Space[12], justifyContent: 'center', alignSelf: 'stretch', marginTop: Space[12] },
  tile: { flexGrow: 1, flexBasis: 150, maxWidth: 220, alignItems: 'center', gap: Space[2], paddingVertical: Space[16], paddingHorizontal: Space[12], borderRadius: Radii.card.default, borderWidth: 2, borderColor: Colors.border.subtle, backgroundColor: Colors.surface.card },
  tileLabel: { fontFamily: FontFamilies.medium, fontSize: fs(15), color: Colors.text.secondary },
  skill: { alignSelf: 'center', width: '100%', maxWidth: 460, marginTop: Space[12] },
  skillTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  centerText: { textAlign: 'center' },
});
