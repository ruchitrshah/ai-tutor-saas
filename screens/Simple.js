// Low-fidelity placeholders for nav items that are not designed yet, plus the
// Profile screen, which holds the light / dark switch.
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Colors, FontFamilies, Radii, Space, THEME, setTheme } from '../brand';
import Button from '../components/Button';
import { USER, usePortal } from '../store/portal';
import { SUB, TITLE } from '../theme/type';
import Dropdown from '../ui/Dropdown';
import GradesSheet from '../ui/GradesSheet';
import Reveal from '../ui/Reveal';
import Shell, { Panel } from '../ui/Shell';
import { fs, lh } from '../theme/fluid';

function Stub({ active, title, sub, children }) {
  return (
    <Shell active={active}>
      <Panel title={title}>
        <Text style={SUB}>{sub}</Text>
        {children}
      </Panel>
    </Shell>
  );
}

export function Profile() {
  const { signOut, done, stats } = usePortal();
  const doneCount = Object.keys(done || {}).filter((k) => done[k]).length;
  // "MBA Semester 1" reads better as two small tags.
  const m = /^(.*?)\s+(Semester\s+\d+)$/i.exec(USER.program || '');
  const programme = m ? [m[1], m[2]] : [USER.program].filter(Boolean);
  const [grades, setGrades] = useState(false);
  const initials = (USER.name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  return (
    <Shell active="profile">
      <View style={styles.stack}>
        <Reveal delay={40}>
          <View style={styles.banner}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
            <View style={styles.identity}>
              <Text style={styles.name}>{USER.name}</Text>
              <Text style={styles.email}>{USER.email}</Text>
              <View style={styles.chips}>
                {programme.map((c) => <View key={c} style={styles.chip}><Text style={styles.chipText}>{c}</Text></View>)}
              </View>
            </View>
            <View style={styles.stats}>
              <Stat n={doneCount} label="Tasks done" />
              <Stat n={stats.answered} label="Questions" />
              <Stat n={stats.breakthroughs} label="Breakthroughs" />
            </View>
            <Button title="See Your Grades" variant="outline" onPress={() => setGrades(true)} style={styles.gradesBtn} />
          </View>
        </Reveal>

        <Reveal delay={120}>
          <Panel title="Appearance">
            <View style={styles.themeRow}>
              <Text style={[SUB, { flex: 1 }]}>Choose light or dark.</Text>
              <Dropdown
                label="Theme"
                value={THEME}
                options={[
                  { key: 'light', label: 'Light', hint: 'Soft white, bright accents' },
                  { key: 'dark', label: 'Dark', hint: 'Deep navy, easier at night' },
                ]}
                onChange={setTheme}
                menuWidth={280}
              />
            </View>
          </Panel>
        </Reveal>

        <Reveal delay={180}>
          <Button title="Sign Out" variant="outline" onPress={signOut} style={styles.signout} />
        </Reveal>
      </View>
      <GradesSheet open={grades} onClose={() => setGrades(false)} />
    </Shell>
  );
}

// Grades, feedback, mistakes, notes: one shared placeholder.
export function Report() {
  const { route, go } = usePortal();
  return (
    <Stub active="homework" title={route.title || 'Report'} sub="Placeholder. This view is designed after the homework flow is agreed.">
      <Button title="Back to homework" variant="outline" onPress={() => go('homework')} style={styles.signout} />
    </Stub>
  );
}

function Stat({ n, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statN}>{n}</Text>
      <Text style={styles.statL}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Space[24] },
  banner: { gap: Space[20] },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.accent.blue.soft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FontFamilies.heavy, fontSize: fs(26), lineHeight: lh(32), color: Colors.accent.blue.text },
  identity: { gap: Space[4] },
  name: { fontFamily: FontFamilies.heavy, fontSize: Platform.select({ web: 'clamp(26px, 1.2vw + 20px, 34px)', default: 28 }), lineHeight: Platform.select({ web: 'clamp(32px, 1.3vw + 24px, 40px)', default: 34 }), letterSpacing: -0.4, color: Colors.text.primary },
  email: { fontFamily: FontFamilies.medium, fontSize: fs(17), lineHeight: lh(24), color: Colors.text.secondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Space[8], marginTop: Space[12] },
  chip: { height: 34, paddingHorizontal: Space[14], justifyContent: 'center', borderRadius: 999, borderWidth: 2, borderColor: Colors.border.subtle },
  chipText: { fontFamily: FontFamilies.demi, fontSize: fs(15), color: Colors.text.primary },
  // Wraps to two rows on a phone rather than squeezing a long label (Breakthroughs) mid-word.
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Space[12] },
  gradesBtn: { alignSelf: 'stretch' },
  stat: { flexGrow: 1, flexBasis: 130, gap: 2, padding: Space[16], borderRadius: Radii.card.default, backgroundColor: Colors.surface.raised },
  statN: { fontFamily: FontFamilies.heavy, fontSize: fs(26), lineHeight: lh(32), color: Colors.text.primary },
  statL: { fontFamily: FontFamilies.medium, fontSize: fs(15), color: Colors.text.secondary },
  themeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Space[16] },
  signout: { alignSelf: 'flex-start', minWidth: 160 },
});
