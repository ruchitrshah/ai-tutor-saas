// The tutor. It owns the whole right-hand column. Top to bottom:
//
//   header      who they are · "Chat" / "Voice" (changes only the bottom area)
//   transcript  one conversation, always: what you said (typed or spoken) and
//               what the tutor said, as chat bubbles
//   bottom      voice: hints used, suggestions, "Tap to talk"
//               chat:  suggestions, the message field
//   footer      language (dropdown) · voice output (off by default)
//
// A tutor reply is ONE bubble from the moment you send until it is fully shown:
// the bubble is created at its final size, three dots sit in it while the tutor
// "thinks", then they fade and the words arrive. Nothing swaps, nothing jumps.
//
// The parent can make the tutor speak (`ref.say`) or hand out the next hint
// (`ref.hint`) — the MCQ player does this after a wrong answer.
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CONTROL, Colors, FontFamilies, Motion, Radii, Space, useReducedMotion } from '../brand';
import { usePortal } from '../store/portal';
import { titleCase } from './text';
import { greeting, onCodeFixed, onCorrect, onWrong, recap, reply, startChips } from '../tutor/engine';
import { SUB, TITLE } from '../theme/type';
import TutorAvatar from './TutorAvatar';
import Breathe from './Breathe';
import Button from '../components/Button';
import { ArrowRight, ArrowUp, Check, Heart, MessageCircle, Mic, MorphIcon, Search, data } from './icons';
import Reveal from './Reveal';
import { fs, lh } from '../theme/fluid';

// What the student "says" when we can't use a real microphone.
const DEMO_UTTERANCE = { en: "I'm stuck. Can you help me?", hi: 'Main atak gaya hoon, help karo.' };
const LANGS = [
  { key: 'en', label: 'English' },
  { key: 'hi', label: 'Hinglish' },
];
export const MAX_HINTS = 3;
// How many hints a session allows: Warm Up three, Stretch two, Challenge one.
export const maxHintsFor = (level) => ({ 1: 3, 2: 2, 3: 1 }[level] || MAX_HINTS);
const MAX_CHARS = 1000;
const THINK_MS = 1100;
const LINE = 22;
const FIELD_PAD = 10;
const MAX_LINES = 5;

const hasSTT = () =>
  Platform.OS === 'web' && typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

// Browser voices vary a lot, so choose the most natural one that is installed:
// neural / "natural" / online voices first, Indian English preferred (it reads
// Roman-script Hinglish best), then a warm female UK/US voice. Speak a sentence at
// a time with a breath between them, because one long utterance sounds like a reader.
let voiceCache = null;
function pickVoice() {
  if (voiceCache) return voiceCache;
  const list = window.speechSynthesis.getVoices();
  if (!list.length) return null;
  const score = (v) => {
    let n = 0;
    if (/en[-_]IN/i.test(v.lang)) n += 4;
    else if (/en[-_](GB|US|AU)/i.test(v.lang)) n += 2;
    else if (/^en/i.test(v.lang)) n += 1;
    if (/natural|neural|online|enhanced|premium/i.test(v.name)) n += 5;
    if (/neerja|veena|samantha|karen|serena|aria|jenny|google uk english female|google us english/i.test(v.name)) n += 3;
    if (!v.localService) n += 1;
    return n;
  };
  voiceCache = [...list].sort((x, y) => score(y) - score(x))[0] || null;
  return voiceCache;
}

function speak(text, muted) {
  if (muted || Platform.OS !== 'web' || typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const plain = text.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
    const parts = plain.match(/[^.!?]+[.!?]*/g) || [plain];
    const voice = pickVoice();
    parts.forEach((part, i) => {
      const u = new window.SpeechSynthesisUtterance(part.trim());
      if (voice) u.voice = voice;
      u.lang = voice?.lang || 'en-IN';
      u.rate = /[!]$/.test(part.trim()) ? 1.06 : 1.0; // a little lift on the happy lines
      u.pitch = /[!]$/.test(part.trim()) ? 1.08 : 1.02;
      synth.speak(u);
      if (i < parts.length - 1) {
        const gap = new window.SpeechSynthesisUtterance(' ');
        gap.volume = 0;
        gap.rate = 2;
        synth.speak(gap);
      }
    });
  } catch (e) {
    /* speech is a nicety, never a dependency */
  }
}
if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => { voiceCache = null; };
}

