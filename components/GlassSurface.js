import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * The one glass material for bottom-anchored chrome (TabBar, Footer), so they
 * read as the same surface.
 *
 * Built the way the system builds it rather than as a flat translucent panel:
 *   - a real backdrop blur, with saturation boosted so colour behind the bar
 *     stays alive instead of going grey,
 *   - a top-lit specular gradient (light catches the upper edge of glass),
 *   - a bright inner rim over a faint dark outer hairline, which is what makes
 *     the edge look like a bevel instead of a border,
 *   - a continuous (squircle) corner and a soft, low shadow that lifts it off
 *     the content without a hard edge.
 *
 * expo-blur does not blur on Android without the experimental Dimezis backend,
 * so there it is a near-opaque surface with the same rim — scrolled content
 * must not show through the buttons.
 */

export const GLASS_RADIUS = 34;

// Space between the bar and the screen's bottom/side edges. The bar floats.
export const GLASS_SIDE_GAP = 12;

// Inset between the capsule edge and the buttons inside it — the SAME value on
// every side and in every glass bar (Footer, TabBar actions), so a Save button
// and a Connect button sit at identical distances from the glass edge.
export const GLASS_PAD = 14;
// iOS tucks the capsule in toward the home indicator (it is a gesture bar, not
// a surface). Android keeps the FULL inset so the bar never sits under the
// 24dp gesture / 48dp 3-button navigation bar.
export const glassBottomGap = (bottomInset) => {
  if (Platform.OS === 'web') return 16;
  if (Platform.OS === 'android') return Math.max(bottomInset, 12) + 4;
  return Math.max(bottomInset - 8, 12);
};

export default function GlassSurface({
  children,
  style,
  contentStyle,
  radius = GLASS_RADIUS,
}) {
  const corner = {
    borderRadius: radius,
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' } : null),
  };

  return (
    <View style={[styles.shadow, corner, style]} pointerEvents="box-none">
      <View style={[styles.clip, corner]}>
        <Backdrop />

        {/* Light catching the upper edge. */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0.62)', 'rgba(255,255,255,0.14)', 'rgba(255,255,255,0.28)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={contentStyle}>{children}</View>

        {/* Bevel: bright inner rim. Drawn last so it sits over the content edge. */}
        <View pointerEvents="none" style={[styles.rim, corner]} />
      </View>
    </View>
  );
}

function Backdrop() {
  if (Platform.OS === 'web') {
    return <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.web]} />;
  }
  if (Platform.OS === 'android') {
    return <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.android]} />;
  }
  return (
    <BlurView
      pointerEvents="none"
      intensity={70}
      tint="systemThinMaterialLight"
      style={StyleSheet.absoluteFill}
    />
  );
}

const styles = StyleSheet.create({
  shadow: {
    // Faint fill so iOS has a shape to cast the shadow from.
    backgroundColor: 'rgba(255,255,255,0.35)',
    ...Platform.select({
      ios: {
        shadowColor: '#0B1220',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
      },
      android: { elevation: 14 },
      web: { boxShadow: '0 10px 32px rgba(11,18,32,0.14), 0 1px 3px rgba(11,18,32,0.08)' },
    }),
  },
  clip: { overflow: 'hidden' },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  android: { backgroundColor: 'rgba(250,250,252,0.96)' },
  web: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    backdropFilter: 'blur(28px) saturate(190%)',
    WebkitBackdropFilter: 'blur(28px) saturate(190%)',
  },
});
