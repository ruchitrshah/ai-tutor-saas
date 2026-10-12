// Duolingo's brand palette, with the two adjustments accessibility needs.
//
//   Feather Green #58CC02   done, correct, "go"
//   Macaw Blue    #1CB0F6   the main action, selection, links
//   Bee Yellow    #FFC800   earned, highlights
//   Fox Orange    #FF9600   urgency
//   Beetle Purple #CE82FF   identity
//   Cardinal Red  #FF4B4B   errors
//   Eel / Wolf / Hare / Swan / Snow   the neutrals
//
// Dark mode uses Duolingo's blue-black (#131F24), not a neutral grey: that tint is
// most of why it feels like a game rather than a dashboard.
//
// The two adjustments:
//  1. Text on a bright fill is DARK, in both themes (as Duolingo does in dark mode):
//     white on Macaw is 2.4:1, dark on Macaw is 6.9:1.
//  2. A colour used as *text* gets its own tone (`*.text`) that clears 4.5:1 on its
//     background; the bright tone is for fills, bars and borders.
//
// Every fill also carries an `edge`: the darker tone of the 3D lip under buttons,
// cards and path coins.
//
// The category shape is the house system's (text / surface / border / ...), so
// components that read `Colors.text.primary` re-theme without code changes.
import { THEME } from './theme';

const freeze = (obj) => Object.freeze(obj);

export const ColorUtils = freeze({
  rgba(hex, alpha = 1) {
    const h = String(hex || '').replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },
});
const { rgba } = ColorUtils;

const INK = '#0B1A20'; // text on any bright fill
const BLUE_INK = '#052B47'; // text on the blue fill: a dark blue, 5.9:1 on #1CB0F6

const dark = {
  mode: 'dark',
  page: '#131F24',
  card: '#202F36',
  raised: '#2A3B44',
  hover: '#33454E',
  line: '#2F4049', // hairlines
  lineStrong: '#37464F', // 2px card borders, the lip under cards
  control: '#667A86', // borders of inputs and answer rows (3.1:1)
  text: '#FFFFFF',
  textSecondary: '#B7C4CB',
  textMuted: '#8DA0AB',
  textDisabled: '#5B6E79',
  track: '#37464F',
  scrim: rgba('#000000', 0.6),
  blue: { solid: '#1CB0F6', edge: '#1899D6', text: '#49C0F8', soft: rgba('#1CB0F6', 0.16), line: rgba('#1CB0F6', 0.55) },
  green: { solid: '#58CC02', edge: '#58A700', text: '#89E219', soft: rgba('#58CC02', 0.16) },
  red: { solid: '#FF4B4B', edge: '#EA2B2B', text: '#FF7878', soft: rgba('#FF4B4B', 0.16) },
  yellow: { solid: '#FFC800', edge: '#E5B400', text: '#FFC800', soft: rgba('#FFC800', 0.16) },
  orange: { solid: '#FF9600', edge: '#E58700', text: '#FFAB33', soft: rgba('#FF9600', 0.16) },
  purple: { solid: '#CE82FF', edge: '#A568CC', text: '#CE82FF', soft: rgba('#CE82FF', 0.16) },
  gray: { solid: '#8DA0AB', edge: '#667A86', text: '#B7C4CB', soft: '#2A3B44', line: '#4A5C66' },
};

