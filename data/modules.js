// The catalogue of practice modules: every kind of exercise the tutor can run.
// Homework will later mix these as tasks; Practice lets the student pick one.
//
// Where each came from:
//   prototype  built in this prototype today
//   prd        named in the Amity brief or the executive proposal (worksheet and pen,
//              code lab, shared screen, quizzes, flashcards, practice questions, tests,
//              the learn → practise → test → find gaps → tutor → revisit loop, slides,
//              podcast audio)
//   research   common in products that teach well (Duolingo's exercise types,
//              Quizlet's study modes, Anki's spaced repetition) and not yet in the PRD
//
// Fields: name, does (what the student does), tutor (how the tutor helps, always
// without giving the answer), fits (where it earns its place), status.
//
// What Practice shows: only the `built` group. The other two groups are the product
// backlog and stay here, hidden (`visible: false`), until a module in them is built; then
// it moves up into `built` with a `play` set. Fill in the blank, Match pairs and Put in
// order were the first to make that move (they came from "Worth adding").

import { BLANK_SET, MATCH_SET, ORDER_SET } from './practiceSets';

export const MODULE_GROUPS = [
  {
    key: 'built',
    visible: true,
    title: 'In the prototype',
    sub: 'Working today. Homework tasks use these.',
    modules: [
      {
        id: 'mcq',
        play: { subjectId: 'a', taskId: 'a1' },
        name: 'Multiple choice practice',
        does: 'Pick the best answer from four options, one question at a time.',
        tutor: 'On a miss, asks a smaller question and gives up to three hints. Never says which option is right.',
        fits: 'Every subject. The core of the question banks.',
        source: 'prototype',
      },
      {
        id: 'case',
        play: { subjectId: 'a', taskId: 'a2' },
        name: 'Case study',
        does: 'Read a short scenario and choose what the person in it should do.',
        tutor: 'Asks you to name the problem first, then which option solves that problem.',
        fits: 'Business communication, marketing, management.',
        source: 'prototype',
      },
      {
        id: 'quiz',
        play: { subjectId: 'a', taskId: 'a5' },
        name: 'Checkpoint quiz',
        does: 'Answer a short set on your own, with no hints.',
        tutor: 'Stays quiet during the quiz. Afterwards, goes over the topics you missed.',
        fits: 'End of a module or week.',
        source: 'prototype',
      },
      {
        id: 'speak',
        play: { subjectId: 'a', taskId: 'a3' },
        name: 'Speaking practice',
        does: 'Say your answer out loud, in English or Hinglish.',
        tutor: 'Listens, then asks one question about what you said, such as what the one takeaway is.',
        fits: 'Presentations, group discussion, interviews.',
        source: 'prototype',
      },
      {
        id: 'write',
        play: { subjectId: 'a', taskId: 'a4' },
        name: 'Writing practice',
        does: 'Write a short paragraph, email or answer.',
        tutor: 'Asks what you could cut and whether the action and deadline are clear. Does not rewrite it.',
        fits: 'Emails, memos, resumes, short answers.',
        source: 'prototype',
      },
      {
        id: 'code',
        play: { subjectId: 'c', taskId: 'c2' },
        name: 'Code lab',
        does: 'Write or fix code in an editor and run it.',
        tutor: 'Reads the code and its output, then asks a question that leads you to the bug.',
        fits: 'Programming and data subjects.',
        source: 'prototype',
      },
      {
        id: 'cloze',
        play: { custom: BLANK_SET },
        name: 'Fill in the blank',
        does: 'Complete a sentence by choosing or typing the missing word.',
        tutor: 'Asks what kind of word belongs there before you answer.',
        fits: 'Grammar, terminology, formulas.',
        source: 'prototype',
      },
      {
        id: 'match',
        play: { custom: MATCH_SET },
        name: 'Match pairs',
        does: 'Connect terms to their meanings, against the clock if you like.',
        tutor: 'Notices which pairs you hesitate on and feeds them back later.',
        fits: 'Definitions, concepts, case-to-theory.',
        source: 'prototype',
      },
      {
        id: 'order',
        play: { custom: ORDER_SET },
        name: 'Put in order',
        does: 'Arrange steps, sentences or sections into the right sequence.',
        tutor: 'Asks what has to come first, and why, instead of showing the order.',
        fits: 'Report structure, email openings, processes, algorithms.',
        source: 'prototype',
      },
    ],
  },
  {
    key: 'prd',
    visible: false, // backlog: not shown in Practice yet
    title: 'In the PRD, still to build',
    sub: 'Named in the brief or the proposal.',
    modules: [
      {
        id: 'worksheet',
        name: 'Worksheet and handwriting',
        does: 'Write or circle directly on a worksheet, with a pen or a trackpad.',
        tutor: 'Reads your marks and points at the mistake without fixing it.',
        fits: 'Any subject with working shown on paper: numbers, diagrams, layouts.',
        source: 'prd',
      },
      {
        id: 'screen',
        name: 'Screen share help',
        does: 'Share a slide, a PDF or an IDE window and ask about it.',
        tutor: 'Answers from the frame it sees, and only from course material up to the current week.',
        fits: 'Stuck on a lecture slide, a reading, or code in your own editor.',
        source: 'prd',
      },
      {
        id: 'flashcards',
        name: 'Flashcards',
        does: 'Flip through terms and definitions made from the approved material.',
        tutor: 'Asks you to say the answer before you flip. Brings back the ones you got wrong.',
        fits: 'Vocabulary, definitions, formulas.',
        source: 'prd',
      },
      {
        id: 'practice-set',
        name: 'Practice set',
        does: 'Work through generated questions at your level, on the topics you pick.',
        tutor: 'Raises or lowers difficulty as you go and names the weak area it is aiming at.',
        fits: 'Steady revision between lectures.',
        source: 'prd',
      },
      {
        id: 'test',
        name: 'Mock test',
        does: 'Sit a timed, mixed paper under exam conditions.',
        tutor: 'Silent while you work. Afterwards, shows where marks were lost and why.',
        fits: 'Before a mid-term or end-term.',
        source: 'prd',
      },
      {
        id: 'review',
        name: 'Weak-spot review',
        does: 'Revisit exactly the topics you have missed or needed hints on.',
        tutor: 'Opens the session with what it noticed, then teaches into the gap and returns to it later.',
        fits: 'Any time. This is the "identify gaps, tutor, revisit" step of the loop.',
        source: 'prd',
      },
      {
        id: 'ask',
        name: 'Ask your tutor',
        does: 'Ask anything about the course, by voice or chat, in English or Hinglish.',
        tutor: 'Guides with questions, answers only from faculty material up to this week.',
        fits: 'The doubt that comes up at 11pm with nobody to ask.',
        source: 'prd',
      },
      {
        id: 'slides',
        name: 'Slide explainer',
        does: 'Watch a short, generated slide walk-through of a topic.',
        tutor: 'Pauses to ask what the next slide should say, so you are not just watching.',
        fits: 'Visual learners.',
        source: 'prd',
      },
      {
        id: 'podcast',
        name: 'Audio explainer',
        does: 'Listen to a short generated audio lesson on a topic.',
        tutor: 'Follows with two or three spoken questions to check what stuck.',
        fits: 'Auditory learners, commutes.',
        source: 'prd',
      },
    ],
  },
  {
    key: 'research',
    visible: false, // backlog: not shown in Practice yet
    title: 'Worth adding',
    sub: 'Not in the PRD. Common in products that teach well, and a good fit for the tutor.',
    modules: [
      {
        id: 'spot',
        name: 'Spot the mistake',
        does: 'Find what is wrong in a short email, paragraph, slide or snippet.',
        tutor: 'Asks where you would look first and what a reader would trip on.',
        fits: 'Writing, code review, presentations.',
        source: 'research',
      },
      {
        id: 'roleplay',
        name: 'Role-play conversation',
        does: 'Talk through a scenario with a character, such as a client call or a board meeting.',
        tutor: 'Plays the other person, then steps out to ask how you think it went.',
        fits: 'Business communication, negotiation, interviews.',
        source: 'research',
      },
      {
        id: 'listen',
        name: 'Listening practice',
        does: 'Hear a short clip, then answer questions about it.',
        tutor: 'Replays the part you missed and asks what you heard.',
        fits: 'Communication courses, Hinglish and English comprehension.',
        source: 'research',
      },
      {
        id: 'teach',
        name: 'Explain it back',
        does: 'Explain a concept in your own words, as if to a teammate.',
        tutor: 'Plays a curious beginner and asks the questions a beginner would.',
        fits: 'Any concept you think you know. It shows whether you really do.',
        source: 'research',
      },
      {
        id: 'confidence',
        name: 'Confidence check',
        does: 'Say how sure you are before each answer.',
        tutor: 'Points out where you were sure and wrong, which are the ones worth studying.',
        fits: 'Exam prep, spotting overconfidence.',
        source: 'research',
      },
    ],
  },
];

export const SOURCE_LABEL = {
  prototype: 'Built',
  prd: 'In the PRD',
  research: 'Research',
};
