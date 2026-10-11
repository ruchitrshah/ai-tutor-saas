// Dummy course data. Subject A uses real BC107 questions (question banks and the
// case-study workbook); the rest is placeholder so every task type has a home.
//
// Task kinds: practice (MCQ, hints on) · case (scenario MCQ, hints on)
//             quiz (MCQ, tutor off) · speak (voice) · write · code

// q(question, [A,B,C,D], answerIndex, topic, ladder?, hiLadder?)
export const q = (text, options, answer, topic, ladder, hi) => ({ text, options, answer, topic, ladder, hi });

export const SUBJECTS = [
  {
    id: 'a',
    dueIn: 0, // days from today
    letter: 'A',
    name: 'Business Communication',
    code: 'BC107',
    due: 'Fri',
    week: 3,
    about: 'Builds the written and spoken communication managers use every day: grammar and tone, essays, presentations, reports and resumes. Work is practised with your AI tutor first, then assessed.',
    faculty: { name: 'Prof. Meera Iyer', role: 'Course lead, Department of Management' },
    format: 'Semester I · 4 credits',
    grading: [{ label: 'Weekly homework', weight: 30, score: 82 }, { label: 'Case study (Assessment 2)', weight: 20, score: null }, { label: 'Mid-term', weight: 20, score: null }, { label: 'End-term', weight: 30, score: null }],
    tasks: [
      {
        id: 'a1',
        icon: 'Type',
        unit: 'Grammar and tone',
        kind: 'practice',
        title: 'Tenses and agreement',
        sub: '4 questions',
        items: [
          q(
            'Which sentence is in the simple past tense?',
            ['He will call you.', 'He is calling you.', 'He called you.', 'He has called you.'],
            2,
            'Tenses & agreement',
            [
              'Look at the verb in each option. Which ones talk about something that has not happened yet, or is happening right now?',
              'Two options use "will" or "is … ing". Cross those out. What is left?',
              'Between "called" and "has called": which one puts the action in a finished time, with no link to now?',
            ],
            [
              'Har option ka verb dekho. Kaun se option mein kaam abhi hua nahi, ya abhi chal raha hai?',
              '"will" aur "is … ing" wale do options kaat do. Ab kya bacha?',
              '"called" aur "has called" mein se kaunsa ek poori ho chuki past ki baat karta hai, aaj se jude bina?',
            ]
          ),
          q(
            'Which sentence uses the future continuous tense?',
            [
              'I will finish the slides.',
              'I finished the slides.',
              'I have finished the slides.',
              'I will be finishing the slides at noon.',
            ],
            3,
            'Tenses & agreement',
            [
              '"Continuous" means the action is in progress at a particular moment. Which options show that?',
              'Look for the pattern will + be + verb-ing. Which sentence has all three pieces?',
              'Read the last option out loud. Does it describe the slides being worked on at a given time?',
            ]
          ),
          q(
            'Which sentence shows correct subject-verb agreement?',
            [
              'Each of the managers have a laptop.',
              'The list of items are long.',
              'Neither the clerk nor the managers were present.',
              'The team are agree.',
            ],
            2,
            'Tenses & agreement',
            [
              'Find the real subject in each sentence. Hint: it is not always the noun right before the verb.',
              'In "The list of items ___ long", is the subject "list" or "items"?',
              'With "neither … nor", the verb agrees with the noun closest to it. Which option follows that?',
            ]
          ),
          q(
            'Which sentence is in the passive voice?',
            [
              'The manager approved the budget.',
              'The team writes the report.',
              'The budget was approved by the manager.',
              'We approve budgets monthly.',
            ],
            2,
            'Tenses & agreement',
            [
              'In passive voice, the thing receiving the action is the subject. Who or what receives the action in each option?',
              'Look for a form of "to be" plus a past participle. Which options have it?',
              'Which sentence could end with "by the manager" without sounding odd?',
            ]
          ),
        ],
      },
      {
        id: 'a2',
        icon: 'Briefcase',
        unit: 'Grammar and tone',
        kind: 'case',
        title: "Case study: Riya's team",
        sub: '3 questions about a short case',
        items: [
          q(
            "Riya's team sends weekly updates as long emails that nobody reads. Which change helps most?",
            [
              'Make the emails longer',
              'Send updates at midnight',
              'Lead with three key points and the decisions needed',
              'Stop sending updates',
            ],
            2,
            'Writing for the reader',
            [
              'Why is nobody reading them? Name the reader\'s problem before you pick a fix.',
              'Which options make the reader\'s job harder, and which make it easier?',
              'What does a busy reader need to see in the first two lines?',
            ]
          ),
          q(
            "A client misreads 'ASAP' as 'by next month'. Which barrier caused this?",
            ['Physical barrier', 'Semantic barrier', 'Technical barrier', 'Organisational barrier'],
            1,
            'Communication barriers',
            [
              'The words were received fine. So what went wrong between the sender and the receiver?',
              'Which barrier is about the meaning people attach to words?',
              'Rule out physical and technical first: was there noise or a faulty channel here?',
            ]
          ),
          q(
            'Arjun must present quarterly results to the board in 10 minutes. What should he open with?',
            [
              'The main result and what it means for the board',
              'A list of every department',
              'An apology for the short time',
              'The appendix',
            ],
            0,
            'Presentations',
            [
              'The board has ten minutes. What do they most want to know first?',
              'Which opening would you still be glad you used if you were cut off after 30 seconds?',
              'Which options delay the point, and which lead with it?',
            ]
          ),
        ],
      },
      {
        id: 'a6',
        icon: 'FileText',
        unit: 'Essays and presentations',
        kind: 'practice',
        title: 'Essay structure',
        sub: '3 questions',
        items: [
          q('What does a thesis statement do?', ['Lists the references', "States the essay's main argument", 'Ends the essay', 'Thanks the reader'], 1, 'Essay writing'),
          q('What links one paragraph to the next?', ['A footnote', 'A transition', 'A citation', 'A heading'], 1, 'Essay writing'),
          q('What should the conclusion of an essay do?', ['Introduce new evidence', 'List every source', 'Restate the main point and close the argument', 'Repeat the introduction word for word'], 2, 'Essay writing'),
        ],
      },
      {
        id: 'a7',
        icon: 'Presentation',
        unit: 'Essays and presentations',
        kind: 'practice',
        title: 'Presentation basics',
        sub: '3 questions',
        items: [
          q("What should a presentation's opening do?", ['List every slide', 'Grab attention and state the purpose', 'Apologise for nervousness', 'Show the conclusion only'], 1, 'Presentations'),
          q('How much text should a typical slide carry?', ['Full paragraphs', 'The whole script', 'A few key points', 'Only references'], 2, 'Presentations'),
          q('Why rehearse a presentation aloud?', ['To memorise every word', 'To make it longer', 'To avoid using slides', 'To check timing and flow'], 3, 'Presentations'),
        ],
      },
      {
        id: 'a3',
        icon: 'Mic',
        unit: 'Essays and presentations',
        kind: 'speak',
        title: 'Speak: open a board update',
        sub: 'Say your answer out loud, about 30 seconds',
        prompt:
          "Arjun has ten minutes with the board. Say your opening out loud in about 30 seconds: the main result, and what it means for them.",
        probes: [
          'If the board remembers just one thing from that, what should it be, {name}?',
          'Where in there did you tell them what it **means for them**, not just what happened?',
          'Suppose the chair cuts you off at twenty seconds. What would you move to the front?',
        ],
        probesHi: [
          'Agar board ko bas ek cheez yaad rahe, to woh kya honi chahiye, {name}?',
          'Tumne kahan bataya ki iska **board ke liye kya matlab** hai, sirf kya hua nahi?',
          'Maan lo chair 20 second mein rok de. Tum sabse pehle kya bologe?',
        ],
      },
      {
        id: 'a8',
        icon: 'ClipboardList',
        unit: 'Writing and reports',
        kind: 'practice',
        title: 'Reports and resumes',
        sub: '3 questions',
        items: [
          q('Which section of a report summarises it for busy readers?', ['Appendix', 'Executive summary', 'Bibliography', 'Index'], 1, 'Reports and resumes'),
          q('Which resume format lists jobs from most recent to oldest?', ['Functional', 'Reverse chronological', 'Alphabetical', 'Random'], 1, 'Reports and resumes'),
          q('What does a cover letter accompany?', ['A memo', 'A report', 'A resume', 'An invoice'], 2, 'Reports and resumes'),
        ],
      },
      {
        id: 'a4',
        icon: 'PenLine',
        unit: 'Writing and reports',
        kind: 'write',
        title: 'Write: fix the email opening',
        sub: 'Write one short paragraph',
        prompt:
          'A manager opens an email with: "I am writing this email to you today in order to inform you that the signed contract is still pending." Rewrite the opening so it is clear and direct.',
        starter: '',
        probes: [
          "Okay, picture the reader opening this. What's the first thing they need to **do**?",
          'Read it again. Which words could you cut without losing any meaning?',
          'Look at just your first sentence. Is the action there? Is the deadline there too?',
        ],
        probesHi: [
          'Socho reader ise kholta hai. Sabse pehle use kya **karna** hai?',
          'Phir se padho. Kaunse shabd hata do to bhi matlab wahi rahega?',
          'Sirf pehla sentence dekho. Usme action hai? Deadline bhi hai?',
        ],
      },
      {
        id: 'a5',
        icon: 'ClipboardCheck',
        unit: 'Checkpoint',
        kind: 'quiz',
        title: 'Checkpoint quiz',
        sub: '4 questions, no hints',
        items: [
          q('Which Latin word is "communication" derived from?', ['Communicare', 'Comprehendere', 'Conectare', 'Compilare'], 0, 'Communication process'),
          q('In the communication process, who encodes the message?', ['Receiver', 'Sender', 'Channel', 'Noise'], 1, 'Communication process'),
          q('What is feedback in communication?', ['The message itself', 'Background noise', "The receiver's response to the message", 'The medium used'], 2, 'Communication process'),
          q('Which is an example of nonverbal communication?', ['An email', 'A report', 'A phone call', 'A handshake'], 3, 'Communication process'),
        ],
      },
    ],
  },
  {
    id: 'b',
    dueIn: 1, // days from today
    letter: 'B',
    name: 'Marketing Management',
    code: 'MK101',
    due: 'Mon',
    week: 3,
    about: 'Introduces how firms find customers and serve them: the marketing mix, segmentation, positioning and pricing, taught through short cases.',
    faculty: { name: 'Prof. Rohan Kapoor', role: 'Faculty, Marketing' },
    format: 'Semester I · 4 credits',
    grading: [{ label: 'Weekly homework', weight: 25, score: 74 }, { label: 'Case presentation', weight: 25, score: null }, { label: 'Mid-term', weight: 20, score: null }, { label: 'End-term', weight: 30, score: null }],
    tasks: [
      {
        id: 'b1',
        icon: 'ShoppingBag',
        unit: 'Marketing basics',
        kind: 'practice',
        title: 'The 4 Ps',
        sub: '2 questions',
        items: [
          q('Which of the 4 Ps covers where customers can buy a product?', ['Product', 'Price', 'Place', 'Promotion'], 2, 'Marketing mix'),
          q('Splitting a market into groups with similar needs is called:', ['Positioning', 'Segmentation', 'Branding', 'Forecasting'], 1, 'Segmentation'),
        ],
      },
      {
        id: 'b2',
        icon: 'Briefcase',
        unit: 'Marketing basics',
        kind: 'case',
        title: 'Case study: the new snack',
        sub: '2 questions about a short case',
        items: [
          q('A snack brand wants to reach college students cheaply. Which channel fits best?', ['Prime-time TV', 'Campus social media', 'Highway billboards', 'Print classifieds'], 1, 'Promotion'),
          q('The same snack is priced above competitors with no extra benefit. What is the likely result?', ['Higher sales', 'Weak demand', 'Better reach', 'Wider segment'], 1, 'Pricing'),
        ],
      },
      {
        id: 'b3',
        icon: 'Mic',
        unit: 'Marketing basics',
        kind: 'speak',
        title: 'Speak: pitch in 30 seconds',
        sub: 'Say your answer out loud, about 30 seconds',
        prompt: 'Pitch the new snack to a retailer in about 30 seconds. Who is it for, and why will it sell?',
        probes: [
          'Who exactly is the buyer you described, in five words?',
          'What would make the retailer say yes today instead of next month?',
        ],
      },
      {
        id: 'b4',
        icon: 'ClipboardCheck',
        unit: 'Checkpoint',
        kind: 'quiz',
        title: 'Checkpoint quiz',
        sub: '2 questions, no hints',
        items: [
          q('Which P deals with discounts and list price?', ['Product', 'Price', 'Place', 'Promotion'], 1, 'Pricing'),
          q('A target market is:', ['Everyone', 'The group a brand chooses to serve', 'Only existing customers', 'A competitor'], 1, 'Segmentation'),
        ],
      },
    ],
  },
  {
    id: 'c',
    dueIn: 4, // days from today
    letter: 'C',
    name: 'Introduction to Programming',
    code: 'CS101',
    due: 'Wed',
    week: 3,
    about: 'A first course in programming: variables, loops and reading code. You write small programs and explain what they do.',
    faculty: { name: 'Dr. Anita Rao', role: 'Faculty, Computer Science' },
    format: 'Semester I · 3 credits',
    grading: [{ label: 'Weekly homework', weight: 30, score: null }, { label: 'Code lab', weight: 30, score: null }, { label: 'End-term', weight: 40, score: null }],
    tasks: [
      {
        id: 'c1',
        icon: 'Repeat',
        unit: 'Loops',
        kind: 'practice',
        title: 'Loops and ranges',
        sub: '2 questions',
        items: [
          q('How many times does `for i in range(3)` run?', ['2', '3', '4', 'Forever'], 1, 'Loops'),
          q('What is the last value of i in `range(1, 5)`?', ['1', '4', '5', '6'], 1, 'Loops'),
        ],
      },
      {
        id: 'c2',
        icon: 'Code',
        unit: 'Loops',
        kind: 'code',
        title: 'Code lab: sum 1 to 5',
        sub: 'Find and fix one bug',
        prompt: 'This program should print the sum of 1 to 5, which is 15. It prints 10. Find and fix the bug.',
        starter: 'total = 0\nfor i in range(1, 5):\n    total += i\nprint(total)',
        expected: '15',
        buggyOutput: '10',
        probes: [
          'Compare what it printed with what you expected. What is the difference?',
          "Walk through the loop one step at a time. What's the **last** number the variable i takes?",
          'Is the second number in range() included, or does the loop stop just before it?',
        ],
        probesHi: [
          'Jo print hua use expected se milao. Dono mein kya fark hai?',
          'Loop ko ek-ek step mein chalao. Variable i ki **aakhri** value kya hoti hai?',
          'range() ka doosra number shamil hota hai, ya loop usse ek pehle ruk jaata hai?',
        ],
      },
      {
        id: 'c3',
        icon: 'ClipboardCheck',
        unit: 'Checkpoint',
        kind: 'quiz',
        title: 'Checkpoint quiz',
        sub: '2 questions, no hints',
        items: [
          q('Which keyword starts a loop over a sequence?', ['if', 'for', 'def', 'print'], 1, 'Loops'),
          q('What does `total += i` do?', ['Resets total', 'Adds i to total', 'Compares total and i', 'Prints total'], 1, 'Loops'),
        ],
      },
    ],
  },
  {
    id: 'd',
    dueIn: 6, // days from today
    letter: 'D',
    name: 'Business Statistics',
    code: 'ST102',
    due: 'Next Tue',
    week: 3,
    about: 'Describes data and draws simple conclusions: averages, spread and reading tables, applied to business questions.',
    faculty: { name: 'Prof. Sanjay Verma', role: 'Faculty, Quantitative Methods' },
    format: 'Semester I · 3 credits',
    grading: [{ label: 'Weekly homework', weight: 30, score: null }, { label: 'Mid-term', weight: 30, score: null }, { label: 'End-term', weight: 40, score: null }],
    tasks: [
      {
        id: 'd1',
        icon: 'ChartColumn',
        unit: 'Averages',
        kind: 'practice',
        title: 'Mean, median, mode',
        sub: '2 questions',
        items: [
          q('Which measure is least affected by extreme values?', ['Mean', 'Median', 'Range', 'Sum'], 1, 'Averages'),
          q('The mode of 2, 3, 3, 5, 9 is:', ['2', '3', '5', '9'], 1, 'Averages'),
        ],
      },
      {
        id: 'd2',
        icon: 'PenLine',
        unit: 'Averages',
        kind: 'write',
        title: 'Write: explain a median',
        sub: 'Write two sentences',
        prompt: 'Explain to a new teammate why a manager might report the median salary instead of the mean.',
        starter: '',
        probes: [
          'Imagine one salary is ten times the rest. What happens to the mean?',
          'Which of your two sentences would a non-statistician understand first?',
        ],
      },
      {
        id: 'd3',
        icon: 'ClipboardCheck',
        unit: 'Checkpoint',
        kind: 'quiz',
        title: 'Checkpoint quiz',
        sub: '2 questions, no hints',
        items: [
          q('The middle value of an ordered data set is the:', ['Mean', 'Median', 'Mode', 'Range'], 1, 'Averages'),
          q('Range is:', ['Max minus min', 'Sum divided by count', 'Most frequent value', 'Middle value'], 0, 'Averages'),
        ],
      },
    ],
  },
];

