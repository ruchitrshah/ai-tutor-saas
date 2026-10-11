import { Platform, Dimensions, PixelRatio } from 'react-native';
import { Colors } from './Colors';

const freeze = (obj) => Object.freeze(obj);

// ─── Screen dimensions ────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Design baseline ─────────────────────────────────────────────────────────
// DESIGN_WIDTH is the phone width the native sizes are tuned for (Pro Max,
// 430pt). Smaller phones scale down from there; nothing ever scales up.
const DESIGN_WIDTH = 430;

// Rilla onboarding is web-first — a manager signs up from rilla.com on a
// laptop — so the scale below is tuned for desktop web at 1:1. The house
// default of 0.9 on web existed to shrink a phone-first scale onto monitors;
// here that would shrink the primary surface to fit a secondary one.
const FONT_SCALE_WEB = 1;

// ─── Compute per-platform font scale ─────────────────────────────────────────
//
// Rule: never scale UP (don't enlarge text on wider screens).
// Native: proportional from DESIGN_WIDTH, floor 0.82 — same on iOS & Android.
// Inter loads the identical TTF on both, so there is no metric difference for
// a platform-specific penalty to correct.
export const FONT_SCALE = (() => {
  if (Platform.OS === 'web') return FONT_SCALE_WEB;
  const screenRatio = Math.min(1, SCREEN_WIDTH / DESIGN_WIDTH);
  return Math.max(0.82, screenRatio);
})();

// ─── Space scale (margins, padding) ──────────────────────────────────────────
// Slightly less aggressive than font scale so layouts don't collapse on small
// screens, but still reduces proportionally. Capped higher (0.88 floor).
export const SPACE_SCALE = (() => {
  if (Platform.OS === 'web') return 1.0;
  const screenRatio = Math.min(1, SCREEN_WIDTH / DESIGN_WIDTH);
  return Math.max(0.88, screenRatio);
})();

export const scaleSpace = (value) =>
  SPACE_SCALE < 1 ? Math.round(value * SPACE_SCALE) : value;

const scaleFont = (s) =>
  FONT_SCALE < 1 ? PixelRatio.roundToNearestPixel(s * FONT_SCALE) : s;

// ─── Token Builder ────────────────────────────────────────────────────────────
// Line height follows the scaled font size so the design ratio survives, and
// text never clips when the OS font size is raised.
// Nothing in the product is set smaller than 15px: a token that asks for less is
// raised to 15 with a proportionate line height.
const MIN_FONT = 15;
const t = (raw) => {
  const tooSmall = raw.fontSize && raw.fontSize < MIN_FONT;
  const style = tooSmall
    ? { ...raw, fontSize: MIN_FONT, ...(raw.lineHeight && { lineHeight: Math.max(raw.lineHeight, Math.round(MIN_FONT * 1.45)) }) }
    : raw;
  const scaledFontSize = style.fontSize ? scaleFont(style.fontSize) : undefined;

  let scaledLineHeight;
  if (style.fontSize && style.lineHeight) {
    const ratio = style.lineHeight / style.fontSize;
    scaledLineHeight = PixelRatio.roundToNearestPixel(scaledFontSize * ratio);
  } else if (style.lineHeight) {
    scaledLineHeight =
      FONT_SCALE < 1 ? PixelRatio.roundToNearestPixel(style.lineHeight * FONT_SCALE) : style.lineHeight;
  }

  return {
    ...style,
    ...(scaledFontSize && { fontSize: scaledFontSize }),
    ...(scaledLineHeight && { lineHeight: scaledLineHeight }),
  };
};

// ─── Font families ────────────────────────────────────────────────────────────
// Inter is the primary face, everywhere. Five weights, each with a job:
//   regular — long-form copy and fine print
//   medium  — body, option rows, the speech bubble
//   demi    — labels, buttons, emphasis
//   bold    — titles
//   heavy   — the few numbers and headlines that have to land from across a
//             room: the price, the licence count, the trial headline. This is
//             what Duolingo gets from Feather Bold — a confident, chunky voice
//             at the moments that ask for commitment.
//
// Druk is Rilla's display face (rilla.com's hero, the "ARE YOU SURE?" dialog).
// It is not a body font and appears only at a handful of shout moments. If a
// screen reaches for it twice, one of them is wrong.
export const FontFamilies = freeze({
  regular: 'MaisonNeue-Medium',
  medium: 'MaisonNeue-Medium',
  demi: 'MaisonNeue-Demi',
  bold: 'MaisonNeue-Demi',
  heavy: 'MaisonNeue-Bold',
  display: 'MaisonNeue-Demi',
  displayTall: 'MaisonNeue-Bold',
});

export const FontAssets = freeze({
  'MaisonNeue-Medium': require('../assets/fonts/MaisonNeueMedium.otf'),
  'MaisonNeue-Demi': require('../assets/fonts/MaisonNeueDemi.otf'),
  'MaisonNeue-Bold': require('../assets/fonts/MaisonNeueBold.otf'),
});

export const FontSizes = freeze({
  88: 88, 64: 64, 48: 48, 42: 42, 40: 40, 32: 32, 28: 28, 24: 24, 22: 22, 20: 20,
  18: 18, 17: 17, 16: 16, 15: 15, 14: 14, 13: 13, 12: 12, 11: 11,
});

export const LineHeights = freeze({
  80: 80, 60: 60, 52: 52, 44: 44, 40: 40, 38: 38, 36: 36, 32: 32, 30: 30, 28: 28,
  26: 26, 24: 24, 23: 23, 22: 22, 20: 20, 18: 18, 16: 16, 14: 14,
});

// Numbers that change in place (licence counts, prices, card digits) use
// tabular figures so the row doesn't shimmy as digits change width.
const TABULAR = ['tabular-nums'];