const TutorDock = forwardRef(function TutorDock(
  { kind = 'mcq', item, probes, probesHi, locked = false, resetKey, intro, onSays, leading },
  ref
) {
  const { lang, setLang, recordHint, recordAnswerRequest, user, route } = usePortal();
  const maxHints = maxHintsFor(route && route.level);
  const name = user.name.split(' ')[0];
  const reduced = useReducedMotion();
  const firstChips = startChips(lang, kind);

  const [mode, setMode] = useState('voice');
  const [messages, setMessages] = useState([]);
  const [chips, setChips] = useState(firstChips);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [muted, setMuted] = useState(true); // voice output is opt-in
  const [hintsShown, setHintsShown] = useState(0);
  const [talking, setTalking] = useState(false); // the tutor's words are arriving
  const [reaction, setReaction] = useState(null); // { name, id }: a one-off gesture
  const react = useCallback((name) => setReaction((r) => ({ name, id: (r ? r.id : 0) + 1 })), []);
  const [draft, setDraft] = useState(''); // survives switching voice <-> chat

  const level = useRef(0);
  const phase = useRef(null); // 'reflect' right after a correct answer
  const streakRef = useRef(0);
  const saysRef = useRef(onSays);
  saysRef.current = onSays;
  const probeCtx = useRef({ kind, item, probes, probesHi });
  probeCtx.current = { kind, item, probes, probesHi };
  const recogRef = useRef(null);
  const heard = useRef('');
  const liveId = useRef(null);
  const timers = useRef([]);
  const idSeq = useRef(0);
  const scrollRef = useRef(null);
  const seen = useRef(new Set());

  const later = useCallback((fn, ms) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  }, []);
  const nextId = () => {
    idSeq.current += 1;
    return String(idSeq.current);
  };

  const bump = useCallback(() => {
    level.current += 1;
    setHintsShown(level.current);
    recordHint();
  }, [recordHint]);

  // The tutor says something. The bubble exists immediately at its final size in
  // the "thinking" state; after `delay` it turns into the message.
  const deliver = useCallback(
    (out, lead, delay = THINK_MS) => {
      const id = nextId();
      setMessages((m) => [...m, { id, from: 'tutor', lead: lead || out.lead, body: out.text, state: 'thinking' }]);
      setThinking(true);
      later(() => {
        setMessages((m) => m.map((x) => (x.id === id ? { ...x, state: 'shown' } : x)));
        setThinking(false);
        if (saysRef.current) saysRef.current();
        const words = (out.text || '').split(/\s+/).length;
        setTalking(true);
        later(() => setTalking(false), reduced ? 0 : Math.min(5200, 500 + words * 85));
        if (out.hint) bump();
        if (out.redirect) recordAnswerRequest();
        if (out.chips) setChips(out.chips);
        if ('phase' in out) phase.current = out.phase;
        speak(lead ? `${lead} ${out.text}` : out.text, muted);
      }, reduced ? 0 : delay);
    },
    [later, bump, recordAnswerRequest, muted, reduced]
  );

  // New question / new task: start the thread over, with an opening line.
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    level.current = 0;
    setHintsShown(0);
    setThinking(false);
    liveId.current = null;
    setListening(false);
    setChips(locked ? [] : firstChips);
    phase.current = null;
    const qIndex = Number(String(resetKey || '').split('-').pop()) || 0;
    const opening = intro || greeting(kind, { name, lang, qIndex }, locked);
    setMessages([{ id: nextId(), from: 'tutor', body: opening, state: 'shown', still: true }]);
    return () => {
      try { window.speechSynthesis?.cancel(); } catch (e) { /* noop */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, locked, kind]);

  // A message that has played its entrance never plays it again.
  useEffect(() => {
    messages.forEach((m) => seen.current.add(m.id));
  }, [messages]);

  // What the engine needs to know right now.
  const ctxNow = useCallback(
    () => ({ ...probeCtx.current, name, lang, level: level.current, phase: phase.current, streak: streakRef.current }),
    [name, lang]
  );

  // The tutor answers something the student said or typed.
  const askTutor = useCallback(
    (clean) => {
      deliver(reply(clean, ctxNow()));
    },
    [deliver, ctxNow]
  );

  // Send something typed (or a suggestion chip).
  const respond = useCallback(
    (text) => {
      const clean = text.trim();
      if (locked || !clean || thinking) return;
      setMessages((m) => [...m, { id: nextId(), from: 'me', body: clean, state: 'shown' }]);
      askTutor(clean);
    },
    [locked, thinking, askTutor]
  );

  useImperativeHandle(
    ref,
    () => ({
      // The student answered right. info: { firstTry, streak }
      correct: (info = {}) => {
        streakRef.current = info.streak ?? 0;
        react('cheer');
        deliver(onCorrect({ ...ctxNow(), firstTry: info.firstTry, streak: info.streak }), undefined, 600);
      },
      // The student picked a wrong option. info: { wrongCount }
      wrong: (info = {}) => {
        if (locked) return;
        streakRef.current = 0;
        react('oops');
        deliver(onWrong({ ...ctxNow(), wrongCount: info.wrongCount || 1 }));
      },
      // A Socratic question or hint (speaking, writing and code use this).
      hint: () => {
        if (locked) return;
        react('offer');
        deliver(reply('hint', ctxNow()));
      },
      codeFixed: () => { react('cheer'); deliver(onCodeFixed(ctxNow()), undefined, 600); },
      say: (text) => deliver({ text }, undefined, 500),
      level: () => level.current,
      left: () => maxHints - level.current,
    }),
    [locked, deliver, ctxNow, react, maxHints]
  );

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    try { recogRef.current?.abort?.(); } catch (e) { /* noop */ }
  }, []);

  // ── Voice ─────────────────────────────────────────────────────────────────
  // Speech lives in ONE bubble: created when the mic opens, filled as words arrive,
  // and kept as the final message. If nothing was said, it simply goes away.
  const setLiveBody = useCallback((body) => {
    const id = liveId.current;
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, body } : x)));
  }, []);
  const finishListening = useCallback((utterance) => {
    setListening(false);
    const id = liveId.current;
    liveId.current = null;
    const clean = (utterance || '').trim();
    if (!id) return;
    if (!clean) {
      setMessages((m) => m.filter((x) => x.id !== id));
      return;
    }
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, body: clean, live: false } : x)));
    askTutor(clean);
  }, [askTutor]);

  const toggleMic = useCallback(() => {
    if (locked || thinking) return;
    if (listening) {
      if (recogRef.current) { try { recogRef.current.stop(); } catch (e) { finishListening(heard.current); } }
      else finishListening(DEMO_UTTERANCE[lang]);
      return;
    }
    heard.current = '';
    const id = nextId();
    liveId.current = id;
    setMessages((m) => [...m, { id, from: 'me', body: '', live: true, state: 'shown' }]);
    setListening(true);
    if (hasSTT()) {
      try {
        const R = window.SpeechRecognition || window.webkitSpeechRecognition;
        const r = new R();
        r.lang = 'en-IN';
        r.interimResults = true; // the transcript grows as you speak
        r.continuous = true;
        r.onresult = (e) => {
          let t = '';
          for (let i = 0; i < e.results.length; i += 1) t += e.results[i][0].transcript;
          heard.current = t;
          setLiveBody(t);
        };
        r.onerror = () => { recogRef.current = null; finishListening(heard.current || DEMO_UTTERANCE[lang]); };
        r.onend = () => { recogRef.current = null; finishListening(heard.current); };
        recogRef.current = r;
        r.start();
        return;
      } catch (e) {
        recogRef.current = null;
      }
    }
    // No microphone support (or no permission): fake it so the flow is testable.
    later(() => finishListening(DEMO_UTTERANCE[lang]), 1800);
  }, [locked, thinking, listening, lang, finishListening, later, setLiveBody]);

  const canSend = !thinking;

  // The voice button arrives ~2.5s after the tutor has finished, not with the message.
  const [askReady, setAskReady] = useState(false);
  useEffect(() => {
    if (thinking || listening) { setAskReady(false); return undefined; }
    const t = setTimeout(() => setAskReady(true), reduced ? 0 : 2500);
    return () => clearTimeout(t);
  }, [thinking, listening, messages.length, reduced, resetKey]);

  // Voice: the way to reply sits right under the latest message, so the conversation
  // reads top to bottom and the next move is where your eyes already are.
  const voiceFooter = !locked && mode === 'voice' && (askReady || listening) ? (
    <Reveal key="voice-footer" y={8} duration={240} style={styles.inline}>
      {kind === 'mcq' ? <HintRow left={maxHints - hintsShown} max={maxHints} lang={lang} disabled={!canSend} onPress={(t) => respond(t)} /> : null}
      <Chipset chips={chips} onPick={(c) => respond(c)} disabled={!canSend} />
      <AskButton listening={listening} onPress={toggleMic} />
    </Reveal>
  ) : null;

  const status = locked ? 'Off during the quiz' : listening ? 'Listening' : 'Thinking';

  return (
    <View style={styles.dock}>
      <View style={[styles.head, leading && styles.headLead]}>
        {leading}
        <TutorHeading
          compact={!!leading}
          status={locked || listening || thinking ? status : null}
          mood={listening ? 'listen' : thinking ? 'think' : talking ? 'speak' : 'idle'}
          reaction={reaction}
        />
        {!locked && (
          <Pressable
            onPress={() => setMode((m) => (m === 'voice' ? 'chat' : 'voice'))}
            accessibilityRole="button"
            accessibilityLabel={mode === 'voice' ? 'Switch to typing' : 'Switch to voice'}
            style={({ hovered, pressed }) => [styles.switch, hovered && { backgroundColor: Colors.surface.raised }, pressed && { transform: [{ scale: Motion.pressScale }] }]}
          >
            <MorphIcon icon={mode === 'voice' ? data.MessageCircle : data.Mic} size={18} color={Colors.icon.primary} strokeWidth={2.2} spring="snappy" reducedMotion="user" />
            <Text style={styles.switchText}>{mode === 'voice' ? 'Chat' : 'Voice'}</Text>
          </Pressable>
        )}
      </View>

      <Transcript
        footer={voiceFooter}
        mode={mode}
        messages={messages}
        seen={seen.current}
        scrollRef={scrollRef}
        reduced={reduced}
      />

      {!locked && mode === 'chat' && (
        <Reveal key="chat-bottom" y={8} duration={200} style={styles.bottom}>
          {kind === 'mcq' ? <HintRow left={maxHints - hintsShown} max={maxHints} lang={lang} disabled={!canSend} onPress={(t) => respond(t)} /> : null}
          <Chipset chips={chips} onPick={(c) => respond(c)} disabled={!canSend} />
          <Composer value={draft} onChange={setDraft} onSend={(t) => { setDraft(''); respond(t); }} busy={thinking} />
        </Reveal>
      )}

      <View style={styles.foot}>
        <LangMenu lang={lang} onChange={setLang} />
        <VoiceToggle muted={muted} onToggle={() => { setMuted((m) => !m); try { window.speechSynthesis?.cancel(); } catch (e) { /* noop */ } }} />
      </View>
    </View>
  );
});

