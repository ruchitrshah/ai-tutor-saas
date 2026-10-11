// The performance chat: a scripted stand-in for "ask your tutor how you are doing". It reads
// the student's real numbers (the three skills and the topics they have missed) and answers
// in a few short lines, then suggests what to ask next. Swap `feedbackReply` for a model call
// later; the shape it returns ({ text, chips }) is what the screen uses. A chip is
// { label, ask } to send a question, or { label, go } to open a page.

const TIPS = { coding: 'Check loop bounds first.', writing: 'Cut filler and lead with the action.', speaking: 'Open with the point.' };
const NAMES = { coding: 'Coding', writing: 'Writing', speaking: 'Speaking' };

const pct = (v) => `${Math.round(v * 100)}%`;
const ranked = (skills) => Object.keys(NAMES).sort((a, b) => skills[b] - skills[a]);

function weakTopics(stats) {
  return Object.entries(stats.topics || {})
    .map(([topic, v]) => ({ topic, miss: v.miss, total: v.right + v.miss }))
    .filter((t) => t.miss > 0)
    .sort((a, b) => b.miss / b.total - a.miss / a.total || b.miss - a.miss)
    .slice(0, 3);
}

const ASK = {
  overall: { label: 'How am I doing?', ask: 'How am I doing overall?' },
  improve: { label: 'Where can I improve?', ask: 'Where can I improve?' },
  next: { label: 'What should I practise next?', ask: 'What should I practise next?' },
  topics: { label: 'Which topics trip me up?', ask: 'Which topics trip me up?' },
  hints: { label: 'How many hints do I use?', ask: 'How many hints do I use?' },
  revisions: { label: 'Open Revisions', go: 'revisions' },
};

export function openingChips() {
  return [ASK.overall, ASK.improve, ASK.next, ASK.topics];
}

export function feedbackReply(text, { skills, stats, name }) {
  const q = (text || '').toLowerCase();
  const order = ranked(skills);
  const best = order[0];
  const worst = order[order.length - 1];
  const weak = weakTopics(stats);

  if (/(thank|thanks|shukriya)/.test(q)) {
    return { text: `Anytime, ${name}. Ask me anything else about how you're doing.`, chips: [ASK.improve, ASK.next] };
  }

  const skillAsked = Object.keys(NAMES).find((k) => q.includes(k) || (k === 'speaking' && /(speak|talk|voice)/.test(q)) || (k === 'writing' && /(write|email|essay)/.test(q)) || (k === 'coding' && /(code|loop|program)/.test(q)));
  if (skillAsked) {
    return {
      text: `${NAMES[skillAsked]} is at ${pct(skills[skillAsked])}. ${TIPS[skillAsked]} A short Warm Up on it each day will move it faster than one long session.`,
      chips: [ASK.next, ASK.topics, skillAsked === worst ? ASK.revisions : ASK.improve],
    };
  }

  if (/(hint|stuck|answer)/.test(q)) {
    return {
      text: `You've used ${stats.hints} hints and asked for the answer ${stats.answerRequests} times. That's fine while you learn. I never give the answer, so try one hint fewer on your next Warm Up.`,
      chips: [ASK.improve, ASK.next],
    };
  }

  if (/(topic|trip|mistake|wrong|miss|weak)/.test(q)) {
    if (!weak.length) return { text: 'No weak spots right now. Keep going and I will flag anything that trips you up.', chips: [ASK.overall, ASK.next] };
    const list = weak.map((t) => `${t.topic} (${t.miss} of ${t.total} missed)`).join(', ');
    return { text: `The ones to watch: ${list}. They're all waiting in Revisions as short sessions.`, chips: [ASK.revisions, ASK.next] };
  }

  if (/(next|practi[sc]e|plan|should i|where do i start)/.test(q)) {
    const t = weak[0];
    return {
      text: `Start with ${t ? `${t.topic}, then ` : ''}a Stretch exercise on ${NAMES[worst].toLowerCase()}. ${TIPS[worst]} Revisions already has the first one ready.`,
      chips: [ASK.revisions, ASK.improve],
    };
  }

  if (/(improve|better|work on|advice|tips)/.test(q)) {
    const t = weak[0];
    return {
      text: `Focus on ${NAMES[worst].toLowerCase()}, it's at ${pct(skills[worst])}. ${TIPS[worst]}${t ? ` Your weakest topic is ${t.topic}.` : ''}`,
      chips: [ASK.next, ASK.topics],
    };
  }

  if (/(how am i|doing|overall|progress|performance|score|grade)/.test(q)) {
    return {
      text: `You're building steadily, ${name}. ${NAMES[best]} is your strongest at ${pct(skills[best])}, and ${NAMES[worst].toLowerCase()} has the most room at ${pct(skills[worst])}. ${stats.breakthroughs} breakthroughs so far: those are answers you reached yourself.`,
      chips: [ASK.improve, ASK.next, ASK.topics],
    };
  }

  return {
    text: "I can tell you how you're doing, where to improve, what to practise next, or which topics trip you up. Try one of these.",
    chips: openingChips(),
  };
}
