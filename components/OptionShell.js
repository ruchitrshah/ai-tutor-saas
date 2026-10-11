// src/components/OptionShell.js
//
// The answer tile that carries most of Rilla's onboarding ("I want my team to
// earn more", "5 min / day · Regular"). CheckboxRow and RadioRow both render
// through this so the two can never drift: same height, same hover, same
// selected treatment.
//
// Duolingo's tile, in Rilla's colours: a 2px border standing on a 4px lip, bold
// label, no radio or checkbox glyph — the whole tile *is* the control, and
// being chosen tints it. Multi-select tiles add a small check on the right so
// "I can pick more than one" reads without instructions.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from '../ui/icons';

import { Colors, ComponentTokens, FontFamilies, Motion, Radii, Space, Type, useReducedMotion } from '../brand';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const T = ComponentTokens.option;
const LIP = 2;

export default function OptionShell({
  selected,
  result, // 'correct' | 'wrong': shown with an icon and a word elsewhere, never colour alone
  onPress,
  disabled,
  label,
  description,
  trailing, // right-aligned tag: "Regular"
  icon: Icon,
  lead, // a ready-made leading element that stays mounted across states (e.g. the A–D badge)
  art, // a larger leading element (illustration) for hero choices
  multi = false,
  role,
  style,
  compact = false,
  align = 'left',
  hug = false, // size to the label instead of filling the row
}) {
  const [hovered, setHovered] = useState(false);
  const reduced = useReducedMotion();
  const press = useRef(new Animated.Value(0)).current;

  const animate = (to) => {
    if (reduced || disabled) return;
    Animated.timing(press, {
      toValue: to,
      duration: to ? Motion.duration.pressIn : Motion.duration.pressOut,
      easing: Motion.ease.out,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  // A tile on a lip presses *down* into it, like the buttons. Travel, not
  // squash: 2px is enough to read as pressed on something this wide.
  const sink = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.98] });

  const tone = result ? T[result] : selected ? T.selected : T.default;
  const fg = result ? (result === 'correct' ? Colors.status.successText : Colors.status.danger) : selected ? Colors.text.accent : T.default.foreground;

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={() => animate(1)}
      onPressOut={() => animate(0)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      disabled={disabled}
      accessibilityRole={role}
      aria-checked={role === 'radio' || role === 'checkbox' ? !!selected || result === 'correct' : undefined}
      accessibilityLabel={`${label}${result === 'correct' ? ', correct' : result === 'wrong' ? ', not this one' : ''}`}
      accessibilityState={{ checked: !!selected, selected: !!selected, disabled: !!disabled && !result }}
      style={[
        styles.row,
        compact && styles.compact,
        hug && styles.hug,
        art && styles.withArt,
        {
          // Illustrations are composited on the page colour, so a tile carrying
          // one keeps that face in every state and speaks through its border.
          backgroundColor: art
            ? T.default.background
            : selected
              ? tone.background
              : hovered && !disabled
                ? T.hover.background
                : T.default.background,
          borderColor: tone.border,
          borderBottomColor: tone.border,
          ...(art && hovered && !selected && !disabled
            ? { borderColor: Colors.border.default, borderBottomColor: Colors.border.default }
            : null),
        },
        disabled && !result && styles.disabled,
        style,
        { transform: [{ scale: sink }] },
      ]}
    >
      {art ? <View style={styles.art}>{art}</View> : null}
      {lead || null}
      {Icon ? <Icon size={24} color={selected ? fg : Colors.icon.secondary} strokeWidth={1.9} /> : null}
      <View style={[styles.textCol, hug && styles.textHug, align === 'center' && styles.center]}>
        <Text style={[selected && !result ? Type.optionSelected : Type.option, art && styles.artLabel]}>
          {label}
        </Text>
        {description ? (
          <Text style={[styles.description, selected && styles.descriptionOn]}>{description}</Text>
        ) : null}
      </View>
      {trailing ? <Text style={[styles.trailing, (selected || result) && { color: fg }, result && { fontFamily: FontFamilies.demi }]}>{trailing}</Text> : null}
      {multi ? <Tick on={!!selected} /> : null}
    </AnimatedPressable>
  );
}

function Tick({ on }) {
  const pop = usePop(on);
  return (
    <View style={[styles.tick, on ? styles.tickOn : styles.tickOff]}>
      <Animated.View style={pop}>
        <Check size={13} color={Colors.brand.onPrimary} strokeWidth={3.4} />
      </Animated.View>
    </View>
  );
}

// A glyph that pops in when its row is chosen. Starts at 0.6, never 0.
export function usePop(active) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(active ? 1 : 0)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduced) {
      v.setValue(active ? 1 : 0);
      return;
    }
    Animated.spring(v, {
      toValue: active ? 1 : 0,
      ...Motion.spring.pop,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [active, reduced, v]);
  return {
    opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
  };
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[16],
    minHeight: 56,
    paddingHorizontal: Space[16],
    paddingVertical: Space[12],
    borderRadius: Radii.option,
    borderWidth: 2,
    borderBottomWidth: LIP,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        userSelect: 'none',
        transitionProperty: 'background-color, border-color',
        transitionDuration: '180ms',
        transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
    }),
  },
  compact: { minHeight: 60, paddingVertical: Space[12] },
  withArt: { minHeight: 132, paddingVertical: Space[20], gap: Space[20] },
  art: { width: 96, alignItems: 'center', justifyContent: 'center' },
  artLabel: { fontSize: 17, lineHeight: 24 },
  disabled: { opacity: 0.5 },
  // minWidth 0 lets a long answer wrap onto as many lines as it needs instead of
  // pushing past the tile or being cut off.
  textCol: { flex: 1, minWidth: 0, gap: 2 },
  center: { alignItems: 'center' },
  // Sized to the label: a compact pill that wraps only when it must.
  hug: { alignSelf: 'flex-start', maxWidth: '100%', minHeight: 48, paddingVertical: Space[8], paddingHorizontal: Space[18], gap: Space[10] },
  textHug: { flexGrow: 0, flexShrink: 1, flexBasis: 'auto' },
  description: { ...Type.bodyTertiary, fontSize: 15, lineHeight: 22 },
  descriptionOn: { color: Colors.text.secondary },
  trailing: { ...Type.bodyTertiary, fontSize: 15, flexShrink: 0 },
  tick: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  tickOn: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary },
  tickOff: { backgroundColor: 'transparent', borderColor: Colors.border.subtle },
});
