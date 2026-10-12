// Revisions: every mistake from homework and practice, grouped by course and week.
// Dummy data for the prototype (nothing is recorded yet). Each card is one topic you
// missed, where, and when; opening it plays a short session on it. Later this is built
// from the student's real answers.
export const REVISIONS = [
  {
    id: 'bc-w3',
    course: 'Business Communication',
    code: 'BC107',
    week: 'Week 3',
    accent: 'blue',
    items: [
      { id: 'r-tenses', title: 'Tenses and agreement', count: 3, text: '3 mistakes in Essay structure, Tuesday', play: { subjectId: 'a', taskId: 'a1' } },
      { id: 'r-reader', title: 'Writing for the reader', count: 2, text: '2 mistakes in Email tone, Wednesday', play: { subjectId: 'a', taskId: 'a2' } },
      { id: 'r-barriers', title: 'Communication barriers', count: 4, text: '4 mistakes in the Checkpoint quiz, Thursday', play: { subjectId: 'a', taskId: 'a2' } },
    ],
  },
  {
    id: 'mk-w3',
    course: 'Marketing Management',
    code: 'MK101',
    week: 'Week 3',
    accent: 'orange',
    items: [
      { id: 'r-mix', title: 'The marketing mix', count: 2, text: '2 mistakes in Case study: the new snack, Monday', play: { subjectId: 'b', taskId: 'b1' } },
      { id: 'r-segments', title: 'Segmentation', count: 1, text: '1 mistake in the Checkpoint quiz, Tuesday', play: { subjectId: 'b', taskId: 'b1' } },
    ],
  },
  {
    id: 'cs-w3',
    course: 'Introduction to Programming',
    code: 'CS101',
    week: 'Week 3',
    accent: 'green',
    items: [
      { id: 'r-loops', title: 'Loops', count: 3, text: '3 mistakes in Loops basics, Wednesday', play: { subjectId: 'c', taskId: 'c1' } },
      { id: 'r-offbyone', title: 'Off-by-one errors', count: 2, text: '2 mistakes in the Debug lab, Thursday', play: { subjectId: 'c', taskId: 'c2' } },
    ],
  },
  {
    id: 'bc-w2',
    course: 'Business Communication',
    code: 'BC107',
    week: 'Week 2',
    accent: 'purple',
    items: [
      { id: 'r-open', title: 'Opening a presentation', count: 6, text: '6 mistakes in Presentation basics, last Friday', play: { subjectId: 'a', taskId: 'a7' } },
      { id: 'r-resume', title: 'Reports and resumes', count: 3, text: '3 mistakes in Practice: multiple choice, last Monday', play: { subjectId: 'a', taskId: 'a8' } },
    ],
  },
];
