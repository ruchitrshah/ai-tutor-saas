// Icons say what a thing is. Colour does not: there are two brand colours, and
// identity comes from the glyph and the label.
import {
  data, BookOpen, Briefcase, ChartColumn, ClipboardCheck, ClipboardList, Code, Dumbbell, FileText, MessageCircle,
  Megaphone, Mic, PenLine, Presentation, Repeat, ShoppingBag, Terminal, Type,
} from './icons';

export const KIND = {
  practice: { Icon: Dumbbell, name: 'Dumbbell', accent: 'blue', label: 'Practice' },
  case: { Icon: Briefcase, name: 'Briefcase', accent: 'blue', label: 'Case study' },
  quiz: { Icon: ClipboardCheck, name: 'ClipboardCheck', accent: 'blue', label: 'Quiz' },
  speak: { Icon: Mic, name: 'Mic', accent: 'blue', label: 'Speaking' },
  write: { Icon: PenLine, name: 'PenLine', accent: 'blue', label: 'Writing' },
  code: { Icon: Code, name: 'Code', accent: 'blue', label: 'Code lab' },
  blank: { Icon: Type, name: 'Type', accent: 'blue', label: 'Fill in the blank' },
  match: { Icon: Repeat, name: 'Repeat', accent: 'blue', label: 'Match pairs' },
  order: { Icon: ClipboardList, name: 'ClipboardList', accent: 'blue', label: 'Put in order' },
};

// A task can name a more specific glyph (data/courses.js: `icon`).
const BY_NAME = { Type, FileText, Presentation, ClipboardList, ShoppingBag, Repeat, ChartColumn, Briefcase, PenLine, Mic, ClipboardCheck, Code };
export const taskIcon = (task) => BY_NAME[task.icon] || KIND[task.kind].Icon;
// The same glyph as raw icon data, for MorphIcon.
export const taskNode = (task) => data[task.icon || KIND[task.kind].name];

// Identity colour: each subject and each skill has its own, used for its
// progress fill. Icons are not part of identity; see ui/icons.js for where they go.
export const SUBJECT_STYLE = {
  a: { accent: 'purple' },
  b: { accent: 'orange' },
  c: { accent: 'green' },
  d: { accent: 'blue' },
};

export const SKILL_STYLE = {
  coding: { accent: 'blue' },
  writing: { accent: 'purple' },
  speaking: { accent: 'orange' },
};

export { BookOpen };