export default TutorDock;

// A short note shown in the same column once a task is done, so the layout
// does not move when the task ends.
export function TutorRecap({ message }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 350); return () => clearTimeout(t); }, []);
  return (
    <View style={styles.dock}>
      <View style={styles.head}>
        <TutorHeading status="Task complete" mood="idle" reaction={{ name: 'cheer', id: 1 }} />
      </View>
      <View style={styles.list}>
        <Bubble m={{ id: 'recap', from: 'tutor', body: message, state: on ? 'shown' : 'thinking' }} animate />
      </View>
    </View>
  );
}

// ── Transcript ───────────────────────────────────────────────────────────────

// Voice reads like a transcript, top to bottom: it starts at the top and fills down.
// Chat behaves like a messenger: anchored to the bottom, growing upward.
function Transcript({ mode, footer, messages, seen, scrollRef, reduced }) {
  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={[styles.list, { justifyContent: mode === 'chat' ? 'flex-end' : 'flex-start' }]}
      showsVerticalScrollIndicator={false}
      // New content (a bubble arriving, words filling in) keeps the end in view.
      onContentSizeChange={() => scrollRef.current?.scrollToEnd?.({ animated: !reduced })}
      role="log"
      aria-live="polite"
      aria-label="Conversation with your tutor"
    >
      {messages.map((m) => (
        <Bubble key={m.id} m={m} animate={!seen.has(m.id) && !m.still} />
      ))}
      {footer}
    </ScrollView>
  );
}

