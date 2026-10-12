// Revisions: every mistake from homework and practice, grouped by course and week. Each
// card is a topic you missed; tap it to go over it again. (Dummy data for now.)
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, FontFamilies, Space } from '../brand';
import { usePortal } from '../store/portal';
import { PAGE_TITLE } from '../theme/type';
import RevisionGroups from '../ui/RevisionGroups';
import Explainer, { SubWithLink } from '../ui/Explainer';
import Shell from '../ui/Shell';
import Rail from './Rail';
import { fs, lh } from '../theme/fluid';

// Who does what. Each point has its own character, so the three read as three people.
const POINTS = [
  { title: 'Your mistakes are saved', body: 'When you slip in homework, practice or a revision, we keep it here so you can go over it later.' },
  { title: 'Your professors see the picture', body: 'They get an overview of the mistakes you make, and of the whole class.' },
  { title: 'They add what you need', body: 'From that, they add modules for you to practise and revise, so the help fits the course.' },
];

export default function Revisions() {
  const { go } = usePortal();
  const [about, setAbout] = useState(false);

  const header = (
    <View style={styles.header}>
      <Text style={PAGE_TITLE}>Revisions</Text>
      <SubWithLink onPress={() => setAbout(true)}>Your mistakes from homework and practice, by course and week.</SubWithLink>
    </View>
  );

  return (
    <>
    <Shell active="revisions" rail={<Rail />} railFill header={header}>
      <View style={styles.stack}>
        <RevisionGroups onOpen={(play) => go('task', { ...play, from: 'revisions' })} />
      </View>
    </Shell>
      <Explainer open={about} onClose={() => setAbout(false)} title="How Revisions Work" points={POINTS} />
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: Space[4], alignSelf: 'stretch' },
  sub: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: Space[8] },
  linkBtn: { minHeight: 32, justifyContent: 'center' },
  link: { fontFamily: FontFamilies.demi, fontSize: fs(16), lineHeight: lh(24), color: Colors.text.link, textDecorationLine: 'underline' },
  linkHover: { color: Colors.text.accent, textDecorationLine: 'none' },
  point: { flexDirection: 'row', alignItems: 'center', gap: Space[16] },
  face: { width: 72, height: 72, borderRadius: 12, backgroundColor: Colors.surface.raised, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  pointText: { flex: 1, minWidth: 0, gap: Space[4] },
  stack: { gap: Space[40] },
  group: { gap: Space[16] },
  groupHead: { gap: Space[2] },
  grid: { gap: Space[12] },
});