const light = {
  mode: 'light',
  page: '#FFFFFF',
  card: '#FFFFFF',
  raised: '#F7F7F7',
  hover: '#F0F0F0',
  line: '#E5E5E5',
  lineStrong: '#E5E5E5',
  control: '#949494',
  text: '#4B4B4B',
  textSecondary: '#6B6B6B',
  textMuted: '#6F6F6F',
  textDisabled: '#AFAFAF',
  track: '#E5E5E5',
  scrim: rgba('#0B1A20', 0.45),
  blue: { solid: '#1CB0F6', edge: '#1899D6', text: '#0B78BC', soft: '#DDF4FF', line: '#84D8FF' },
  green: { solid: '#58CC02', edge: '#58A700', text: '#2E7D00', soft: '#E6F6D9' },
  red: { solid: '#FF4B4B', edge: '#EA2B2B', text: '#D92B2E', soft: '#FFE7E7' },
  yellow: { solid: '#FFC800', edge: '#E5B400', text: '#8A5A00', soft: '#FFF4CC' },
  orange: { solid: '#FF9600', edge: '#E58700', text: '#B55E00', soft: '#FFE8CC' },
  purple: { solid: '#CE82FF', edge: '#A568CC', text: '#8A3FD6', soft: '#F3E5FF' },
  gray: { solid: '#AFAFAF', edge: '#949494', text: '#6B6B6B', soft: '#F2F2F2', line: '#D4D4D4' },
};

const T = THEME === 'dark' ? dark : light;
const A = (c) => freeze({ ...c });

// Accent colours by name, for fills, bars and borders (not body text).
const accent = freeze({
  blue: A(T.blue),
  green: A(T.green),
  purple: A(T.purple),
  gray: A(T.gray),
  orange: A(T.orange),
  yellow: A(T.yellow),
  red: A(T.red),
  // legacy names
  pink: A(T.red),
  teal: A(T.blue),
});

export const Palette = freeze({ ...T, ink: INK, accent });

export const Colors = freeze({
  mode: T.mode,
  accent,
  ink: INK,
  blueInk: BLUE_INK,

  brand: freeze({
    primary: T.blue.solid,
    onPrimary: BLUE_INK,
    edge: T.blue.edge,
    hover: T.blue.text,
    soft: T.blue.soft,
    softStrong: T.blue.soft,
    borderSoft: T.blue.line,
    gold: T.yellow.solid,
    goldDeep: T.yellow.edge,
  }),

  status: freeze({
    success: T.green.solid,
    successEdge: T.green.edge,
    successText: T.green.text,
    successSoft: T.green.soft,
    onSuccess: INK,
    // `danger` is the text-safe tone (usable as text and border); `dangerFill` the bright one.
    danger: T.red.text,
    dangerFill: T.red.solid,
    dangerEdge: T.red.edge,
    dangerSoft: T.red.soft,
    dangerBorderSoft: rgba(T.red.solid, 0.5),
    warning: T.yellow.solid,
    warningText: T.orange.text,
    warningSoft: T.orange.soft,
  }),

  text: freeze({
    primary: T.text,
    secondary: T.textSecondary,
    tertiary: T.textSecondary,
    muted: T.textMuted,

    label: T.textSecondary,
    hint: T.textMuted,
    placeholder: T.textMuted,
    disabled: T.textDisabled,
    accent: T.blue.text,
    link: T.blue.text,
    // Label colour for secondary and tertiary buttons: the dark blue on light, the light blue on dark.
    action: T.mode === 'dark' ? T.blue.text : BLUE_INK,

    onDark: '#FFFFFF',
    onLight: '#4B4B4B',
    onBrand: BLUE_INK,
  }),

  icon: freeze({
    primary: T.text,
    secondary: T.textSecondary,
    muted: T.textMuted,
    accent: T.blue.solid,
    onDark: '#FFFFFF',
  }),

  surface: freeze({
    page: T.page,
    card: T.card,
    raised: T.raised,
    hover: T.hover,
    selected: T.blue.soft,
    chrome: T.page,
    inverse: T.text,

    subtle: T.page,
    soft: T.raised,

    snackbar: T.raised,
  }),

  background: freeze({
    surface: T.card,
    page: T.page,
    card: T.card,
    subtle: T.page,
    soft: T.raised,
  }),

  border: freeze({
    hairline: T.line,
    subtle: T.lineStrong,
    default: T.lineStrong,
    strong: T.control,
    control: T.control,

    focus: T.blue.solid,
    brand: T.blue.solid,
    danger: T.red.solid,
  }),

  progress: freeze({
    fill: T.green.solid,
    track: T.track,
  }),

  shadow: freeze({ color: '#000000' }),

  overlay: freeze({ scrim: T.scrim, scrimStrong: T.scrim }),

  avatar: freeze([T.blue.solid, T.green.solid, T.yellow.solid, T.orange.solid, T.purple.solid]),
});