// ─── Type tokens ──────────────────────────────────────────────────────────────
export const Type = freeze({
  // Rilla's shout. Dialog titles and one celebration — nowhere else.
  display: t({
    fontFamily: FontFamilies.display,
    fontSize: FontSizes[24],
    lineHeight: LineHeights[32],
    color: Colors.text.accent,
    letterSpacing: -0.48,
  }),

  // Onsite Brand/brand-xl — Druk Medium 42/38.
  hero: t({
    fontFamily: FontFamilies.displayTall,
    fontSize: FontSizes[42],
    lineHeight: LineHeights[38],
    color: Colors.text.primary,
  }),

  pageTitle: t({
    fontFamily: FontFamilies.display,
    fontSize: FontSizes[32],
    lineHeight: LineHeights[38],
    color: Colors.text.primary,
    letterSpacing: -1.28,
  }),

  // Rilla the Gorilla's voice. Every onboarding question is asked here. Sized
  // like Duolingo's bubble: a line of speech, not a headline — the answers
  // below are the loudest thing on the screen.
  bubble: t({
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes[18],
    lineHeight: LineHeights[28],
    color: Colors.text.primary,
  }),

  // Full-screen trial moments ("We'll remind you 2 days before…").
  takeoverTitle: t({
    fontFamily: FontFamilies.display,
    fontSize: FontSizes[32],
    lineHeight: LineHeights[38],
    color: Colors.text.primary,
    letterSpacing: -1.28,
    textAlign: 'center',
  }),

  // Centered form and reward headings ("Create your profile").
  formTitle: t({
    fontFamily: FontFamilies.display,
    fontSize: FontSizes[24],
    lineHeight: LineHeights[32],
    color: Colors.text.primary,
    letterSpacing: -0.48,
    textAlign: 'center',
  }),

  carousalText: t({
    fontFamily: FontFamilies.display,
    fontSize: FontSizes[32],
    lineHeight: LineHeights[38],
    color: Colors.text.primary,
    letterSpacing: -1.28,
  }),

  subtitle: t({
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes[18],
    lineHeight: LineHeights[28],
    color: Colors.text.tertiary,
  }),

  biotext: t({
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes[15],
    lineHeight: LineHeights[23],
    color: Colors.text.secondary,
  }),

  sectionHeader: t({
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes[18],
    lineHeight: LineHeights[28],
    color: Colors.text.primary,
    marginTop: scaleSpace(32),
    marginBottom: scaleSpace(12),
  }),

  cardTitle: t({
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes[18],
    lineHeight: LineHeights[28],
    color: Colors.text.primary,
  }),

  modalTitle: t({
    fontFamily: FontFamilies.display,
    fontSize: FontSizes[24],
    lineHeight: LineHeights[32],
    color: Colors.text.primary,
    letterSpacing: -0.48,
  }),

  bodyPrimary: t({
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes[15],
    lineHeight: LineHeights[23],
    color: Colors.text.primary,
  }),

  bodySecondary: t({
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes[15],
    lineHeight: LineHeights[23],
    color: Colors.text.secondary,
  }),

  bodyTertiary: t({
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes[14],
    lineHeight: LineHeights[20],
    color: Colors.text.tertiary,
  }),

  bodyTertiaryTight: t({
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes[14],
    lineHeight: LineHeights[18],
    color: Colors.text.tertiary,
  }),

  primaryValue: t({
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes[15],
    lineHeight: LineHeights[23],
    color: Colors.text.primary,
    fontVariant: TABULAR,
  }),

  price: t({
    fontFamily: FontFamilies.display,
    fontSize: FontSizes[32],
    lineHeight: LineHeights[38],
    color: Colors.text.primary,
    letterSpacing: -1.28,
    fontVariant: TABULAR,
  }),

  priceSmall: t({
    fontFamily: FontFamilies.display,
    fontSize: FontSizes[24],
    lineHeight: LineHeights[32],
    color: Colors.text.primary,
    letterSpacing: -0.48,
    fontVariant: TABULAR,
  }),

  label: t({
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes[12],
    lineHeight: LineHeights[16],
    color: Colors.text.tertiary,
  }),

  formLabel: t({
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes[14],
    lineHeight: LineHeights[20],
    color: Colors.text.label,
    marginBottom: scaleSpace(8),
  }),

  hint: t({
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes[14],
    lineHeight: LineHeights[20],
    color: Colors.text.hint,
  }),

  note: t({
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes[14],
    lineHeight: LineHeights[20],
    color: Colors.text.accent,
  }),

  badgeLabel: t({
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes[12],
    lineHeight: LineHeights[16],
  }),

  empty: t({
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes[15],
    lineHeight: LineHeights[23],
    color: Colors.text.tertiary,
    marginTop: scaleSpace(8),
  }),

  caption: t({
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes[12],
    lineHeight: LineHeights[16],
    color: Colors.text.tertiary,
  }),

  captionBold: t({
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes[12],
    lineHeight: LineHeights[16],
    color: Colors.text.primary,
  }),

  button: t({
    fontFamily: FontFamilies.demi,
    fontSize: FontSizes[14],
    lineHeight: LineHeights[20],
  }),

  chip: t({
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes[15],
    lineHeight: LineHeights[23],
    color: Colors.text.primary,
  }),

  chipSelected: t({
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes[15],
    lineHeight: LineHeights[23],
    color: Colors.text.accent,
  }),

  option: t({
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes[15],
    lineHeight: LineHeights[23],
    color: Colors.text.primary,
  }),

  optionSelected: t({
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes[15],
    lineHeight: LineHeights[23],
    color: Colors.text.accent,
  }),

  snackbar: t({
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes[14],
    lineHeight: LineHeights[20],
    color: Colors.text.onDark,
  }),
});
