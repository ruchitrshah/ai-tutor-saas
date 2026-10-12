// A flat button. A bright face, a 6px radius, no 3D lip: it should not look like a key
// you push down. What tells you it is live is feedback, not decoration:
//   hover  a slight dim of the fill (no glow)
//   press  a 3% shrink (instant, ease-out) that springs back on release
// One blue for every action, everywhere; `success` is kept as a name but renders as the
// primary blue so no screen can drift into a second button colour.
// Labels are Title Case; label colour is dark on bright faces (see brand/Colors.js).
//
//   primary  blue · every main action
//   danger   red  · destructive
//   outline  card face, 2px border, blue label · the quiet option
//   ghost    text only · the quietest
//   disabled flat grey
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { CONTROL, Space } from '../brand/Spacing';
import { ColorUtils, ComponentTokens } from '../brand/Colors';
import { Radii } from '../brand/Radii';
import { FontFamilies } from '../brand/Typescale';
import { Motion, useReducedMotion } from '../brand/Motion';
import { titleCase } from '../ui/text';
import { fs, lh } from '../theme/fluid';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Button({
  title,
  onPress,
  variant: asked = 'primary',
  size = 'md', // md: 36 tall, the same height as a chip (default) · lg: 48 tall, for a standalone call to action
  disabled = false,
  loading = false,
  haptic = 'light',
  accessibilityLabel,
  labelColor, // overrides the label colour for this one button
  style,
  children,

  // Success morph: the label crossfades into an icon (and optional shorter label) in
  // place, so the confirmation lands where the finger already is.
  success = false,
  successTitle,
  SuccessIcon,
}) {
  const variant = asked === 'success' ? 'primary' : asked === 'whiteSolid' ? 'white' : asked;
  const tokens = disabled ? ComponentTokens.button.disabled : ComponentTokens.button[variant] || ComponentTokens.button.primary;
  const reduced = useReducedMotion();
  const native = Platform.OS !== 'web';
  const [hover, setHover] = useState(false);

  const live = !disabled && !loading;
  const press = useRef(new Animated.Value(0)).current;
  const morph = useRef(new Animated.Value(success ? 1 : 0)).current;
  const hasMorph = !!SuccessIcon || !!successTitle;

  useEffect(() => {
    Animated.spring(morph, { toValue: success ? 1 : 0, ...Motion.spring.pop, useNativeDriver: native }).start();
  }, [success, morph, native]);

  const animate = useCallback(
    (to) => {
      if (!live || reduced || variant === 'ghost') return;
      Animated.timing(press, { toValue: to, duration: to ? Motion.duration.pressIn : Motion.duration.pressOut, easing: Motion.ease.out, useNativeDriver: native }).start();
    },
    [press, live, reduced, variant, native]
  );

  const handlePress = useCallback(async () => {
    if (!onPress || !live) return;
    if (native && haptic !== 'none') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) { /* noop */ }
    }
    onPress();
  }, [onPress, live, haptic, native]);

  // Hover: the fill dims slightly (filled buttons), or a firmer border (outline).
  const filled = variant === 'primary' || variant === 'danger' || variant === 'warning' || variant === 'white';
  const hoverStyle = useMemo(() => {
    if (!hover || !live || !Platform.OS === 'web') return null;
    if (filled) return { opacity: 0.9 };
    if (variant === 'outline') return { borderColor: tokens.foreground };
    return null;
  }, [hover, live, filled, variant, tokens]);

  const faceStyle = [
    styles.face,
    size === 'lg' ? styles.faceLg : styles.faceMd,
    size === 'lg' ? null : variant === 'ghost' && styles.ghostMd,
    { backgroundColor: tokens.background, borderColor: tokens.border },
    variant === 'outline' && styles.outline,
    variant === 'ghost' && styles.ghost,
    hoverStyle,
    Platform.select({ web: { transitionProperty: 'opacity, border-color, background-color', transitionDuration: '180ms', transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' } }),
    live && !reduced && variant !== 'ghost' && { transform: [{ scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) }] },
  ];

  const textStyle = [styles.text, size === 'lg' ? styles.textLg : styles.textMd, { color: labelColor || tokens.foreground }];
  const idleOpacity = morph.interpolate({ inputRange: [0, 0.45], outputRange: [1, 0], extrapolate: 'clamp' });
  const idleScale = morph.interpolate({ inputRange: [0, 1], outputRange: reduced ? [1, 1] : [1, 0.88], extrapolate: 'clamp' });
  const inOpacity = morph.interpolate({ inputRange: [0.35, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const inScale = morph.interpolate({ inputRange: [0, 1], outputRange: reduced ? [1, 1] : [0.8, 1], extrapolate: 'clamp' });

  const label = children || (
    <Text style={textStyle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9}>
      {titleCase(title)}
    </Text>
  );

  return (
    <View style={[styles.wrap, style]}>
      <AnimatedPressable
        style={faceStyle}
        onPress={handlePress}
        onPressIn={() => animate(1)}
        onPressOut={() => animate(0)}
        onHoverIn={() => setHover(true)}
        onHoverOut={() => setHover(false)}
        disabled={!live}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: !live }}
      >
        {loading ? (
          <ActivityIndicator color={tokens.spinner} />
        ) : hasMorph ? (
          <View style={styles.center}>
            <Animated.View style={[styles.center, { opacity: idleOpacity, transform: [{ scale: idleScale }] }]}>{label}</Animated.View>
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center, { opacity: inOpacity, transform: [{ scale: inScale }] }]}>
              {!!SuccessIcon && <SuccessIcon size={20} color={tokens.foreground} strokeWidth={2.8} />}
              {!!successTitle && <Text style={textStyle}>{titleCase(successTitle)}</Text>}
            </Animated.View>
          </View>
        ) : (
          <View style={styles.center}>{label}</View>
        )}
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: Radii.button.default },
  face: {
    borderRadius: Radii.button.default,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  // Sizes. md matches a chip (36); lg is the old full-height button (48).
  faceMd: { minHeight: 36, paddingVertical: Space[6], paddingHorizontal: Space[16] },
  faceLg: { minHeight: CONTROL, paddingVertical: Space[10], paddingHorizontal: Space[24] },
  outline: { borderWidth: 2 },
  ghost: { backgroundColor: 'transparent', paddingHorizontal: Space[12] },
  ghostMd: { paddingHorizontal: Space[8] },
  center: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Space[8] },
  text: { fontFamily: FontFamilies.demi, letterSpacing: 0.2 },
  textMd: { fontSize: fs(15), lineHeight: lh(20) },
  textLg: { fontSize: fs(16), lineHeight: lh(22) },
});
