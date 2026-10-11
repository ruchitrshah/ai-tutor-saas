// Uploads (the first tab): the student drops in anything (files, a whole folder, notes,
// slides, a PDF, a photo, a recording, a link, pasted text), the tutor "builds" a course
// while a short preparing screen plays, and they land in a quiz.
//
// Prototype: nothing is uploaded or read. The preparing screen is real UI on a timer, and
// the quiz it ends in is a fixed set of study-skills questions named after the file. A
// real build would send the file to the course-generation service here.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, FontFamilies, Motion, Radii, Space, useReducedMotion } from '../brand';
import Button from '../components/Button';
import Input from '../components/Input';
import ProgressBar from '../components/ProgressBar';
import { q } from '../data/courses';
import { usePortal } from '../store/portal';
import { PAGE_TITLE, SUB, TITLE } from '../theme/type';
import { X } from '../ui/icons';
import Mascot from '../ui/Mascot';
import Reveal from '../ui/Reveal';
import Shell from '../ui/Shell';
import UploadsRail from '../ui/UploadsRail';
import { fs, lh } from '../theme/fluid';

const STEPS = ['Reading your material', 'Finding the key ideas', 'Writing your questions', 'Getting your tutor ready'];
const STEP_MS = 1500;

const sizeOf = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const baseName = (s) => (s || 'Your material').replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Your material';

// A course made from the material. Fixed questions for the prototype, named after the file.
function courseFrom(name) {
  const title = baseName(name);
  return {
    id: 'custom',
    kind: 'practice',
    title: `Your course: ${title}`,
    sub: '3 questions',
    items: [
      q('Before you read a new document, what helps most?', ['Skim the headings and the summary first', 'Read only the last page', 'Memorise every word', 'Skip the examples'], 0, 'Reading strategy'),
      q('You finish a section. What is the best next step?', ['Move straight on', 'Say the main point in your own words', 'Highlight every line', 'Read it three more times'], 1, 'Reading strategy'),
      q('Which question best checks that you understood an idea?', ['Can I copy it out?', 'Can I explain it to a friend?', 'Is it in bold?', 'Is it on the first page?'], 1, 'Reading strategy'),
    ],
  };
}

export default function Material() {
  const { go } = usePortal();
  const [phase, setPhase] = useState('pick'); // pick | prep
  const [file, setFile] = useState(null); // { name, size }
  const [text, setText] = useState('');
  const [target, setTarget] = useState(null); // an earlier upload picked from the list
  const ready = !!file || text.trim().length > 3;
  const label = file ? file.name : text.trim().slice(0, 40);

  const header = (
    <View style={styles.header}>
      <Text style={PAGE_TITLE}>Uploads</Text>
      <Text style={SUB}>Bring your own material.</Text>
    </View>
  );

  if (phase === 'prep') {
    return (
      <Shell active="uploads" autoCollapse>
        <Preparing
          onCancel={() => { setTarget(null); setPhase('pick'); }}
          onDone={() => go('task', { custom: courseFrom(target || label), from: 'uploads' })}
        />
      </Shell>
    );
  }

  return (
    <Shell active="uploads" rail={<UploadsRail onStart={(name) => { setTarget(name); setPhase('prep'); }} />} railFill header={header}>
      <View style={styles.stack}>
        <Reveal delay={40}>
          <DropZone file={file} onFile={setFile} />
        </Reveal>
        <Reveal delay={100} style={styles.paste}>
          <Input
            label="Or paste a link or text"
            value={text}
            onChangeText={setText}
            placeholder="https://…"
            style={styles.field}
            autoCapitalize="none"
          />
        </Reveal>
        <Reveal delay={160}>
          <Button title="Build My Course" onPress={() => { setTarget(null); setPhase('prep'); }} disabled={!ready} style={styles.build} />
        </Reveal>

      </View>
    </Shell>
  );
}

