// Sample sets for the three newer practice modules. Each is a self-contained task
// (kind, title, items) that Practice opens directly, so no course owns them.
// `ladder` is the tutor's three hints for an item, from nudge to near-clue; none of them
// ever says the answer.

export const BLANK_SET = {
  id: 'set-blank',
  kind: 'blank',
  title: 'Fill in the blank',
  sub: '4 sentences',
  items: [
    {
      text: 'Yesterday, the manager ____ the report to the board.',
      options: ['sent', 'sends', 'will send', 'sending'],
      answer: 0,
      topic: 'Tenses & agreement',
      ladder: [
        'Look at the first word of the sentence. What does it tell you about when this happened?',
        'Which of these words are about the past, and which are not?',
        'You are down to the word that is a finished action. Does it fit with "yesterday"?',
      ],
    },
    {
      text: 'In the communication process, the ____ is the person who receives the message.',
      options: ['receiver', 'sender', 'channel', 'noise'],
      answer: 0,
      topic: 'Communication process',
      ladder: [
        'Think about the two people in a conversation. What is the other one called?',
        'One of these is a person, one is a medium, one is a disturbance. Which are people?',
        'Of the two people, which one gets the message rather than sends it?',
      ],
    },
    {
      text: 'In a presentation, lead with the main ____ in the first thirty seconds.',
      options: ['point', 'joke', 'apology', 'slide'],
      answer: 0,
      topic: 'Presentations',
      ladder: [
        'What does your audience most need to hear before anything else?',
        'Which of these would help someone decide whether to keep listening?',
        'Which one is the thing you want them to remember when you finish?',
      ],
    },
    {
      text: 'A ____ is the group of customers a brand chooses to serve.',
      options: ['target market', 'competitor', 'channel', 'price'],
      answer: 0,
      topic: 'Segmentation',
      ladder: [
        'The sentence is about people. Which words on the list are about people?',
        'One of these is about rivals, one about delivery, one about money. What is left?',
        'Which one describes who the brand picks, on purpose?',
      ],
    },
  ],
};

// Pairs are listed in the right order; the screen shuffles the meanings.
export const MATCH_SET = {
  id: 'set-match',
  kind: 'match',
  title: 'Match pairs',
  sub: '5 pairs',
  topic: 'Communication process',
  pairs: [
    { term: 'Sender', meaning: 'Starts the message' },
    { term: 'Receiver', meaning: 'Gets the message' },
    { term: 'Feedback', meaning: "The receiver's response" },
    { term: 'Channel', meaning: 'What the message travels through' },
    { term: 'Noise', meaning: 'Anything that distorts the message' },
  ],
  shuffle: [3, 0, 4, 2, 1], // the order the meanings appear in
  ladder: [
    'Start with the one you are surest of. Which term has only one possible meaning?',
    'Think about the order a message moves: who first, then what carries it, then who.',
    'Two meanings feel close. Which one is about something going wrong, and which is about a reply?',
  ],
};

// Steps are listed in the right order; the screen shuffles them.
export const ORDER_SET = {
  id: 'set-order',
  kind: 'order',
  title: 'Put in order',
  sub: '2 sequences',
  items: [
    {
      text: 'Put the parts of a board update in order.',
      steps: ['Lead with the main result', 'Say what it means for them', 'Give the key numbers', 'Ask for the decision'],
      shuffle: [2, 3, 0, 1],
      topic: 'Presentations',
      ladder: [
        'What does the board need to hear before anything else?',
        'After the result, what do they want to know: the detail, or why it matters?',
        'The last step is what you need from them. What comes right before it?',
      ],
    },
    {
      text: 'Put the parts of a clear email in order.',
      steps: ['A subject line that says the point', 'What you need, in the first line', 'The details they need', 'The next step and the date'],
      shuffle: [3, 1, 2, 0],
      topic: 'Reports and resumes',
      ladder: [
        'What does the reader see before they even open the email?',
        'Once they open it, what should they learn in the first line?',
        'Which step is about what happens after they have read it?',
      ],
    },
  ],
};