// One chat bubble. Tutor bubbles carry a small orb and keep a single identity
// from "thinking" to "shown"; mine are blue and sit on the right.
function Bubble({ m, animate }) {
  const mine = m.from === 'me';
  const thinking = m.state === 'thinking';
  return (
    <Reveal
      y={animate ? 10 : 0}
      scaleFrom={animate ? 0.97 : 1}
      duration={animate ? 240 : 1}
      delay={animate && !mine ? 140 : 0}
      style={[styles.row, mine ? styles.rowMe : styles.rowTutor, Platform.OS === 'web' && { transformOrigin: mine ? 'bottom right' : 'bottom left' }]}
    >
      {!mine && <Orb small />}
      <View style={[styles.msg, mine ? styles.msgMe : styles.msgTutor]}>
        {m.lead ? <Text style={[styles.lead, thinking && { opacity: 0 }]}>{m.lead.replace(/\*\*/g, '')}</Text> : null}
        {mine ? (
          // While the mic is open and nothing has been heard yet, the bubble waits with dots.
          m.live && !m.body ? <View style={{ minWidth: 40, height: LINE, justifyContent: 'center' }}><DotsInline color={Colors.text.secondary} /></View> : <Text style={styles.msgTextMe}>{m.body}</Text>
        ) : (
          <>
            <TypeIn text={m.body} hidden={thinking} animate={animate} style={styles.msgText} />
            <Dots on={thinking} />
          </>
        )}
      </View>
    </Reveal>
  );
}

// The tutor's name over a short resting line (an invitation, not a status). Real states
// (Listening, Thinking, Off during the quiz) replace it while they last, and are announced
// politely. The line swaps with a quick lift-and-fade (old out fast, new in a touch slower).
const NUDGES = {
  en: ['Need a hand?', 'What are you thinking?', 'Let me help', 'Be curious', 'You can do it', 'Take your time'],
  hi: ['Haath chahiye?', 'Kya soch rahe ho?', 'Main hoon na', 'Curious raho', 'Tum kar loge', 'Aaram se karo'],
};

function TutorHeading({ status, mood = 'idle', reaction = null, compact = false }) {
  const { lang } = usePortal();
  const reduced = useReducedMotion();
  const name = 'AI Tutor';
  // Resting line: the first invitation, held still. Real states replace it while they last.
  const line = status || (NUDGES[lang] || NUDGES.en)[0];
  const v = useRef(new Animated.Value(1)).current;
  const y = useRef(new Animated.Value(0)).current;
  const first = useRef(true);
  const shown = useRef(line);
  const [text, setText] = useState(line);

  // Swap: out (140ms), change the words, in (240ms). Ease-out both ways.
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    if (shown.current === line) return undefined;
    shown.current = line;
    if (reduced) { setText(line); return undefined; }
    const native = Platform.OS !== 'web';
    let alive = true;
    Animated.parallel([
      Animated.timing(v, { toValue: 0, duration: 140, easing: Motion.ease.out, useNativeDriver: native }),
      Animated.timing(y, { toValue: -6, duration: 140, easing: Motion.ease.out, useNativeDriver: native }),
    ]).start(() => {
      if (!alive) return;
      setText(line);
      y.setValue(6);
      Animated.parallel([
        Animated.timing(v, { toValue: 1, duration: 240, easing: Motion.ease.out, useNativeDriver: native }),
        Animated.timing(y, { toValue: 0, duration: 240, easing: Motion.ease.out, useNativeDriver: native }),
      ]).start();
    });
    // Frames pause in background tabs; never leave the old words up.
    const guard = setTimeout(() => { if (alive) { setText(line); v.setValue(1); y.setValue(0); } }, 700);
    return () => { alive = false; clearTimeout(guard); };
  }, [line, reduced, v, y]);

  return (
    <>
    <View style={{ height: 48, justifyContent: 'center' }}>
      <TutorAvatar size={compact ? 40 : 44} />
    </View>
    <View style={styles.headText}>
      <Text style={styles.tutorName} numberOfLines={1}>{name}</Text>
      <Animated.Text
        numberOfLines={1}
        accessibilityLiveRegion={status ? 'polite' : 'none'}
        style={[SUB, { opacity: v, transform: reduced ? [] : [{ translateY: y }] }]}
      >
        {text}
      </Animated.Text>
    </View>
    </>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────────

// The small avatar beside a tutor bubble: the chosen character, still.
function Orb() {
  return <TutorAvatar size={32} />;
}

// Words arrive one after another once the bubble is no longer `hidden`. Unrevealed
// words keep their space (opacity 0), so the bubble never reflows while it fills.
// **Double asterisks** highlight a phrase (the same convention Rilla's bubbles use).
// Plays once per message.
function tokens(text) {
  const out = [];
  text.split(/(\*\*[^*]+\*\*)/g).forEach((part) => {
    const bold = part.startsWith('**');
    const body = bold ? part.slice(2, -2) : part;
    // A part that begins right after a highlight with no space (". I'll...") is glued
    // to it, so punctuation never gets a space in front of it.
    const glued = out.length > 0 && body.length > 0 && !/^\s/.test(body);
    body.split(' ').forEach((w, i) => { if (w) out.push({ w, bold, glue: glued && i === 0 }); });
  });
  return out;
}

function TypeIn({ text, hidden, animate, style }) {
  const reduced = useReducedMotion();
  const [anim] = useState(animate && !reduced);
  const words = useMemo(() => tokens(text), [text]);
  const [n, setN] = useState(anim ? 0 : words.length);

  useEffect(() => {
    if (!anim || hidden) return undefined;
    const t = setInterval(() => {
      setN((k) => {
        if (k + 1 >= words.length) clearInterval(t);
        return k + 1;
      });
    }, 30);
    return () => clearInterval(t);
  }, [anim, hidden, words.length]);

  return (
    <Text style={style} accessibilityLabel={hidden ? '' : text.replace(/\*\*/g, '')}>
      {words.map((t, i) => (
        <Text key={i} style={[{ opacity: !hidden && i < n ? 1 : 0 }, t.bold && styles.highlight]}>
          {t.w}
          {i < words.length - 1 && !words[i + 1].glue ? ' ' : ''}
        </Text>
      ))}
    </Text>
  );
}

// The thinking dots live *inside* the bubble, pinned to its first line, and fade
// out as the words arrive. The bubble never changes size or identity.
function Dots({ on }) {
  const fade = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: on ? 1 : 0, duration: on ? 160 : 120, easing: Motion.ease.out, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [on, fade]);
  return (
    <Animated.View pointerEvents="none" style={[styles.dotsPin, { opacity: fade }]}>
      <DotsInline color={Colors.text.secondary} run={on} />
    </Animated.View>
  );
}

