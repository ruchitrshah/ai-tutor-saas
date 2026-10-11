// The timed exam. 36 questions, one at a time, of four kinds (multiple choice, fill in the
// blank, put in order, match pairs). A countdown sits at the top right, a bar fills as you
// go, and there are no hints and no feedback until the end. Skip moves on; running out of
// time ends it. Whatever is wrong goes to Revisions as modules to improve on.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, FontFamilies, Motion, Radii, Space, useReducedMotion } from '../brand';
import Button from '../components/Button';
import OptionShell from '../components/OptionShell';
import { findSubject } from '../data/courses';
import { EXAM_GRADIENT, EXAM_MINUTES, EXAM_QUESTIONS, examFor, shuffled } from '../data/exams';
import { usePortal } from '../store/portal';
import { SUB, TITLE } from '../theme/type';
import { Clock } from '../ui/icons';
import { SUBJECT_STYLE } from '../ui/kinds';
import Mascot from '../ui/Mascot';
import Reveal from '../ui/Reveal';
import { Chip, Draggable, DropZone, FooterBar, Letter, Page, Sentence } from './Task';
import { fs, lh } from '../theme/fluid';

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// ── The four kinds, each controlled by `value` and `onChange` ─────────────────
function Mcq({ q, seed, value, onChange }) {
  const opts = useMemo(() => shuffled(q.options, seed).map(([o]) => o), [q, seed]);
  return (
    <View style={styles.options} role="radiogroup" aria-label={q.text}>
      {opts.map((o, k) => (
        <OptionShell key={o} lead={<Letter letter={'ABCD'[k]} state={value === o ? 'chosen' : 'open'} />} label={o} selected={value === o} onPress={() => onChange(o)} role="radio" />
      ))}
    </View>
  );
}

function Blank({ q, seed, value, onChange }) {
  const [before, after] = q.text.split('____');
  const opts = useMemo(() => shuffled(q.options, seed).map(([o]) => o), [q, seed]);
  return (
    <>
      <Sentence before={before} after={after} shown={value || ''} state={value ? 'filled' : 'empty'} />
      <View style={styles.bank} role="radiogroup" aria-label="Choose a word">
        {opts.map((o) => <Chip key={o} label={o} state={value === o ? 'chosen' : 'open'} onPress={() => onChange(o)} />)}
      </View>
    </>
  );
}

// value: array by position of original step indexes (null when empty).
function Order({ q, seed, value, onChange }) {
  const n = q.steps.length;
  const slots = value || Array(n).fill(null);
  const order = useMemo(() => shuffled(q.steps, seed).map(([, i]) => i), [q, seed]);
  const bank = order.filter((k) => !slots.includes(k));
  const place = (k, pos) => {
    if (k == null || Number.isNaN(k)) return;
    const next = [...slots];
    const from = next.indexOf(k);
    const displaced = next[pos];
    if (from >= 0) next[from] = displaced == null ? null : displaced;
    next[pos] = k;
    onChange(next);
  };
  const unplace = (k) => onChange(slots.map((x) => (x === k ? null : x)));
  return (
    <>
      <View style={styles.slots} role="list" aria-label="Your order">
        {slots.map((k, pos) => (
          <View key={pos} style={styles.slotRow}>
            <View style={styles.slotNum}><Text style={styles.slotNumText}>{pos + 1}</Text></View>
            <DropZone onDropId={(id) => place(parseInt(String(id), 10), pos)} style={{ flex: 1 }} activeStyle={styles.slotOver}>
              {k != null ? (
                <Draggable id={k}><OptionShell label={q.steps[k]} compact hug onPress={() => unplace(k)} role="button" /></Draggable>
              ) : (
                <View style={styles.slotEmpty}><Text style={styles.slotHint}>Drop a step here</Text></View>
              )}
            </DropZone>
          </View>
        ))}
      </View>
      {bank.length > 0 && (
        <DropZone onDropId={(id) => unplace(parseInt(String(id), 10))} style={styles.bankBlock} activeStyle={styles.bankOver}>
          <Text style={SUB}>Drag a step into place, or tap it.</Text>
          <View style={styles.bank}>
            {bank.map((k) => (
              <Draggable key={k} id={k} style={{ maxWidth: '100%' }}>
                <OptionShell label={q.steps[k]} compact hug onPress={() => { const pos = slots.indexOf(null); if (pos >= 0) place(k, pos); }} role="button" />
              </Draggable>
            ))}
          </View>
        </DropZone>
      )}
    </>
  );
}

