// "Due today" / "Due tomorrow" / "Due on October 11th". Colour comes with a word,
// never alone: red for today or overdue, amber for tomorrow, plain text beyond.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamilies, Radii, Space } from '../brand';
import { SUB } from '../theme/type';
import { dueInfo } from './due';
import { fs } from '../theme/fluid';

export default function DueTag({ subject, style }) {
  const { tone, label } = dueInfo(subject);
  if (tone === 'later') return <Text style={[SUB, style]}>{label}</Text>;
  const urgent = tone === 'today' || tone === 'overdue';
  return (
    <View style={[styles.pill, { backgroundColor: urgent ? Colors.status.dangerSoft : Colors.status.warningSoft }, style]}>
      <Text style={[styles.text, { color: urgent ? Colors.status.danger : Colors.status.warningText }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: Space[14], height: 36, borderRadius: Radii.control.sm, justifyContent: 'center' },
  text: { fontFamily: FontFamilies.demi, fontSize: fs(15) },
});