// The drop target: drag files or a whole folder onto it, or choose either. Any format is
// accepted. The tutor treats several files, or a folder, as one piece of material.
function DropZone({ file, onFile }) {
  const [over, setOver] = useState(false);
  const zone = useRef(null);
  const files = useRef(null);
  const folder = useRef(null);

  // Several files become one entry ("3 files"); a folder keeps its own name.
  const takeList = useCallback((list, dir) => {
    const arr = Array.from(list || []);
    if (!arr.length) return;
    const size = arr.reduce((n, f) => n + (f.size || 0), 0);
    if (dir) onFile({ name: (arr[0].webkitRelativePath || '').split('/')[0] || 'Your folder', size, count: arr.length, folder: true });
    else if (arr.length === 1) onFile({ name: arr[0].name, size });
    else onFile({ name: `${arr.length} files`, size, count: arr.length });
  }, [onFile]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !zone.current) return undefined;
    const el = zone.current;
    const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
    const enter = (e) => { stop(e); setOver(true); };
    const leave = (e) => { stop(e); setOver(false); };
    const drop = (e) => {
      stop(e); setOver(false);
      const dt = e.dataTransfer;
      if (!dt) return;
      // A dropped folder shows up as a directory entry; its files are not read here.
      const entry = dt.items && dt.items[0] && dt.items[0].webkitGetAsEntry && dt.items[0].webkitGetAsEntry();
      if (entry && entry.isDirectory) onFile({ name: entry.name, size: 0, folder: true });
      else takeList(dt.files, false);
    };
    el.addEventListener('dragenter', enter);
    el.addEventListener('dragover', enter);
    el.addEventListener('dragleave', leave);
    el.addEventListener('drop', drop);
    return () => {
      el.removeEventListener('dragenter', enter);
      el.removeEventListener('dragover', enter);
      el.removeEventListener('dragleave', leave);
      el.removeEventListener('drop', drop);
    };
  }, [takeList, onFile]);

  // The folder picker needs a non-standard attribute that React does not pass through.
  useEffect(() => {
    if (Platform.OS === 'web' && folder.current) { folder.current.setAttribute('webkitdirectory', ''); folder.current.setAttribute('directory', ''); }
  }, []);

  const pick = (ref) => () => { if (Platform.OS === 'web') ref.current && ref.current.click(); };
  const detail = file && (file.folder ? `Folder${file.count ? ` · ${file.count} files` : ''}` : `${file.count ? `${file.count} files · ` : ''}${sizeOf(file.size)}`);

  return (
    <View ref={zone} style={[styles.zone, over && styles.zoneOver]}>
      {Platform.OS === 'web' && (
        <>
          <input ref={files} type="file" multiple style={{ display: 'none' }} onChange={(e) => { takeList(e.target.files, false); e.target.value = ''; }} />
          <input ref={folder} type="file" multiple style={{ display: 'none' }} onChange={(e) => { takeList(e.target.files, true); e.target.value = ''; }} />
        </>
      )}
      {file ? (
        <View style={styles.fileRow}>
          <View style={styles.fileText}>
            <Text style={styles.fileName} numberOfLines={2}>{file.name}</Text>
            <Text style={SUB}>{detail} · ready to use</Text>
          </View>
          <Pressable onPress={() => onFile(null)} accessibilityRole="button" accessibilityLabel={`Remove ${file.name}`} style={({ hovered }) => [styles.remove, hovered && { backgroundColor: Colors.surface.raised }]}>
            <X size={20} color={Colors.icon.secondary} strokeWidth={2.4} />
          </Pressable>
        </View>
      ) : (
        <>
          <Mascot head size={96} />
          <Text style={[TITLE, styles.center]}>Turn your material into practice</Text>
          <Text style={[SUB, styles.center]}>Drop in files or a folder. Any format works.</Text>
          <View style={styles.chooseRow}>
            <Button title="Choose Files" variant="outline" onPress={pick(files)} style={styles.choose} />
            <Button title="Choose A Folder" variant="outline" onPress={pick(folder)} style={styles.choose} />
          </View>
        </>
      )}
    </View>
  );
}

