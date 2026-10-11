// Dummy uploads for the prototype: what a student has brought in before (40 of them, so the
// list has to scroll). A real build would read these from the course-generation service.
//   kind      PDF | Slides | Doc | Image | Audio | Folder | Link (filters and icons key off it)
//   size      '2.4 MB' · '8 files' · the site for a link
//   age       when it was uploaded
//   total     exercises in the course built from it; progress × total are done
//   progress  0 to 1: how far through that course; above 0 the action says Resume
//   url       where "View" opens (links only); files open a small preview page instead
const FILE_TYPES = {
  PDF: { ext: 'pdf', size: ['1.2 MB', '2.4 MB', '3.8 MB', '860 KB'] },
  Slides: { ext: 'pptx', size: ['4.5 MB', '5.1 MB', '9.7 MB'] },
  Doc: { ext: 'docx', size: ['120 KB', '340 KB', '1.1 MB'] },
  Image: { ext: 'jpg', size: ['1.9 MB', '3.2 MB', '640 KB'] },
  Audio: { ext: 'mp3', size: ['12 MB', '18 MB', '24 MB'] },
};

const TOPICS = [
  'Marketing mix', 'Pricing strategy', 'Customer segments', 'Brand positioning', 'Email etiquette',
  'Presentation skills', 'Report writing', 'Resume tips', 'Case study: new snack', 'Negotiation basics',
  'Business grammar', 'Meeting minutes', 'SWOT analysis', 'Market research', 'Product lifecycle',
  'Active listening', 'Tone and register', 'Essay structure', 'Data storytelling', 'Team communication',
];
const AGES = ['today', 'yesterday', '2 days ago', '4 days ago', '1 week ago', '2 weeks ago', '3 weeks ago', '1 month ago'];
const SITES = ['hbr.org', 'mckinsey.com', 'grammarly.com', 'asana.com', 'coursera.org', 'forbes.com'];
const KINDS = ['PDF', 'Slides', 'Doc', 'Link', 'Folder', 'PDF', 'Audio', 'Image', 'Slides', 'Doc'];

const make = (i) => {
  const total = 8 + (i % 5) * 2;
  const kind = KINDS[i % KINDS.length];
  const topic = TOPICS[(i * 7) % TOPICS.length];
  const age = AGES[i % AGES.length];
  const progress = i % 3 === 0 ? 0.2 + ((i * 13) % 7) * 0.1 : 0;
  const id = `u${i + 1}`;
  if (kind === 'Link') {
    const site = SITES[i % SITES.length];
    return { id, kind, name: `${topic}: a quick read`, size: site, age, meta: `${site} · ${age}`, url: `https://${site}/${topic.toLowerCase().replace(/[^a-z]+/g, '-')}`, total, progress };
  }
  if (kind === 'Folder') {
    const n = `${4 + (i % 9)} files`;
    return { id, kind, name: `${topic} readings`, size: n, age, meta: `${n} · ${age}`, total, progress };
  }
  const t = FILE_TYPES[kind];
  const size = t.size[i % t.size.length];
  return { id, kind, name: `${topic} ${kind === 'Slides' ? 'slides' : 'notes'}.${t.ext}`, size, age, meta: `${size} · ${age}`, total, progress };
};

// Two awkward names on purpose: a very long one with spaces, and one with no spaces at all
// (the kind a download or a phone camera makes). The list clamps them; the detail shows them whole.
const LONG = [
  { id: 'long1', kind: 'PDF', name: 'Final draft v3 (revised after feedback) Marketing Management case study analysis, Group 7 submission, Semester 1 2026.pdf', size: '3.1 MB', age: '3 days ago', total: 12, progress: 0.4 },
  { id: 'long2', kind: 'Doc', name: 'BC107_Week3_Business_Communication_Email_Etiquette_Assignment_Rough_Notes_And_References_FINAL_final_v2.docx', size: '410 KB', age: '5 days ago', total: 10, progress: 0 },
];
LONG.forEach((u) => { u.meta = `${u.size} · ${u.age}`; });

export const UPLOADS = [...Array.from({ length: 40 }, (_, i) => make(i)).slice(0, 2), ...LONG, ...Array.from({ length: 40 }, (_, i) => make(i)).slice(2)];

// The order the filter lists them in, with the plural the menu uses.
export const KIND_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'PDF', label: 'PDFs' },
  { key: 'Slides', label: 'Slides' },
  { key: 'Doc', label: 'Documents' },
  { key: 'Image', label: 'Images' },
  { key: 'Audio', label: 'Audio' },
  { key: 'Folder', label: 'Folders' },
  { key: 'Link', label: 'Links' },
];