export const TASK_LABEL = {
  practice: 'Practice',
  case: 'Case study',
  quiz: 'Quiz',
  speak: 'Speaking',
  write: 'Writing',
  code: 'Code lab',
};

// What the student has already finished when they sign in, so the path and the
// "how you're doing" rail have something to show.
export const SEED_DONE = { a1: true, a2: true, b1: true };

export const SEED_STATS = {
  answered: 14,
  hints: 19,
  answerRequests: 2,
  breakthroughs: 6,
  topics: {
    'Tenses & agreement': { right: 7, miss: 1 },
    'Writing for the reader': { right: 3, miss: 1 },
    'Communication barriers': { right: 1, miss: 3 },
    Presentations: { right: 2, miss: 1 },
    'Marketing mix': { right: 1, miss: 0 },
  },
};

export const findSubject = (id) => SUBJECTS.find((s) => s.id === id);
export const findTask = (subject, id) => subject?.tasks.find((t) => t.id === id);

// What "how you're doing" tracks. Mastery 0..1, moved by finishing tasks of that
// kind. A backend would derive this from the tutor's reading of each session.
export const SKILL_OF = { code: 'coding', write: 'writing', speak: 'speaking' };
export const SEED_SKILLS = { coding: 0.4, writing: 0.65, speaking: 0.3 };