// "Building your course", kept to the least that still feels alive: the tutor thinking,
// one line at a time (the old one lifts away, the next rises in), and one bar filling.
// About six seconds, then a cheer and the quiz. Cancel stays quietly underneath.
function Preparing({ onCancel, onDone }) {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0); // lines finished
  const [gesture, setGesture] = useState(null);
  const finished = step >= STEPS.length;

  useEffect(() => {
    if (finished) return undefined;
    const t = setTimeout(() => setStep((n) => n + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [step, finished]);

  useEffect(() => {
    if (!finished) return undefined;
    setGesture({ name: 'cheer', id: 1 });
    const t = setTimeout(onDone, reduced ? 600 : 1400);
    return () => clearTimeout(t);
  }, [finished, onDone, reduced]);

  const line = finished ? 'Your course is ready' : STEPS[step];
  return (
    <View style={styles.prep}>
      <Reveal y={6} scaleFrom={0.9} duration={320}>
        <Mascot head live size={140} mood={finished ? 'idle' : 'think'} gesture={gesture} />
      </Reveal>
      <OneLine text={line} />
      <View style={styles.bar} accessibilityLabel="Building your course" accessibilityRole="progressbar">
        <ProgressBar currentStep={finished ? 1 : (step + 0.6) / STEPS.length} totalSteps={1} height={12} fillColor={Colors.brand.primary} />
      </View>
      <View style={styles.cancelSlot}>{!finished && <Button title="Cancel" variant="ghost" onPress={onCancel} />}</View>
    </View>
  );
}

// One line of copy at a time. A change lifts the old line away (140ms) and brings the new
// one up from below (240ms), both ease-out. Announced politely for screen readers.
function OneLine({ text }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(text);
  const v = useRef(new Animated.Value(1)).current;
  const y = useRef(new Animated.Value(0)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    if (reduced) { setShown(text); return undefined; }
    const native = Platform.OS !== 'web';
    let alive = true;
    Animated.parallel([
      Animated.timing(v, { toValue: 0, duration: 140, easing: Motion.ease.out, useNativeDriver: native }),
      Animated.timing(y, { toValue: -8, duration: 140, easing: Motion.ease.out, useNativeDriver: native }),
    ]).start(() => {
      if (!alive) return;
      setShown(text);
      y.setValue(8);
      Animated.parallel([
        Animated.timing(v, { toValue: 1, duration: 240, easing: Motion.ease.out, useNativeDriver: native }),
        Animated.timing(y, { toValue: 0, duration: 240, easing: Motion.ease.out, useNativeDriver: native }),
      ]).start();
    });
    const guard = setTimeout(() => { if (alive) { setShown(text); v.setValue(1); y.setValue(0); } }, 700);
    return () => { alive = false; clearTimeout(guard); };
  }, [text, reduced, v, y]);
  return (
    <Animated.Text accessibilityLiveRegion="polite" style={[styles.line, { opacity: v, transform: reduced ? [] : [{ translateY: y }] }]}>
      {shown}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  header: { gap: Space[4], alignSelf: 'stretch' },
  stack: { gap: Space[20] },
  center: { textAlign: 'center' },
  zone: { alignItems: 'center', gap: Space[12], padding: Space[32], borderRadius: Radii.dialog, borderWidth: 2, borderColor: Colors.border.control, backgroundColor: Colors.surface.card, ...Platform.select({ web: { borderStyle: 'dashed', transitionProperty: 'border-color, background-color', transitionDuration: '160ms' } }) },
  zoneOver: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.soft },
  chooseRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Space[12], marginTop: Space[8], alignSelf: 'stretch' },
  choose: { minWidth: 180 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: Space[16], alignSelf: 'stretch' },
  fileText: { flex: 1, minWidth: 0, gap: Space[2] },
  fileName: { fontFamily: FontFamilies.demi, fontSize: fs(18), lineHeight: lh(26), color: Colors.text.primary },
  remove: { width: 48, height: 48, borderRadius: Radii.control.md, alignItems: 'center', justifyContent: 'center' },
  paste: { alignSelf: 'stretch' },
  field: { marginTop: 0, marginBottom: 0 },
  build: { alignSelf: 'stretch' },


  prep: { alignItems: 'center', gap: Space[24], paddingTop: Space[96] },
  line: { fontFamily: FontFamilies.demi, fontSize: fs(24), lineHeight: lh(32), letterSpacing: -0.2, color: Colors.text.primary, textAlign: 'center', minHeight: 32 },
  bar: { alignSelf: 'center', width: '100%', maxWidth: 360 },
  cancelSlot: { height: 48, marginTop: Space[8] },
});
