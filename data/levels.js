// The three levels of practice, and the open-ended exercises at each. They sit in
// Practice under "Multiple Choice Practice" and are picked with the level tabs. Every card
// plays one of the sample tasks so the prototype stays testable; the content is
// illustrative.

export const LEVELS = {
  1: { name: 'Warm Up', blurb: 'A first step, with plenty of guidance.' },
  2: { name: 'Stretch', blurb: 'The tutor asks more than it tells.' },
  3: { name: 'Challenge', blurb: 'Think it through on your own.' },
};

export const CHALLENGES = [
  {
    id: 'tighten',
    level: 1,
    title: 'Tighten a rambling email',
    text: 'Take a long, unfocused update and rewrite it so the reader knows what to do in the first line.',
    play: { subjectId: 'a', taskId: 'a4' },
  },
  {
    id: 'silent-client',
    level: 2,
    title: 'The silent client',
    text: 'A client stopped replying after a misunderstanding. Plan the message that brings them back, and say why out loud.',
    play: { subjectId: 'a', taskId: 'a3' },
  },
  {
    id: 'time-zones',
    level: 2,
    title: 'Handover across three time zones',
    text: 'Decisions keep getting missed. Work out what is going wrong and propose a fix your team would actually follow.',
    play: { subjectId: 'a', taskId: 'a2' },
  },
  {
    id: 'board',
    level: 3,
    title: 'The ten-minute board update',
    text: 'Turn raw quarterly numbers into a story: the one result, what it means, and what you need from the board.',
    play: { subjectId: 'a', taskId: 'a3' },
  },
  {
    id: 'off-by-one',
    level: 3,
    title: 'Find the bug, then explain it',
    text: 'A loop that almost works. Find the fault, then explain why it happens so you never write it again.',
    play: { subjectId: 'c', taskId: 'c2' },
  },
];
