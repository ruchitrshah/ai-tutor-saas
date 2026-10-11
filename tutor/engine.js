// A scripted stand-in for the tutor's brain. The copy lives in ./copy.js; this
// file decides which line fits the moment (first try or after hints, how many
// wrong, a streak, an intent in what the student typed) and keeps the one rule
// that never bends: the answer is never revealed.
//
// Swap `reply` / `onCorrect` / `onWrong` for a model call later; the shape they
// return ({ lead, text, chips, hint, redirect, phase }) is what the UI consumes.
import { copy, fill, pick } from './copy';

const INTENTS = [
  ['answer', /(answer|solution|tell me|just say|which one is|bata\s?do|batao|jawab|jawaab|kya hai)/i],
  ['explain', /(explain|samjh)/i],
  ['why', /(\bwhy\b|kyun|kyu\b)/i],
  ['example', /(example|udaharan|misal)/i],
  ['lookfor', /(look for|what should i|kya dekh|kaise)/i],
  ['understood', /(think i (get|see|know)|got it|i know|samajh aa gaya)/i],
  ['thanks', /(thank|shukriya)/i],
];
export const intentOf = (text) => (INTENTS.find(([, re]) => re.test(text || '')) || ['stuck'])[0];

const vars = (ctx) => ({ name: ctx.name || 'there', n: ctx.streak || 0 });

// A ladder is the item's own hints, or three generic steps built from its options.
export function ladderFor(item, lang) {
  if (lang === 'hi' && item.hi) return item.hi;
  if (item.ladder) return item.ladder;
  const wrong = item.options.find((_, i) => i !== item.answer);
  const hi = lang === 'hi';
  return [
    hi ? 'Sawal ek baar phir padho. Asal mein kya dhoondhna hai? Apne shabdon mein bolo.' : 'Read the question once more. What are you actually being asked to find? Say it in your own words.',
    hi ? `Kya "${wrong}" sach mein fit hota hai? Kyun ya kyun nahi, sochkar dekho.` : `Does "${wrong}" really fit? Think about why, or why not.`,
    hi ? 'Ab do achhe options bache honge. Unhe shabd ke shabd compare karo.' : 'You are probably down to two strong options. Compare them word by word.',
  ];
}

// The next hint, with a human lead-in, or the "that's all I have" line.
function nextHint(ctx) {
  const C = copy(ctx.lang);
  const step = ladderFor(ctx.item, ctx.lang)[ctx.level];
  if (!step) return { text: fill(pick(C.outOfHints, 'out'), vars(ctx)), hint: false };
  const intros = C.hintIntro[Math.min(ctx.level, C.hintIntro.length - 1)];
  return { text: `${pick(intros, `hint${ctx.level}`)} ${step}`, hint: true };
}

export function greeting(kind, ctx, locked) {
  const C = copy(ctx.lang);
  const v = vars(ctx);
  if (locked) return fill(pick(C.greet.locked, 'g-locked'), v);
  if (kind === 'mcq') return fill(pick(ctx.qIndex > 0 ? C.greet.mcqNext : C.greet.mcqFirst, 'g-mcq'), v);
  return fill(pick(C.greet[kind] || C.greet.mcqFirst, `g-${kind}`), v);
}

// The student got it right. First try → big; with hints → "you did that".
export function onCorrect(ctx) {
  const C = copy(ctx.lang);
  const v = vars(ctx);
  const lead = ctx.firstTry
    ? fill(pick(ctx.streak >= 3 ? C.correct.streak : C.correct.first, 'c-first'), v)
    : fill(pick(C.correct.earned, 'c-earned'), v);
  return { lead, text: fill(pick(ctx.firstTry ? C.correct.reflectFirst : C.correct.reflect, 'c-reflect'), v), chips: [], phase: 'reflect' };
}

// A wrong pick: normalise it, then a smaller question (never the answer).
export function onWrong(ctx) {
  const C = copy(ctx.lang);
  const v = vars(ctx);
  const pool = ctx.wrongCount >= 3 ? C.wrong.many : ctx.wrongCount === 2 ? C.wrong.second : C.wrong.first;
  const h = nextHint(ctx);
  return { lead: fill(pick(pool, `w${Math.min(ctx.wrongCount, 3)}`), v), text: h.text, hint: h.hint, chips: C.chips.afterHint };
}

export function onCodeFixed(ctx) {
  return { text: fill(copy(ctx.lang).code.fixed, vars(ctx)), chips: [] };
}

export function recap(ctx) {
  return fill(copy(ctx.lang).finish.recap, vars(ctx));
}

export const startChips = (lang, kind) => (kind === 'mcq' ? copy(lang).chips.start : []);

/**
 * Reply to what the student said or typed.
 * ctx: { name, lang, kind, item, level, probes, probesHi, phase, streak }
 * returns { lead?, text, chips, hint, redirect, phase? }
 */
export function reply(text, ctx) {
  const C = copy(ctx.lang);
  const v = vars(ctx);
  const intent = intentOf(text);

  // Spoken / written work: a short run of Socratic questions, each with a small
  // human reaction in front of it.
  if (ctx.kind !== 'mcq') {
    const probes = (ctx.lang === 'hi' && ctx.probesHi) || ctx.probes || [];
    const next = probes[ctx.level];
    if (!next) return { text: fill(C.probe.done, v), chips: [], hint: false, redirect: intent === 'answer' };
    const ack = intent === 'answer' ? pick(C.redirect, 'redir') : pick(C.probe.ack[ctx.kind] || C.probe.ack.default, `ack-${ctx.kind}`);
    return { text: fill(`${ack} ${next}`, v), chips: [], hint: true, redirect: intent === 'answer' };
  }

  // Right after a correct answer, whatever they say is their reasoning.
  if (ctx.phase === 'reflect' && intent !== 'thanks') {
    return { text: fill(pick(C.correct.reflected, 'reflected'), v), chips: [], hint: false, redirect: false, phase: null };
  }

  switch (intent) {
    case 'answer': {
      const h = nextHint(ctx);
      return { lead: fill(pick(C.redirect, 'redir'), v), text: h.text, chips: C.chips.afterHint, hint: h.hint, redirect: true };
    }
    case 'explain':
      return { text: fill(pick(C.intent.explain, 'explain'), v), chips: C.chips.afterHint, hint: false, redirect: false };
    case 'why':
      return { text: fill(pick(C.intent.why, 'why'), v), chips: C.chips.afterWhy, hint: false, redirect: false };
    case 'example': {
      const topic = ctx.item?.topic;
      const ex = (C.examples[topic] || C.exampleFallback)[0];
      return { text: ex, chips: C.chips.afterExample, hint: false, redirect: false };
    }
    case 'lookfor':
      return { text: fill(pick(C.intent.lookfor, 'look'), v), chips: C.chips.afterWhy, hint: false, redirect: false };
    case 'understood':
      return { text: fill(pick(C.intent.understood, 'understood'), v), chips: [], hint: false, redirect: false };
    case 'thanks':
      return { text: fill(pick(C.intent.thanks, 'thanks'), v), chips: [], hint: false, redirect: false };
    default: {
      const h = nextHint(ctx);
      return { lead: fill(pick(C.intent.stuck, 'stuck'), v), text: h.text, chips: C.chips.afterHint, hint: h.hint, redirect: false };
    }
  }
}
