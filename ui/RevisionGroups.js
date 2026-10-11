// Every mistake from homework and practice, grouped by course and week. Each card is a topic
// you missed; `onOpen` is called with the card's play params. Used by the Revisions page and
// by the "Review Your Mistakes" sheet.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Space } from '../brand';
import { REVISIONS } from '../data/revisions';
import { usePortal } from '../store/portal';
import { H2, SUB } from '../theme/type';
import GradientCard from './GradientCard';
import Reveal from './Reveal';

export default function RevisionGroups({ onOpen, stagger = true }) {
  const { examRevs } = usePortal();
  return (
    <View style={styles.stack}>
        {[...(examRevs || []), ...REVISIONS].map((g, gi) => {
          const total = g.items.reduce((n, c) => n + c.count, 0);
          return (
            <Reveal key={g.id} delay={stagger ? 50 + gi * 70 : 0}>
              <View style={styles.group}>
                <View style={styles.groupHead}>
                  <Text style={H2}>{g.course} · {g.week}</Text>
                  <Text style={SUB}>{total} mistakes to revisit</Text>
                </View>
                <View style={styles.grid}>
                  {g.items.map((c) => (
                    <GradientCard key={c.id} accent={g.accent} title={c.title} text={c.text} onPress={() => onOpen(c.play)} />
                  ))}
                </View>
              </View>
            </Reveal>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Space[40] },
  group: { gap: Space[16] },
  groupHead: { gap: Space[2] },
  grid: { gap: Space[12] },
});