// value: { [term index]: meaning index }.
function Match({ q, seed, value, onChange }) {
  const v = value || {};
  const meanings = useMemo(() => shuffled(q.pairs.map((p) => p[1]), seed), [q, seed]); // [[text, originalIndex]]
  return (
    <View style={styles.matchRows}>
      {q.pairs.map(([term], t) => (
        <View key={term} style={styles.matchRow}>
          <Text style={styles.matchTerm}>{term}</Text>
          <View style={styles.bank} role="radiogroup" aria-label={`Meaning of ${term}`}>
            {meanings.map(([m, mi]) => {
              const mine = v[t] === mi;
              const taken = !mine && Object.values(v).includes(mi);
              return <Chip key={m} label={m} state={mine ? 'chosen' : taken ? 'taken' : 'open'} onPress={() => onChange({ ...v, [t]: mi })} />;
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const isAnswered = (q, a) => {
  if (q.type === 'order') return Array.isArray(a) && a.every((k) => k != null);
  if (q.type === 'match') return a && Object.keys(a).length === q.pairs.length;
  return a != null;
};
const isRight = (q, a) => {
  if (!isAnswered(q, a)) return false;
  if (q.type === 'order') return a.every((k, pos) => k === pos);
  if (q.type === 'match') return q.pairs.every((_, t) => a[t] === t);
  return a === q.options[0];
};

// The countdown. Turns red in the last five minutes; the text always carries the time.
function Timer({ left }) {
  const low = left <= 300;
  return (
    <View style={styles.timer} accessibilityRole="timer" accessibilityLabel={`${mmss(left)} left`}>
      <Clock size={18} color={low ? Colors.status.danger : Colors.icon.secondary} strokeWidth={2.4} />
      <Text style={[styles.timerText, low && { color: Colors.status.danger }]}>{mmss(left)}</Text>
    </View>
  );
}

export default function Exam() {
  const { route, go, addExamRevisions, addExamAttempt } = usePortal();
  const subject = findSubject(route.subjectId);
  const questions = useMemo(() => examFor(subject.id), [subject.id]);
  const total = questions.length;
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const [left, setLeft] = useState(EXAM_MINUTES * 60);
  const [result, setResult] = useState(null);
  const started = useRef(Date.now());
  const finished = useRef(false);

  const finish = useCallback((final, secondsUsed) => {
    if (finished.current) return;
    finished.current = true;
    let score = 0;
    const byTopic = {};
    questions.forEach((q, k) => {
      if (isRight(q, final[k])) score += 1;
      else byTopic[q.topic] = (byTopic[q.topic] || 0) + 1;
    });
    const firstTask = subject.tasks[0] ? subject.tasks[0].id : undefined;
    const items = Object.entries(byTopic).map(([topic, count]) => ({
      id: `ex-${subject.id}-${topic}`,
      title: topic,
      count,
      text: `${count} ${count === 1 ? 'mistake' : 'mistakes'} in the ${subject.name} exam, today`,
      play: { subjectId: subject.id, taskId: firstTask },
    }));
    if (items.length) {
      addExamRevisions({ id: `exam-${subject.id}-${Date.now()}`, course: subject.name, code: subject.code, week: 'Exam', accent: SUBJECT_STYLE[subject.id]?.accent || 'blue', items });
    }
    addExamAttempt(subject.id, score, secondsUsed);
    setResult({ score, secondsUsed, topics: items.length, topicNames: items.map((x) => x.title) });
  }, [questions, subject, addExamRevisions, addExamAttempt]);

  // The clock follows real time, so a throttled tab cannot give extra minutes.
  const answersRef = useRef(answers);
  answersRef.current = answers;
  useEffect(() => {
    if (result) return undefined;
    const t = setInterval(() => {
      const used = Math.floor((Date.now() - started.current) / 1000);
      const remaining = Math.max(0, EXAM_MINUTES * 60 - used);
      setLeft(remaining);
      if (remaining === 0) finish(answersRef.current, EXAM_MINUTES * 60);
    }, 1000);
    return () => clearInterval(t);
  }, [result, finish]);

  const q = questions[i];
  const a = answers[i];
  const set = (val) => setAnswers((x) => ({ ...x, [i]: val }));
  const next = () => {
    if (i + 1 < total) setI(i + 1);
    else finish(answers, Math.floor((Date.now() - started.current) / 1000));
  };

  if (result) {
    return (
      <Page kind="practice" onClose={() => go('challenge')} step={total} total={total} continuous>
        <Result subject={subject} result={result} onRevisions={() => go('revisions')} onBack={() => go('challenge')} />
      </Page>
    );
  }

  return (
    <Page
      kind="practice"
      onClose={() => go('challenge')}
      leave={{ exam: true, hintsLeft: () => -1 }}
      step={i}
      total={total}
      continuous
      headerRight={<Timer left={left} />}
    >
      <Text style={SUB}>{subject.name} · Question {i + 1} of {total}</Text>
      <Text style={[TITLE, styles.q]}>{q.type === 'blank' ? 'Fill in the blank' : q.text}</Text>
      <View key={i}>
        {q.type === 'mcq' && <Mcq q={q} seed={i} value={a} onChange={set} />}
        {q.type === 'blank' && <Blank q={q} seed={i} value={a} onChange={set} />}
        {q.type === 'order' && <Order q={q} seed={i} value={a} onChange={set} />}
        {q.type === 'match' && <Match q={q} seed={i} value={a} onChange={set} />}
      </View>
      <FooterBar>
        <Button title="Skip" variant="ghost" onPress={next} />
        <View style={{ flex: 1 }} />
        <Button title={i + 1 < total ? 'Next' : 'Finish Exam'} disabled={!isAnswered(q, a)} onPress={next} style={styles.action} />
      </FooterBar>
    </Page>
  );
}

// The result: one coloured card, centred, with the score, the time, which topics went to
// Revisions, and two ways on.
function Result({ subject, result, onRevisions, onBack }) {
  const reduced = useReducedMotion();
  const [a, b] = EXAM_GRADIENT[subject.id] || EXAM_GRADIENT.a;
  const good = result.score >= EXAM_QUESTIONS * 0.6;
  const shown = result.topicNames.slice(0, 4);
  const more = result.topicNames.length - shown.length;
  return (
    <View style={styles.resultWrap}>
      <LinearGradient colors={[a, b]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.resultCard}>
        <Reveal y={6} scaleFrom={0.9} duration={360}>
          <Mascot head live size={120} gesture={{ name: good ? 'cheer' : 'offer', id: 1 }} />
        </Reveal>
        <Reveal delay={reduced ? 0 : 140}>
          <Text style={styles.scoreLabel}>{subject.name}</Text>
          <Text style={styles.score}>{result.score}<Text style={styles.scoreOf}> / {EXAM_QUESTIONS}</Text></Text>
          <Text style={styles.scoreSub}>Finished in {mmss(result.secondsUsed)}</Text>
        </Reveal>
        {result.topicNames.length ? (
          <Reveal delay={reduced ? 0 : 220} style={styles.topics}>
            <Text style={styles.topicsTitle}>Added to Revisions</Text>
            <View style={styles.topicRow}>
              {shown.map((t) => <View key={t} style={styles.topic}><Text style={styles.topicText} numberOfLines={1}>{t}</Text></View>)}
              {more > 0 ? <View style={styles.topic}><Text style={styles.topicText}>+{more} more</Text></View> : null}
            </View>
          </Reveal>
        ) : null}
        <Reveal delay={reduced ? 0 : 300} style={styles.resultActions}>
          <Button title="See Revisions" variant="white" onPress={onRevisions} style={styles.full} />
          <Button title="Back to Challenge" variant="ghost" labelColor="#FFFFFF" onPress={onBack} style={styles.full} />
        </Reveal>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  q: { marginTop: Space[16], marginBottom: Space[24], fontFamily: FontFamilies.demi, fontSize: Platform.select({ web: 'clamp(17px, 0.3vw + 15px, 20px)', default: 18 }), lineHeight: Platform.select({ web: 'clamp(25px, 0.4vw + 22px, 29px)', default: 26 }) },
  options: { gap: Space[12] },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: Space[12] },
  action: { minWidth: 148 },
  slots: { gap: Space[10] },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: Space[12] },
  slotNum: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: Colors.border.control, alignItems: 'center', justifyContent: 'center' },
  slotNumText: { fontFamily: FontFamilies.demi, fontSize: fs(15), color: Colors.text.secondary },
  slotEmpty: { minHeight: 60, borderRadius: Radii.option, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.border.subtle, justifyContent: 'center', paddingHorizontal: Space[16] },
  slotHint: { fontFamily: FontFamilies.medium, fontSize: fs(15), color: Colors.text.muted },
  slotOver: { borderRadius: Radii.option, backgroundColor: Colors.brand.soft },
  bankBlock: { gap: Space[12], marginTop: Space[24] },
  bankOver: { borderRadius: Radii.card.default, backgroundColor: Colors.surface.raised },
  matchRows: { gap: Space[24] },
  matchRow: { gap: Space[10] },
  matchTerm: { fontFamily: FontFamilies.demi, fontSize: fs(18), lineHeight: lh(26), color: Colors.text.primary },
  timer: { flexDirection: 'row', alignItems: 'center', gap: Space[6], minWidth: 76, marginLeft: Space[12], justifyContent: 'flex-end' },
  timerText: { fontFamily: FontFamilies.demi, fontSize: fs(17), color: Colors.text.primary },
  resultWrap: { alignItems: 'center', paddingTop: Space[16] },
  resultCard: { width: '100%', maxWidth: 520, alignItems: 'center', gap: Space[16], paddingVertical: Space[32], paddingHorizontal: Space[24], borderRadius: Radii.dialog },
  scoreLabel: { fontFamily: FontFamilies.demi, fontSize: fs(15), letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  score: { fontFamily: FontFamilies.heavy, fontSize: fs(64), lineHeight: lh(72), color: '#FFFFFF', textAlign: 'center' },
  scoreOf: { fontSize: fs(28), color: 'rgba(255,255,255,0.8)' },
  scoreSub: { fontFamily: FontFamilies.medium, fontSize: fs(17), color: 'rgba(255,255,255,0.92)', textAlign: 'center', marginTop: Space[4] },
  topics: { alignSelf: 'stretch', alignItems: 'center', gap: Space[8], padding: Space[16], borderRadius: Radii.card.default, backgroundColor: 'rgba(0,0,0,0.16)' },
  topicsTitle: { fontFamily: FontFamilies.demi, fontSize: fs(16), color: '#FFFFFF' },
  topicRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Space[8] },
  topic: { maxWidth: '100%', height: 34, paddingHorizontal: Space[12], justifyContent: 'center', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)' },
  topicText: { fontFamily: FontFamilies.demi, fontSize: fs(15), color: '#FFFFFF' },
  resultActions: { alignSelf: 'stretch', gap: Space[8], marginTop: Space[8] },
  full: { alignSelf: 'stretch' },
});
