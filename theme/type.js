// Two content sizes, everywhere: a demibold title and a medium subtext.
// Emphasis comes from placement and colour, never from size. Controls (buttons,
// pills, nav labels) keep the sizes the shared components already give them.
import { Platform } from 'react-native';
import { Colors, FontFamilies } from '../brand';

// Fluid on the web: the size follows the window (clamp between a floor and a ceiling), so
// text is 15px+ on a phone and grows gently on a large monitor. Native keeps fixed sizes.
const fluid = (web, native) => Platform.select({ web, default: native });

// Three weights, used on purpose: Medium for reading, Demi for anything you scan (card and
// section titles, labels, buttons), Bold only for a page's own title and the big numbers.
export const TITLE = {
  fontFamily: FontFamilies.demi,
  fontSize: fluid('clamp(17px, 0.4vw + 14px, 21px)', 18),
  lineHeight: fluid('clamp(25px, 0.5vw + 21px, 29px)', 26),
  color: Colors.text.primary,
};

export const SUB = {
  fontFamily: FontFamilies.medium,
  fontSize: fluid('clamp(15px, 0.25vw + 13px, 18px)', 16),
  lineHeight: fluid('clamp(23px, 0.35vw + 20px, 27px)', 24),
  color: Colors.text.secondary,
};

// A section inside a page: lighter and smaller than the page title, in the normal text colour.
export const H2 = {
  fontFamily: FontFamilies.demi,
  fontSize: fluid('clamp(17px, 0.3vw + 15px, 20px)', 18),
  lineHeight: fluid('clamp(24px, 0.4vw + 21px, 27px)', 25),
  color: Colors.text.primary,
};

// A page's own title: the one Bold line on a screen.
export const PAGE_TITLE = {
  fontFamily: FontFamilies.heavy,
  fontSize: fluid('clamp(22px, 0.8vw + 17px, 28px)', 24),
  lineHeight: fluid('clamp(28px, 0.9vw + 22px, 34px)', 30),
  letterSpacing: -0.2,
  color: Colors.text.primary,
};
