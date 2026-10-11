// Fluid sizes for the web: a size follows the window instead of jumping at breakpoints.
// `fs(n)` is a font size designed at n px for a ~1280px window. It shrinks to about 88% on
// a phone, never below 15px, and grows to about 110% on a very large monitor. `lh(n)` does
// the same for a line height so the two stay in proportion. Native keeps the plain number.
import { Platform } from 'react-native';

const r = (x) => Math.round(x * 100) / 100;
const fluid = (n, min, max) =>
  `clamp(${r(min)}px, ${r(n * 0.8)}px + ${r(n * 0.015625)}vw, ${r(max)}px)`;

export const fs = (n) => (Platform.OS === 'web' ? fluid(n, Math.max(15, Math.round(n * 0.88)), Math.round(n * 1.1)) : n);
export const lh = (n) => (Platform.OS === 'web' ? fluid(n, Math.round(n * 0.88), Math.round(n * 1.1)) : n);
