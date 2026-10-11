// Button labels are Title Case: "Course Details", "Tap to Talk", "Just Give Me the
// Answer". Small joining words stay lowercase unless they open the label.
const MINOR = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'at', 'by', 'with', 'is', 'as']);

export function titleCase(str) {
  if (typeof str !== 'string') return str;
  return str
    .split(' ')
    .map((w, i) => {
      if (!w) return w;
      const lower = w.toLowerCase();
      if (i > 0 && MINOR.has(lower)) return lower;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}
