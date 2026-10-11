// A full-width card for one exercise or topic: a coloured line down the left, a title and
// a line of text. The whole card is the button: no separate "Start" button inside it.
// Hover tints its border in its own colour, a short Lottie spark plays in the corner and
// an arrow slides in at the right edge; the card never moves. Pressing shrinks it 1%.
// A card that cannot be opened yet (`glow={false}`) has a dim line and no hover.
//
// (File name kept; there is no gradient any more.)
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorUtils, Colors, Radii, Space } from '../brand';
import { SUB, TITLE } from '../theme/type';
import { ArrowRight } from './icons';
import LottieBurst from './LottieBurst';

export const ACCENTS = ['blue', 'green', 'purple', 'orange', 'yellow'];

export default function GradientCard({ accent = 'blue', glow = true, title, text, meta, extra, onPress, style }) {
  const c = Colors.accent[accent] || Colors.accent.blue;
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const on = (hover || focus) && glow;

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      accessibilityRole="button"
      accessibilityLabel={[title, text, meta].filter(Boolean).join('. ')}
      style={({ pressed }) => [
        styles.card,
        Platform.select({ web: { transitionProperty: 'border-color', transitionDuration: '180ms', transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' } }),
        on && { borderColor: ColorUtils.rgba(c.solid, 0.6) },
        pressed && { transform: [{ scale: 0.99 }] },
        style,
      ]}
    >
      <View pointerEvents="none" style={[styles.line, { backgroundColor: c.solid, opacity: glow ? 1 : 0.35 }]} />
      {glow ? <LottieBurst play={hover} colors={[c.solid, c.text, '#FFFFFF']} /> : null}
      <View style={styles.copy}>
        <Text style={TITLE}>{title}</Text>
        {/* Detail (length, count) follows the description in the same paragraph. */}
        {text || meta ? (
          <Text style={SUB}>
            {text}
            {meta ? <Text style={{ color: Colors.text.muted }}>{text ? `  ${meta}` : meta}</Text> : null}
          </Text>
        ) : null}
        {extra}
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.arrow,
          { opacity: on ? 1 : 0, transform: [{ translateX: on ? 0 : -6 }] },
          Platform.select({ web: { transitionProperty: 'opacity, transform', transitionDuration: '180ms', transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' } }),
        ]}
      >
        <ArrowRight size={22} strokeWidth={2.6} color={c.text} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    minHeight: 104,
    paddingVertical: Space[24],
    paddingLeft: Space[32],
    paddingRight: Space[56],
    backgroundColor: Colors.surface.card,
    borderWidth: 2,
    borderColor: Colors.border.subtle,
    borderRadius: Radii.card.default,
    overflow: 'hidden',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  // Inset from the corners so it is a line, not an edge of the card.
  line: { position: 'absolute', left: 14, top: 24, bottom: 24, width: 4, borderRadius: 2 },
  copy: { gap: Space[6], maxWidth: 640 },
  arrow: { position: 'absolute', right: Space[20], top: 0, bottom: 0, justifyContent: 'center' },
});
