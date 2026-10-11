// "Learn more" for a page: an underlined text link that sits at the end of the page's
// subtitle (same weight as the subtitle), and the sheet it opens, which explains in three
// short points, each with its own character, what the page is and how it fits the rest.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, FontFamilies, Space } from '../brand';
import { SUB, TITLE } from '../theme/type';
import Mascot from './Mascot';
import Sheet from './Sheet';

export function LearnLink({ onPress, label = 'Learn more' }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={`${label} about this page`} style={styles.linkBtn}>
      {({ hovered }) => <Text style={[styles.link, hovered && styles.linkHover]}>{label}</Text>}
    </Pressable>
  );
}

// The subtitle and the link, on one line when they fit and wrapping below when they do not.
export function SubWithLink({ children, onPress }) {
  return (
    <View style={styles.sub}>
      <Text style={SUB}>{children}</Text>
      <LearnLink onPress={onPress} />
    </View>
  );
}

export default function Explainer({ open, onClose, title, points }) {
  return (
    <Sheet open={open} onClose={onClose} title={title} width={560}>
      {points.map((p) => (
        <View key={p.title} style={styles.point}>
          <View style={styles.face}><Mascot head kind={p.mascot} size={64} /></View>
          <View style={styles.pointText}>
            <Text style={TITLE}>{p.title}</Text>
            <Text style={SUB}>{p.body}</Text>
          </View>
        </View>
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sub: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: Space[8] },
  linkBtn: { minHeight: 32, justifyContent: 'center' },
  // Same family and size as the subtitle it sits in: only the colour and underline set it apart.
  link: { ...SUB, color: Colors.text.link, textDecorationLine: 'underline' },
  linkHover: { color: Colors.text.accent, textDecorationLine: 'none' },
  point: { flexDirection: 'row', alignItems: 'center', gap: Space[16] },
  face: { width: 72, height: 72, borderRadius: 20, backgroundColor: Colors.surface.raised, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  pointText: { flex: 1, minWidth: 0, gap: Space[4] },
});