// Three dots rising in turn: "working on it".
function DotsInline({ color, run = true }) {
  const reduced = useReducedMotion();
  const vals = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (reduced || !run) return undefined;
    const loops = vals.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(v, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
          Animated.timing(v, { toValue: 0, duration: 300, easing: Easing.in(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
          Animated.delay(420 - i * 140),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [reduced, run, vals]);
  return (
    <View style={styles.dotsRow} accessibilityLabel="Your tutor is thinking">
      {vals.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.thinkDot,
            { backgroundColor: color },
            { opacity: reduced ? 0.7 : v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }), transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] },
          ]}
        />
      ))}
    </View>
  );
}

// The message field. One control, 44px at rest, built so that every state lines up:
//
//   rest      44px: 1px border + 10px + one 22px line + 10px + 1px border. The text
//             and placeholder sit on the same baseline the send button is centred on.
//   typing    grows a line at a time to five lines, then scrolls inside itself. The
//             send button stays pinned to the bottom-right corner (3px inset).
//   focus     border to blue and a soft ring, eased 160ms.
//
// The textarea carries NO vertical padding of its own (the wrapper does), so its
// measured height is the text's height and nothing is counted twice. It is
// measured on web by collapsing it first, so it can also shrink when text is deleted.
//
// Edge cases handled:
//   empty / whitespace-only  → send disabled, Enter does nothing (no blank bubble)
//   Enter sends, Shift+Enter → new line; Enter during IME composition never sends
//   very long text           → hard cap, a counter appears near it, never overflows
//   one huge unbroken word   → wraps instead of widening the field
//   tutor still replying     → you can keep typing; send waits (no double-send)
//   after sending            → field clears, height resets, focus stays
//   paste with newlines      → kept; trimmed at the ends only
//   switching to voice       → the draft is kept (state lives in the dock)
export function Composer({ value, onChange, onSend, busy, placeholder = 'Message your tutor', autoFocus = true }) {
  const [focus, setFocus] = useState(false);
  const [h, setH] = useState(LINE);
  const input = useRef(null);
  const trimmed = value.trim();
  const can = trimmed.length > 0 && !busy;
  const maxText = LINE * MAX_LINES;
  const near = value.length >= MAX_CHARS * 0.85;

  // Web: collapse, read the real content height, restore. Runs before paint.
  useLayoutEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = input.current;
    if (!el || !el.style) return;
    const prev = el.style.height;
    el.style.height = '0px';
    const sh = el.scrollHeight;
    el.style.height = prev;
    setH(Math.min(maxText, Math.max(LINE, sh)));
  }, [value, maxText]);

  // Arriving from voice, you can just start typing: no extra click.
  useEffect(() => {
    if (!autoFocus) return undefined;
    const t = setTimeout(() => input.current?.focus?.(), 90);
    return () => clearTimeout(t);
  }, []);

  const send = () => {
    if (!can) return;
    onSend(trimmed);
    requestAnimationFrame?.(() => input.current?.focus?.());
  };

  return (
    <View>
      <View style={styles.composerRow}>
      <View style={[styles.composer, focus && styles.composerFocus]}>
        <View style={styles.inputWrap}>
          <TextInput
            ref={input}
            value={value}
            onChangeText={(t) => onChange(t.slice(0, MAX_CHARS))}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            // Native fallback; web is measured above.
            onContentSizeChange={(e) => { if (Platform.OS !== 'web') setH(Math.min(maxText, Math.max(LINE, Math.ceil(e.nativeEvent.contentSize.height)))); }}
            placeholder={placeholder}
            placeholderTextColor={Colors.text.placeholder}
            accessibilityLabel={placeholder}
            multiline
            maxLength={MAX_CHARS}
            blurOnSubmit={false}
            scrollEnabled={h >= maxText}
            selectionColor={Colors.brand.primary}
            cursorColor={Colors.brand.primary}
            onKeyPress={(e) => {
              const k = e.nativeEvent;
              if (k.key === 'Enter' && !k.shiftKey && !k.isComposing && k.keyCode !== 229) {
                e.preventDefault?.();
                send();
              }
            }}
            style={[styles.input, { height: h }, Platform.OS === 'web' && styles.inputWeb]}
          />
        </View>
      </View>
      <SendButton can={can} busy={busy} onPress={send} />
      </View>
      {near && (
        <Text style={[styles.counter, value.length >= MAX_CHARS && { color: Colors.status.danger }]} accessibilityLiveRegion="polite">
          {value.length} / {MAX_CHARS}
        </Text>
      )}
    </View>
  );
}

