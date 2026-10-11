// src/brand/Radii.js
// Radius tokens (dp)
//
// Rilla's controls are soft rectangles, not pills: the yellow Continue button,
// option rows and the speech bubble all sit at 10–14. Pills are reserved for
// things that are genuinely tags — chips, badges, avatars.

const freeze = (obj) => Object.freeze(obj);

export const Radius = freeze({
  0: 0,
  3: 3,
  4: 4,
  6: 6,
  8: 8,
  10: 10,
  12: 12,
  14: 14,
  16: 16,
  18: 18,
  20: 20,
  22: 22,
  24: 24,
  50: 50,
  full: 9999, // pill/circle
});

export const Radii = freeze({
  // Duolingo's shapes: 12 for controls, 16 for anything that holds content.
  // Circles (avatars, path coins) are shapes, not corners.
  control: freeze({ sm: Radius[8], md: Radius[10], lg: Radius[10], pill: Radius[10] }),
  button: freeze({ default: Radius[10], sm: Radius[10] }),
  option: Radius[12],
  bubble: Radius[14],
  card: freeze({ default: Radius[16], lg: Radius[20] }),
  dialog: Radius[20],
  badge: freeze({ pill: Radius[8] }),
  avatar: freeze({ circle: Radius.full }),
});