const btn = (c, extra = {}) =>
  freeze({ background: c.solid, foreground: INK, border: c.solid, edge: c.edge, spinner: INK, ...extra });

export const ComponentTokens = freeze({
  button: freeze({
    primary: btn(T.blue, { foreground: BLUE_INK, spinner: BLUE_INK }),
    success: btn(T.green),
    danger: btn(T.red),
    warning: btn(T.yellow),
    // The quiet button: card face, 2px border and lip in the border colour, blue label.
    outline: freeze({
      background: T.card,
      foreground: T.mode === 'dark' ? T.blue.text : BLUE_INK,
      border: T.lineStrong,
      edge: T.lineStrong,
      spinner: T.blue.text,
    }),
    secondary: freeze({
      background: T.blue.soft,
      foreground: T.blue.text,
      border: T.blue.soft,
      edge: T.blue.line,
      spinner: T.blue.text,
    }),
    ghost: freeze({
      background: 'transparent',
      foreground: T.mode === 'dark' ? T.blue.text : BLUE_INK,
      border: 'transparent',
      spinner: T.blue.text,
    }),
    white: freeze({
      background: '#FFFFFF',
      foreground: INK,
      border: '#FFFFFF',
      edge: '#D8D8D8',
      spinner: INK,
    }),
    whiteOutline: freeze({
      background: 'transparent',
      foreground: '#FFFFFF',
      border: '#FFFFFF',
      spinner: '#FFFFFF',
    }),
    // Flat, like Duolingo's greyed CONTINUE: no lip, so enabling it never shifts layout.
    disabled: freeze({
      background: T.mode === 'dark' ? '#37464F' : '#E5E5E5',
      foreground: T.mode === 'dark' ? '#6F828D' : '#AFAFAF',
      border: T.mode === 'dark' ? '#37464F' : '#E5E5E5',
      edge: T.mode === 'dark' ? '#37464F' : '#E5E5E5',
      spinner: T.textDisabled,
    }),
  }),

  chip: freeze({
    default: freeze({ background: T.card, border: T.lineStrong, foreground: T.text }),
    selected: freeze({ background: T.blue.soft, border: T.blue.solid, foreground: T.blue.text }),
    disabled: freeze({ background: T.raised, border: T.line, foreground: T.textMuted }),
    error: freeze({ background: T.red.soft, border: T.red.solid, foreground: T.red.text }),
  }),

  // Answer tiles: 2px border standing on a 4px lip. Chosen = tinted blue; correct =
  // green; wrong = red. Colour never works alone (each also shows an icon and a word).
  option: freeze({
    default: freeze({ background: T.card, border: T.lineStrong, lip: T.lineStrong, foreground: T.text, control: T.control }),
    hover: freeze({ background: T.raised, border: T.lineStrong }),
    selected: freeze({ background: T.blue.soft, border: T.blue.solid, lip: T.blue.edge, foreground: T.text, control: T.blue.solid }),
    correct: freeze({ background: T.green.soft, border: T.green.solid, lip: T.green.edge, foreground: T.text, control: T.green.solid }),
    wrong: freeze({ background: T.red.soft, border: T.red.solid, lip: T.red.edge, foreground: T.text, control: T.red.solid }),
  }),

  badge: freeze({
    neutral: freeze({ background: T.raised, border: T.lineStrong, foreground: T.textSecondary }),
    brand: freeze({ background: T.blue.soft, border: T.blue.line, foreground: T.blue.text }),
    success: freeze({ background: T.green.soft, border: T.green.solid, foreground: T.green.text }),
    danger: freeze({ background: T.red.soft, border: T.red.solid, foreground: T.red.text }),
    warning: freeze({ background: T.orange.soft, border: T.orange.solid, foreground: T.orange.text }),
  }),
});