// The send button sits beside the field, not inside it, and stays put as the field grows
// (pinned to the bottom edge). Blue when there is something to send; flat grey otherwise,
// and while the tutor is still replying.
function SendButton({ can, busy, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!can}
      accessibilityRole="button"
      accessibilityLabel={busy ? 'Send message (your tutor is replying)' : 'Send message'}
      accessibilityState={{ disabled: !can }}
      style={({ pressed }) => [
        styles.send,
        { backgroundColor: can ? Colors.brand.primary : Colors.surface.raised },
        Platform.select({ web: { transitionProperty: 'background-color, transform', transitionDuration: '140ms', transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' } }),
        pressed && can && { transform: [{ scale: 0.95 }] },
      ]}
    >
      <ArrowUp size={20} strokeWidth={2.6} color={can ? Colors.brand.onPrimary : Colors.text.muted} />
    </Pressable>
  );
}

// Voice on / off. At rest it is only the icon. Press it and the state is named ("Voice
// On") for a moment, then the label slips away and leaves just the icon again.
function VoiceToggle({ muted, onToggle }) {
  const reduced = useReducedMotion();
  const label = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const press = () => {
    onToggle();
    clearTimeout(timer.current);
    Animated.timing(label, { toValue: 1, duration: 160, easing: Motion.ease.out, useNativeDriver: Platform.OS !== 'web' }).start();
    timer.current = setTimeout(() => {
      Animated.timing(label, { toValue: 0, duration: 240, easing: Motion.ease.out, useNativeDriver: Platform.OS !== 'web' }).start();
    }, 1500);
  };
  return (
    <Pressable
      onPress={press}
      accessibilityRole="switch"
      accessibilityState={{ checked: !muted }}
      accessibilityLabel="Tutor voice"
      style={({ hovered }) => [styles.voiceBtn, hovered && { backgroundColor: Colors.surface.raised }]}
    >
      <Animated.Text
        accessibilityLiveRegion="polite"
        style={[styles.voiceLabel, { opacity: label, transform: reduced ? [] : [{ translateX: label.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}
      >
        {muted ? 'Voice Off' : 'Voice On'}
      </Animated.Text>
      <MorphIcon icon={muted ? data.VolumeX : data.Volume2} size={20} color={muted ? Colors.icon.secondary : Colors.brand.primary} strokeWidth={2} spring="snappy" reducedMotion="user" />
    </Pressable>
  );
}

// Hints are three hearts. Each hint you ask for empties one; when they are gone the row
// switches off. One row, always in the same place: tap it to ask for the next hint.
function HintRow({ left, max = MAX_HINTS, lang, disabled, onPress }) {
  const none = left <= 0;
  const ask = lang === 'hi' ? 'Ek hint do' : 'Give me a hint';
  return (
    <ActionRow
      label={none ? 'No Hints Left' : left === max ? 'Give Me a Hint' : 'Another Hint'}
      Icon={null}
      disabled={disabled || none}
      onPress={() => onPress(ask)}
      meta={<Hearts left={left} max={max} />}
      accessibilityLabel={`${none ? 'No hints left' : 'Ask for a hint'}, ${left} of ${max} hints left`}
    />
  );
}

function Hearts({ left, max = MAX_HINTS }) {
  return (
    <View style={styles.hearts}>
      {Array.from({ length: max }).map((_, i) => (
        <HeartCell key={i} full={i < left} />
      ))}
    </View>
  );
}

// A heart that pops down to an outline when its hint is spent.
function HeartCell({ full }) {
  const pop = usePopValue(full);
  return (
    <Animated.View style={{ transform: [{ scale: pop }] }}>
      <Heart size={20} strokeWidth={2.2} color={full ? HEART : Colors.border.control} fill={full ? HEART : 'none'} fillOpacity={full ? 0.9 : 0} />
    </Animated.View>
  );
}
const HEART = '#FF6B6B';
function usePopValue(on) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (reduced) return;
    v.setValue(1.25);
    Animated.timing(v, { toValue: 1, duration: 260, easing: Motion.ease.out, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [on, reduced, v]);
  return v;
}

// Voice is the quieter way in, so this is a secondary (outline) button that says what
// it does. It lives inline under the latest message and arrives a couple of seconds
// after the tutor has spoken (see `askReady`), so the student reads first and is
// invited second. While listening it turns into the beat; the transcript above
// fills in as you speak.
function AskButton({ listening, onPress }) {
  return (
    <View style={styles.askWrap}>
      {listening ? (
        <Button variant="primary" onPress={onPress} style={styles.ask}>
          <Beats />
        </Button>
      ) : (
        <ActionRow label="Ask a Question" Icon={Mic} onPress={onPress} />
      )}
    </View>
  );
}

// Seven bars, each on its own rhythm: a voice-activity beat. Transform only.
const BEAT = [0.5, 0.8, 1, 0.7, 0.95, 0.6, 0.85];
export function Beats({ color }) {
  const reduced = useReducedMotion();
  const vals = useRef(BEAT.map(() => new Animated.Value(0.3))).current;
  useEffect(() => {
    if (reduced) return undefined;
    const loops = vals.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: BEAT[i], duration: 260 + ((i * 70) % 220), easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
          Animated.timing(v, { toValue: 0.25, duration: 260 + ((i * 53) % 200), easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [reduced, vals]);
  return (
    <View style={styles.beats}>
      {vals.map((v, i) => (
        <Animated.View key={i} style={[styles.beat, color && { backgroundColor: color }, { transform: [{ scaleY: reduced ? BEAT[i] : v }] }]} />
      ))}
    </View>
  );
}

// Suggested follow-ups: one full-width row each. A leading icon says what the row does;
// on hover or keyboard focus a right arrow slides in ("this goes somewhere").
function iconFor(label) {
  if (/explain|samjh/i.test(label)) return Search;
  return MessageCircle;
}

function ActionRow({ label, Icon, onPress, disabled, meta, accessibilityLabel }) {
  const [focus, setFocus] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      style={({ hovered, pressed }) => {
        const on = (hovered || focus) && !disabled;
        return [
          styles.chip,
          disabled && { opacity: 0.55 },
          on && { backgroundColor: Colors.surface.hover, borderColor: Colors.border.control },
          pressed && !disabled && { transform: [{ scale: Motion.pressScale }] },
        ];
      }}
    >
      {({ hovered }) => {
        const on = (hovered || focus) && !disabled;
        const fade = Platform.select({ web: { transitionProperty: 'opacity, transform', transitionDuration: '180ms', transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' } });
        return (
          <>
            {Icon ? <Icon size={20} strokeWidth={2.2} color={Colors.text.action} /> : null}
            <Text style={styles.chipText} numberOfLines={2}>{titleCase(label)}</Text>
            {/* Right edge: the hearts (or nothing) at rest; an arrow slides in on hover. */}
            <View style={styles.chipEnd} pointerEvents="none">
              {meta ? <View style={[{ opacity: on ? 0 : 1 }, fade]}>{meta}</View> : null}
              <View style={[styles.chipArrow, { opacity: on ? 1 : 0, transform: [{ translateX: on ? 0 : -6 }] }, fade]}>
                <ArrowRight size={18} strokeWidth={2.6} color={Colors.text.action} />
              </View>
            </View>
          </>
        );
      }}
    </Pressable>
  );
}

function Chipset({ chips, onPick, disabled }) {
  if (!chips?.length) return null;
  return (
    <View style={styles.chips}>
      {chips.map((c) => (
        <ActionRow key={c} label={c} Icon={iconFor(c)} disabled={disabled} onPress={() => onPick(c)} />
      ))}
    </View>
  );
}

// Language: a dropdown that opens upward from the footer.
function LangMenu({ lang, onChange }) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: open ? 1 : 0, duration: open ? 160 : 110, easing: Motion.ease.out, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [open, v]);
  const current = LANGS.find((l) => l.key === lang);
  return (
    <View style={styles.menuWrap}>
      {open && <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close language menu" />}
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel={`Language: ${current.label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={({ hovered }) => [styles.footBtn, hovered && { backgroundColor: Colors.surface.raised }]}
      >
        <Text style={styles.footText}>{current.label}</Text>
        <MorphIcon icon={open ? data.ChevronUp : data.ChevronDown} size={16} color={Colors.icon.secondary} strokeWidth={2.2} spring="snappy" reducedMotion="user" />
      </Pressable>
      {open && (
        <Animated.View
          role="listbox"
          style={[
            styles.menu,
            {
              opacity: v,
              transform: reduced ? [] : [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }],
            },
          ]}
        >
          {LANGS.map((l) => (
            <Pressable
              key={l.key}
              role="option"
              aria-selected={l.key === lang}
              onPress={() => { onChange(l.key); setOpen(false); }}
              style={({ hovered }) => [styles.menuItem, hovered && { backgroundColor: Colors.surface.raised }]}
            >
              <Text style={[styles.footText, { color: Colors.text.primary }]}>{l.label}</Text>
              {l.key === lang && <Check size={16} color={Colors.brand.primary} strokeWidth={3} />}
            </Pressable>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

// `overflow-wrap: break-word` breaks a too-long word only when it overflows. (`anywhere`
// and `word-break: break-word` shrink the bubble's min-content width, so a short
// message like "hey hey" wrapped onto two lines.)
const webWrap = Platform.select({ web: { overflowWrap: 'break-word' }, default: {} });

const styles = StyleSheet.create({
  dock: { flex: 1, backgroundColor: Colors.surface.card },

  head: { flexDirection: 'row', alignItems: 'center', gap: Space[12], paddingHorizontal: Space[24], paddingVertical: Space[20], borderBottomWidth: 1, borderBottomColor: Colors.border.hairline },
  // With a back button before it (the phone sheet), the row starts closer to the edge.
  headLead: { paddingLeft: Space[8], paddingRight: Space[16], paddingVertical: Space[12], gap: Space[8] },
  headText: { flex: 1, minWidth: 0 },
  tutorName: { fontFamily: FontFamilies.demi, fontSize: fs(17), lineHeight: lh(24), color: Colors.text.primary },
  switch: { flexDirection: 'row', alignItems: 'center', gap: Space[8], height: CONTROL, paddingHorizontal: Space[14], borderRadius: Radii.control.md, borderWidth: 1, borderColor: Colors.border.control },
  switchText: { fontFamily: FontFamilies.demi, fontSize: fs(15), color: Colors.text.primary },

  orb: { backgroundColor: Colors.brand.primary, alignItems: 'center', justifyContent: 'center' },
  eyes: { flexDirection: 'row', gap: Space[8] },
  eye: { width: 6, height: 10, borderRadius: 3, backgroundColor: Colors.brand.onPrimary },

  // transcript
  scroll: { flex: 1, minHeight: 0 },
  list: { padding: Space[24], gap: Space[12], flexGrow: 1 },
  // Both sides share one geometry: a full-width row (a definite width, so the
  // percentage below always resolves the same way), bubbles that size to their
  // text up to the same cap, the same padding and radius. Side and tint tell them apart,
  // not weight: neither is louder than the other.
  row: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'flex-end', gap: Space[8] },
  rowTutor: { justifyContent: 'flex-start' },
  rowMe: { justifyContent: 'flex-end' },
  msg: { maxWidth: '84%', flexShrink: 1, paddingHorizontal: Space[16], paddingVertical: Space[12], gap: Space[2], position: 'relative' },
  msgTutor: { backgroundColor: Colors.surface.raised, borderWidth: 2, borderColor: Colors.border.subtle, borderRadius: Radii.bubble, borderBottomLeftRadius: 4 },
  msgMe: { backgroundColor: Colors.brand.soft, borderWidth: 2, borderColor: Colors.brand.borderSoft, borderRadius: Radii.bubble, borderBottomRightRadius: 4 },
  lead: { fontFamily: FontFamilies.demi, fontSize: fs(15), lineHeight: LINE, color: Colors.text.primary, ...webWrap },
  msgText: { fontFamily: FontFamilies.medium, fontSize: fs(15), lineHeight: LINE, color: Colors.text.primary, ...webWrap },
  msgTextMe: { fontFamily: FontFamilies.medium, fontSize: fs(15), lineHeight: LINE, color: Colors.text.primary, ...webWrap },
  highlight: { fontFamily: FontFamilies.demi, color: Colors.text.primary },
  dotsPin: { position: 'absolute', left: Space[16] + 2, top: Space[12] + 2 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, height: LINE },
  thinkDot: { width: 7, height: 7, borderRadius: 4 },

  // bottom area
  bottom: { paddingHorizontal: Space[24], paddingTop: Space[12], paddingBottom: Space[16], gap: Space[12], borderTopWidth: 1, borderTopColor: Colors.border.hairline },
  // 36px avatar + 8px gap: the rows start exactly where the tutor's bubble does.
  inline: { gap: Space[12], paddingLeft: 44, alignItems: 'stretch' },
  askWrap: { alignSelf: 'stretch' },
  ask: { alignSelf: 'stretch' },
  beats: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 24 },
  beat: { width: 3, height: 24, borderRadius: 2, backgroundColor: Colors.brand.onPrimary },

  // 44px at rest: 1 + 10 + 22 + 10 + 1. The wrapper owns the vertical padding.
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Space[8] },
  composer: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: CONTROL,
    borderWidth: 2,
    borderColor: Colors.border.control,
    borderRadius: Radii.control.md,
    backgroundColor: Colors.surface.card,
    ...Platform.select({ web: { transitionProperty: 'border-color, box-shadow', transitionDuration: '160ms', transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' } }),
  },
  composerFocus: { borderColor: Colors.brand.primary, ...Platform.select({ web: { boxShadow: `0 0 0 3px ${Colors.brand.softStrong}` } }) },
  inputWrap: { flex: 1, minWidth: 0, paddingVertical: FIELD_PAD, paddingHorizontal: Space[16] },
  input: { padding: 0, margin: 0, fontFamily: FontFamilies.medium, fontSize: fs(15), lineHeight: LINE, color: Colors.text.primary, textAlignVertical: 'top' },
  inputWeb: { outlineStyle: 'none', resize: 'none', ...webWrap },
  send: { width: CONTROL, height: CONTROL, borderRadius: Radii.control.md, alignItems: 'center', justifyContent: 'center' },
  counter: { ...SUB, fontSize: fs(15), lineHeight: lh(18), textAlign: 'right', marginTop: Space[4] },

  dots: { flexDirection: 'row', alignItems: 'center', gap: Space[8] },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border.control },
  dotsText: { fontFamily: FontFamilies.medium, fontSize: fs(15), color: Colors.text.secondary },

  // Full-width stack: every follow-up fills the panel, one per row.
  chips: { alignSelf: 'stretch', gap: Space[8] },
  chip: { alignSelf: 'stretch', flexDirection: 'row', gap: Space[12], paddingLeft: Space[16], paddingRight: Space[16], minHeight: CONTROL, alignItems: 'center', justifyContent: 'flex-start', borderRadius: Radii.control.md, backgroundColor: Colors.surface.card, borderWidth: 2, borderColor: Colors.border.subtle },
  chipEnd: { marginLeft: 'auto', alignItems: 'flex-end', justifyContent: 'center', minWidth: 22, height: 24 },
  chipArrow: { position: 'absolute', right: 0 },
  hearts: { flexDirection: 'row', gap: Space[4] },
  chipText: { flexShrink: 1, fontFamily: FontFamilies.demi, fontSize: fs(15), color: Colors.text.action },

  // footer
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space[16], paddingVertical: Space[8], borderTopWidth: 1, borderTopColor: Colors.border.hairline },
  voiceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: Space[8], minHeight: CONTROL, minWidth: CONTROL, paddingHorizontal: Space[12], borderRadius: Radii.control.md },
  voiceLabel: { position: 'absolute', right: 44, fontFamily: FontFamilies.medium, fontSize: fs(15), color: Colors.text.secondary },
  footBtn: { flexDirection: 'row', alignItems: 'center', gap: Space[8], minHeight: CONTROL, paddingHorizontal: Space[12], borderRadius: Radii.control.md },
  footText: { fontFamily: FontFamilies.medium, fontSize: fs(15), color: Colors.text.secondary },
  menuWrap: { position: 'relative' },
  backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20 },
  menu: { position: 'absolute', bottom: 52, left: 0, minWidth: 168, zIndex: 21, backgroundColor: Colors.surface.card, borderWidth: 1, borderColor: Colors.border.control, borderRadius: Radii.option, padding: Space[6], shadowColor: Colors.shadow.color, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20, ...Platform.select({ web: { transformOrigin: 'bottom left' } }) },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space[16], minHeight: CONTROL, paddingHorizontal: Space[12], borderRadius: Radii.control.md },
});
