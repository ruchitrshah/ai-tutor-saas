import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions, Animated } from 'react-native';
import { Colors, Space, Type } from '../brand';
import { useBottomInset } from '../brand/responsive';
import GlassSurface, { GLASS_PAD, GLASS_SIDE_GAP, glassBottomGap } from './GlassSurface';

/**
 * Footer
 * Absolutely positioned action bar pinned to the bottom of a screen.
 * Variants:
 * - 'single': one primary action (default)
 * - 'dual': two actions side-by-side (Back/Continue)
 * - 'stack': actions stacked vertically
 */

// Height of one Button: minHeight Space[52], with paddingVertical Space[16]
// wrapped around its line box. The line box grows with the OS font-size
// setting, so measure it rather than assuming the default.
const BUTTON_MIN_HEIGHT = Space[52];
const BUTTON_PADDING_Y = Space[16];

const buttonHeight = (osFontScale) =>
  Math.max(
    BUTTON_MIN_HEIGHT,
    Math.ceil((Type.button.lineHeight ?? 22) * osFontScale) + BUTTON_PADDING_Y * 2
  );

// Glass panel padding: GLASS_PAD on top and bottom (and on both sides — see
// `panel`). The panel floats, so the bottom inset is replaced by
// `glassBottomGap` of empty screen under it.
const FOOTER_CHROME = GLASS_PAD * 2;

/**
 * Real rendered height of the Footer on this device, including the space it
 * reserves for the home indicator / Android system navigation bar.
 *
 * Screens should use this for their scroll `paddingBottom` so the last field
 * clears the footer. The old exported `FOOTER_HEIGHT` constant could not see
 * safe-area insets, so it under-reported by up to 28dp on Android hardware
 * using 3-button navigation.
 */
/** Rendered height of one Button on this device, at the OS font scale. */
export function useButtonHeight() {
  const { fontScale } = useWindowDimensions();
  return buttonHeight(fontScale);
}

export function useFooterHeight(variant = 'single') {
  const bottomInset = useBottomInset();
  const { fontScale } = useWindowDimensions();
  const rows = variant === 'stack' ? 2 : 1;
  const gap = variant === 'stack' ? Space[15] : 0;
  return FOOTER_CHROME + buttonHeight(fontScale) * rows + gap + glassBottomGap(bottomInset);
}

/**
 * @deprecated Cannot account for safe-area insets — prefer `useFooterHeight()`.
 * Kept as a worst-case-safe fallback so any un-migrated caller over-pads
 * rather than clipping content behind the footer.
 */
export const FOOTER_HEIGHT = FOOTER_CHROME + buttonHeight(1.3) + 48;

export default function Footer({ variant = 'single', children, style }) {
  const bottomInset = useBottomInset();

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { bottom: glassBottomGap(bottomInset), left: GLASS_SIDE_GAP, right: GLASS_SIDE_GAP },
        style,
      ]}
      pointerEvents="box-none"
    >
      <GlassSurface contentStyle={styles.panel}>
        <View style={[styles.content, variantStyles[variant] || variantStyles.single]}>
          {children}
        </View>
      </GlassSurface>
    </Animated.View>
  );
}

export function FooterLeft({ children }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}

export function FooterRight({ children }) {
  return <View style={{ flex: 2 }}>{children}</View>;
}

const styles = StyleSheet.create({
  // Floats over content; GlassSurface supplies the material, rim and shadow.
  wrapper: {
    position: 'absolute',
  },

  // One value on all four sides. It used to be 16 / 24 / 14 (sides / top /
  // bottom), which is why Save Changes looked off next to the tab bar.
  panel: {
    padding: GLASS_PAD,
  },

  content: {},

  // Variant styles
  single: {},

  dual: {
    flexDirection: 'row',
    gap: Space[15],
    alignItems: 'center',
  },

  stack: {
    flexDirection: 'column',
    gap: Space[15],
  },
});

const variantStyles = {
  single: styles.single,
  dual: styles.dual,
  stack: styles.stack,
};
