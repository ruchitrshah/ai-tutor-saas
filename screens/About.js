// "Learn More": what this product is, in plain words, for a student who has just
// arrived from Moodle. Opened from the button at the bottom of the sidebar.
// Four short points, each with its own icon and colour: a line to read, not a page. Every
// body is one line of about the same length (48 to 52 characters), so the four rows match.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radii, Space } from '../brand';
import { usePortal } from '../store/portal';
import { SUB, TITLE } from '../theme/type';
import { BookOpen, Lightbulb, RotateCcw, ShieldCheck } from '../ui/icons';
import Sheet from '../ui/Sheet';

const POINTS = [
  { Icon: Lightbulb, accent: 'yellow', title: 'Learns from mistakes', body: 'It asks questions that help you find the answer.' },
  { Icon: RotateCcw, accent: 'purple', title: 'Built for revision', body: 'Your mistakes come back as short, focused practice.' },
  { Icon: BookOpen, accent: 'blue', title: 'Follows your course', body: "It answers only from your professor's material." },
  { Icon: ShieldCheck, accent: 'green', title: 'You stay in charge', body: 'It never gives answers. Your grades stay in Moodle.' },
];

export function AboutModal() {
  const { aboutOpen, closeAbout } = usePortal();
  return (
    <Sheet open={aboutOpen} onClose={closeAbout} title="What is AI Tutor?" width={560}>
      <Text style={SUB}>A tutor who sits next to you while you study.</Text>
      {POINTS.map(({ Icon, accent, title, body }) => {
        const a = Colors.accent[accent];
        return (
          <View key={title} style={styles.point}>
            <View style={[styles.icon, { backgroundColor: a.soft }]}>
              <Icon size={24} strokeWidth={2.2} color={a.solid} />
            </View>
            <View style={styles.text}>
              <Text style={TITLE}>{title}</Text>
              <Text style={SUB}>{body}</Text>
            </View>
          </View>
        );
      })}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  point: { flexDirection: 'row', gap: Space[16], alignItems: 'flex-start' },
  icon: { width: 48, height: 48, borderRadius: Radii.control.md, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0, gap: Space[2], paddingTop: 1 },
});
