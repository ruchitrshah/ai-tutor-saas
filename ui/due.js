// Due dates are real dates, worked out from today. A deadline that is close gets a
// colour, so it can be seen at a glance; one that is far away stays quiet.
//   overdue  red     "Overdue"
//   today    red     "Due today"
//   tomorrow amber   "Due tomorrow"
//   later    quiet   "Due on October 11th"
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const ordinal = (n) => {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${{ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'}`;
};

export function dueInfo(subject, now = new Date()) {
  const days = subject.dueIn ?? 3;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  if (days < 0) return { tone: 'overdue', label: 'Overdue', date: d };
  if (days === 0) return { tone: 'today', label: 'Due today', date: d };
  if (days === 1) return { tone: 'tomorrow', label: 'Due tomorrow', date: d };
  return { tone: 'later', label: `Due on ${MONTHS[d.getMonth()]} ${ordinal(d.getDate())}`, date: d };
}
