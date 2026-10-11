// An icon, standing on its own: no box, no tint. Colour is the brand blue by
// default; `accent="orange"|"yellow"` resolves to the secondary amber.
// (`size` is the old tile size; the glyph is drawn at about half of it.)
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../brand';

export default function Tile({ Icon, accent = 'blue', size = 44, solid = false, muted = false, style }) {
  const a = Colors.accent[accent] || Colors.accent.blue;
  const glyph = Math.max(20, Math.round(size * 0.55));
  const color = muted ? Colors.icon.muted : solid ? Colors.brand.primary : a.solid;
  return (
    <View style={[styles.box, { width: glyph + 4, height: glyph + 4 }, style]}>
      <Icon size={glyph} strokeWidth={2} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({ box: { alignItems: 'center', justifyContent: 'center' } });
