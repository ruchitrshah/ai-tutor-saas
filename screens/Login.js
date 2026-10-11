// The front door. In production the student arrives from Moodle through an LTI launch,
// already signed in with the course passed through; this page stands in for that handoff.
//
// Two halves: a big cactus on the left, anchored to the bottom edge, waving and cheering every
// few seconds; the welcome, the two fields and Login on the right. On a phone the cactus
// becomes a short banner above the form.
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Colors, FontFamilies, Space, useReducedMotion } from '../brand';
import Button from '../components/Button';
import Input from '../components/Input';
import { fs, lh } from '../theme/fluid';
import { usePortal } from '../store/portal';
import Mascot from '../ui/Mascot';
import Reveal from '../ui/Reveal';

const GESTURES = ['wave', 'cheer'];

export default function Login() {
  const { signIn } = usePortal();
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const split = width >= 900;
  // Prototype: sign-in is simulated, so any details work. They start filled in.
  const [email, setEmail] = useState('aarav.mehta@amity.edu');
  const [password, setPassword] = useState('prototype');
  const [error, setError] = useState('');
  const [beat, setBeat] = useState(1);

  // The cactus greets you on arrival, then again every few seconds.
  useEffect(() => {
    if (reduced) return undefined;
    const t = setInterval(() => setBeat((b) => b + 1), 5200);
    return () => clearInterval(t);
  }, [reduced]);

  const submit = () => {
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    setError('');
    signIn();
  };

  const size = split ? Math.min(560, Math.max(320, width * 0.36), height * 0.8) : Math.min(260, width * 0.6);

  return (
    <View style={[styles.page, split && styles.pageSplit]}>
      <View style={[styles.art, split ? styles.artSplit : styles.artStack, { backgroundColor: Colors.accent.blue.soft }]}>
        <Mascot head live kind="cactus" size={size} gesture={{ name: GESTURES[beat % 2], id: beat }} />
      </View>

      <ScrollView style={styles.formSide} contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Reveal delay={60} y={8}>
            <Text style={styles.eyebrow}>AI Tutor</Text>
          </Reveal>
          <Reveal delay={110} y={12}>
            <Text style={styles.hero}>Stuck? Let's work it out together.</Text>
          </Reveal>

          <Reveal delay={180} y={10} style={styles.fields}>
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
          </Reveal>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.surface.page },
  pageSplit: { flexDirection: 'row' },

  // The cactus's panel. The character sits on the bottom edge and is cropped by it.
  art: { alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  artSplit: { flex: 1 },
  artStack: { height: 230 },

  formSide: { flex: 1 },
  formScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Space[24], paddingVertical: Space[40] },
  form: { width: '100%', maxWidth: 420, gap: Space[16] },
  eyebrow: { fontFamily: FontFamilies.demi, fontSize: fs(15), lineHeight: lh(20), letterSpacing: 1.4, textTransform: 'uppercase', color: Colors.text.secondary },
  hero: { fontFamily: FontFamilies.heavy, fontSize: fs(34), lineHeight: lh(40), letterSpacing: -0.6, color: Colors.text.primary },
  fields: { gap: Space[16], marginTop: Space[8] },
  field: { marginTop: 0, marginBottom: 0 },
  btn: { alignSelf: 'stretch' },
});
