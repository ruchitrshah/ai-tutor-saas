// Your grades, in a sheet over the page you were on: the profile's banner and stat tiles on
// top, then each course as a bar with what has been graded so far. Only some work is marked
// yet, so a course with nothing graded says so instead of showing zero.
import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Colors, FontFamilies, Radii, Space } from '../brand';
import ProgressBar from '../components/ProgressBar';
import { SUBJECTS } from '../data/courses';
import { TITLE } from '../theme/type';
import { SUBJECT_STYLE } from '../ui/kinds';
import Sheet from '../ui/Sheet';
import { fs, lh } from '../theme/fluid';

// Weighted score over what has been graded so far, or null if nothing has.
function courseScore(s) {
  const graded = s.grading.filter((g) => g.score != null);
  const w = graded.reduce((n, g) => n + g.weight, 0);
  return w ? Math.round(graded.reduce((n, g) => n + g.score * g.weight, 0) / w) : null;
}

export default function GradesSheet({ open, onClose }) {
  const phone = useWindowDimensions().width < 640;
  const scores = SUBJECTS.map(courseScore).filter((x) => x != null);
  const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const all = SUBJECTS.flatMap((s) => s.grading);
  const graded = all.filter((g) => g.score != null).length;

  return (
    <Sheet open={open} onClose={onClose} title="Your grades" width={640} tall>
      <View style={styles.stack}>
        <View style={[styles.tiles, phone && { gap: Space[8] }]}>
          <Tile phone={phone} n={average == null ? '–' : `${average}%`} label="Average so far" />
          <Tile phone={phone} n={graded} label="Graded" />
          <Tile phone={phone} n={all.length - graded} label="Still to come" />
        </View>

        {SUBJECTS.map((s) => {
          const score = courseScore(s);
          const accent = Colors.accent[SUBJECT_STYLE[s.id]?.accent || 'blue'];
          return (
                          <View key={s.id} style={[styles.course, phone && { padding: Space[16] }]}>
                <View style={styles.courseTop}>
                  <Text style={TITLE} numberOfLines={1}>{s.name}</Text>
                  <Text style={styles.score}>{score == null ? 'Not graded yet' : `${score}%`}</Text>
                </View>
                <ProgressBar currentStep={score == null ? 0 : score / 100} totalSteps={1} sparkle={false} height={8} fillColor={Colors.brand.primary} />
                <View style={styles.rows}>
                  {s.grading.map((g) => (
                    <View key={g.label} style={styles.row}>
                      <Text style={styles.rowLabel} numberOfLines={1}>{g.label}</Text>
                      <Text style={styles.rowWeight}>{g.weight}%</Text>
                      <Text style={[styles.rowScore, g.score == null && { color: Colors.text.muted }]}>{g.score == null ? 'Pending' : g.score}</Text>
                    </View>
                  ))}
                </View>
              </View>
              );
        })}
      </View>
    </Sheet>
  );
}

function Tile({ n, label, phone }) {
  return (
    <View style={[styles.tile, phone && { padding: Space[12] }]}>
      <Text style={[styles.tileN, phone && { fontSize: fs(22), lineHeight: lh(28) }]}>{n}</Text>
      <Text style={styles.tileL}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Space[24] },
  tiles: { flexDirection: 'row', gap: Space[12] },
  tile: { flex: 1, minWidth: 0, gap: 2, padding: Space[16], borderRadius: Radii.card.default, backgroundColor: Colors.surface.raised },
  tileN: { fontFamily: FontFamilies.heavy, fontSize: fs(26), lineHeight: lh(32), color: Colors.text.primary },
  tileL: { fontFamily: FontFamilies.medium, fontSize: fs(15), color: Colors.text.secondary },
  course: { gap: Space[12], padding: Space[24], borderRadius: Radii.card.lg, borderWidth: 2, borderColor: Colors.border.subtle, backgroundColor: Colors.surface.card },
  courseTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: Space[12] },
  score: { fontFamily: FontFamilies.medium, fontSize: fs(16), color: Colors.text.secondary },
  rows: { gap: Space[8], marginTop: Space[4] },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space[12], minHeight: 28 },
  rowLabel: { flex: 1, minWidth: 0, fontFamily: FontFamilies.medium, fontSize: fs(15), color: Colors.text.primary },
  rowWeight: { width: 52, textAlign: 'right', fontFamily: FontFamilies.medium, fontSize: fs(15), color: Colors.text.muted },
  rowScore: { width: 64, textAlign: 'right', fontFamily: FontFamilies.demi, fontSize: fs(15), color: Colors.text.primary },
});
