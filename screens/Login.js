// The front door. In production the student arrives from Moodle through an LTI launch,
// already signed in with the course passed through; this page stands in for that handoff.
//
// Two halves. Left: a rounded blue panel carrying the product line, big, with a few short
// proof points under it and soft rings behind. Right: the sign-in card ("Student Login", the
// two fields, Login). On a phone the panel becomes a banner above the card.
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, FontFamilies, Space } from '../brand';
import Button from '../components/Button';
import Input from '../components/Input';
import { fs, lh } from '../theme/fluid';
import { usePortal } from '../store/portal';
import Reveal from '../ui/Reveal';

// Dummy copy for now.
const POINTS = [
  'Hints that guide you, never the answer',
  'Practice and timed exams for every subject',
  'Your mistakes saved, ready to revise',
];

export default function Login() {
  const { signIn } = usePortal();
  const { width } = useWindowDimensions();
  const split = width >= 900;
  // Prototype: sign-in is simulated, so any details work. They start filled in.
  const [email, setEmail] = useState('aarav.mehta@amity.edu');
  const [password, setPassword] = useState('prototype');
  const [error, setError] = useState('');

  const submit = () => {
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    setError('');
    signIn();
  };

  const blue = Colors.accent.blue;
  const ring = (n) => ({ width: n, height: n, borderRadius: n / 2, right: -n * 0.28, bottom: -n * 0.28 });

  return (
    <View style={[styles.page, split && styles.pageSplit]}>
      <LinearGradient
        colors={[blue.soft, `${blue.solid}55`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.panel, split ? styles.panelSplit : styles.panelStack]}
      >
        {/* Soft rings behind the copy: depth without an image. */}
        <View pointerEvents="none" style={[styles.ring, ring(split ? 620 : 300), { borderColor: blue.line }]} />
        <View pointerEvents="none" style={[styles.ring, ring(split ? 420 : 200), { borderColor: blue.line }]} />
        <View pointerEvents="none" style={[styles.ring, ring(split ? 220 : 100), { borderColor: blue.line, backgroundColor: blue.soft }]} />

        <Reveal delay={40} y={8}>
          <Text style={styles.brand}>AI Tutor</Text>
        </Reveal>

        <View style={[styles.copy, split && styles.copySplit]}>
          <Reveal delay={100} y={14} duration={320}>
            <Text style={[styles.hero, !split && styles.heroStack]}>Stuck? Let's work it out together.</Text>
          </Reveal>
          {split ? (
            <View style={styles.points}>
              {POINTS.map((p, i) => (
                <Reveal key={p} delay={200 + i * 60} y={8}>
                  <View style={styles.point}>
                    <View style={[styles.dot, { backgroundColor: blue.solid }]} />
                    <Text style={styles.pointText}>{p}</Text>
                  </View>
                </Reveal>
              ))}
            </View>
          ) : null}
        </View>
      </LinearGradient>

      <ScrollView style={styles.formSide} contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Reveal delay={140} y={12} duration={300} style={styles.card}>
          <Text style={styles.formTitle}>Student Login</Text>
          <Text style={styles.formSub}>Sign in with your university email.</Text>
          <View style={styles.fields}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@amity.edu"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.field}
              onSubmitEditing={submit}
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry
              autoComplete="current-password"
              error={error}
              style={styles.field}
              onSubmitEditing={submit}
            />
            <Button title="Login" onPress={submit} style={styles.btn} />
          </View>
        </Reveal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.surface.page },
  pageSplit: { flexDirection: 'row', padding: Space[16], gap: Space[16] },

  // The left panel: a rounded blue card, content spread top to bottom.
  panel: { overflow: 'hidden', justifyContent: 'space-between' },
  panelSplit: { flex: 1.15, borderRadius: 17, padding: Space[40] },
  panelStack: { paddingHorizontal: Space[24], paddingVertical: Space[32], gap: Space[24] },
  ring: { position: 'absolute', borderWidth: 1.5 },
  brand: { fontFamily: FontFamilies.demi, fontSize: fs(20), lineHeight: lh(26), letterSpacing: -0.2, color: Colors.text.primary },
  copy: { gap: Space[32] },
  copySplit: { maxWidth: 640, paddingBottom: Space[48] },
  hero: { fontFamily: FontFamilies.heavy, fontSize: fs(60), lineHeight: lh(64), letterSpacing: -1.6, color: Colors.text.primary },
  heroStack: { fontSize: fs(34), lineHeight: lh(40), letterSpacing: -0.8 },
  points: { gap: Space[12] },
  point: { flexDirection: 'row', alignItems: 'center', gap: Space[12] },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pointText: { fontFamily: FontFamilies.regular, fontSize: fs(18), lineHeight: lh(26), color: Colors.text.secondary },

  formSide: { flex: 1 },
  formScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Space[24], paddingVertical: Space[40] },
  card: {
    width: '100%',
    maxWidth: 460,
    padding: Space[32],
    gap: Space[8],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.surface.card,
  },
  formTitle: { fontFamily: FontFamilies.heavy, fontSize: fs(30), lineHeight: lh(36), letterSpacing: -0.5, color: Colors.text.primary },
  formSub: { fontFamily: FontFamilies.regular, fontSize: fs(16), lineHeight: lh(24), color: Colors.text.secondary },
  fields: { gap: Space[16], marginTop: Space[16] },
  field: { marginTop: 0, marginBottom: 0 },
  btn: { alignSelf: 'stretch' },
});
