// The Uploads page's right column: what the student has brought in before.
//
// Each row is a coloured type icon, the name on one line, and under it what it is and how far
// along you are: "PDF · 40% complete", or the site for a link ("asana.com · 60% complete"). A play button sits at the end for the
// quick path. Pressing a row opens its
// details in a drawer that slides over the list: the full name, type, size, when it was
// uploaded, how far through its exercises you are, and the two actions. Back (or Escape)
// slides it away again.
//
// Long names: in the list a name is always one line and at most 28 characters; a longer one
// is cut in the middle so the ending (the extension) stays visible. The drawer shows the
// whole name, wrapped.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import { Colors, FontFamilies, Motion, Radii, Space, useReducedMotion } from '../brand';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import { KIND_FILTERS, UPLOADS } from '../data/uploads';
import { fs, lh } from '../theme/fluid';
import { SUB, TITLE } from '../theme/type';
import Dropdown from './Dropdown';
import Sheet from './Sheet';
import { ArrowLeft, FileText, Folder, Image, Link, ListFilter, Music, Play, Presentation, Search, X } from './icons';
import Tile from './Tile';

// One icon per kind, all in the same neutral grey: the shape says what it is, and colour is
// kept for actions and progress.
const KIND = {
  PDF: { Icon: FileText, accent: 'red', label: 'PDF' },
  Slides: { Icon: Presentation, accent: 'orange', label: 'Slides' },
  Doc: { Icon: FileText, accent: 'blue', label: 'Document' },
  Image: { Icon: Image, accent: 'green', label: 'Image' },
  Audio: { Icon: Music, accent: 'purple', label: 'Audio' },
  Folder: { Icon: Folder, accent: 'yellow', label: 'Folder' },
  Link: { Icon: Link, accent: 'blue', label: 'Link' },
};

// A link opens its address; a file opens a small preview page (the prototype does not keep
// the real file).
function view(item) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  if (item.url) { window.open(item.url, '_blank', 'noopener,noreferrer'); return; }
  const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const html = `<!doctype html><meta charset="utf-8"><title>${esc(item.name)}</title><body style="font:18px system-ui;max-width:640px;margin:15vh auto;padding:0 24px;color:#333;overflow-wrap:anywhere"><p style="color:#777;font-size:15px">${esc(item.kind)} · ${esc(item.meta)}</p><h1 style="font-size:28px">${esc(item.name)}</h1><p>This is a preview page for the prototype. The real file would open here.</p></body>`;
  window.open(URL.createObjectURL(new Blob([html], { type: 'text/html' })), '_blank', 'noopener');
}

// Long names with no spaces have to be allowed to break anywhere.
const breakAnywhere = Platform.select({ web: { overflowWrap: 'anywhere', wordBreak: 'break-word' }, default: {} });

export default function UploadsRail({ onStart }) {
  const [kind, setKind] = useState('all');
  const [open, setOpen] = useState(null); // the upload whose details are showing
  // The same icon as the rows, so the menu and the list read as one thing.
  const options = useMemo(() => KIND_FILTERS.map((f) => {
    const k = KIND[f.key];
    if (!k) return f; // "All" is plain text: no icon
    return { ...f, leading: <k.Icon size={20} strokeWidth={2.2} color={Colors.icon.secondary} /> };
  }), []);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  // The kind filter and the search work together: type narrows the list, text narrows it more.
  const items = useMemo(
    () => UPLOADS.filter((u) => (kind === 'all' || u.kind === kind) && (!q || u.name.toLowerCase().includes(q))),
    [kind, q],
  );
  const closeSearch = () => { setSearching(false); setQuery(''); };
  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <View style={styles.headRow}>
          <Text style={[TITLE, { flexShrink: 1 }]} numberOfLines={1}>Recent Uploads</Text>
          <View style={styles.tools}>
            <Pressable
              onPress={() => (searching ? closeSearch() : setSearching(true))}
              accessibilityRole="button"
              accessibilityLabel={searching ? 'Close search' : 'Search uploads'}
              accessibilityState={{ expanded: searching }}
              style={({ hovered, pressed }) => [styles.tool, searching && { backgroundColor: Colors.brand.soft }, (hovered || pressed) && !searching && { backgroundColor: Colors.surface.raised }, pressed && { transform: [{ scale: 0.95 }] }]}
            >
              <Search size={20} strokeWidth={2.4} color={searching ? Colors.text.action : Colors.icon.secondary} />
            </Pressable>
            <Dropdown label="Filter by type" value={kind} options={options} onChange={setKind} menuWidth={220} Icon={ListFilter} iconOnly tinted={kind !== 'all'} />
          </View>
        </View>
        {searching ? <SearchBar value={query} onChange={setQuery} onClose={closeSearch} /> : null}
      </View>
      <ScrollView key={kind} style={{ flex: 1 }} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? <Text style={[SUB, styles.empty]}>{q ? `No uploads match "${query.trim()}".` : 'Nothing here yet.'}</Text> : null}
        {items.map((u) => <Row key={u.id} u={u} onOpen={() => setOpen(u)} onStart={onStart} />)}
      </ScrollView>

      <Details item={open} onClose={() => setOpen(null)} onStart={(name) => { setOpen(null); onStart(name); }} />
    </View>
  );
}

// The search field. It grows out of the header (opacity and a 6px rise, 180ms, ease-out) with the
// cursor already in it. Typing filters the list at once; the X, or Escape, clears it and closes.
function SearchBar({ value, onChange, onClose }) {
  const reduced = useReducedMotion();
  const native = Platform.OS !== 'web';
  const v = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const input = useRef(null);
  useEffect(() => {
    if (!reduced) Animated.timing(v, { toValue: 1, duration: 180, easing: Motion.ease.out, useNativeDriver: native }).start();
    const t = setTimeout(() => input.current?.focus?.(), 30);
    return () => clearTimeout(t);
  }, [reduced, v, native]);
  return (
    <Animated.View style={[styles.search, { opacity: v, transform: reduced ? [] : [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] }]}>
      <Search size={20} strokeWidth={2.4} color={Colors.icon.secondary} />
      <TextInput
        ref={input}
        value={value}
        onChangeText={onChange}
        placeholder="Search uploads"
        placeholderTextColor={Colors.text.placeholder}
        accessibilityLabel="Search uploads"
        returnKeyType="search"
        autoCorrect={false}
        selectionColor={Colors.brand.primary}
        cursorColor={Colors.brand.primary}
        onKeyPress={(e) => { if (e.nativeEvent.key === 'Escape') onClose(); }}
        style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' }]}
      />
      <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Clear and close search" style={({ hovered }) => [styles.clear, hovered && { backgroundColor: Colors.surface.raised }]}>
        <X size={18} strokeWidth={2.6} color={Colors.icon.secondary} />
      </Pressable>
    </Animated.View>
  );
}

// One row. The name area and the play button are siblings, not nested (a button inside a
// button is invalid), and the row's hover tint covers both.
function Row({ u, onOpen, onStart }) {
  const [hover, setHover] = useState(false);
  const k = KIND[u.kind] || KIND.Doc;
  return (
    <View style={[styles.row, hover && { backgroundColor: Colors.surface.raised }]} onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${u.name}. ${k.label}. Show details.`}
        style={({ pressed }) => [styles.main, pressed && { opacity: 0.7 }]}
      >
        <Tile Icon={k.Icon} muted size={40} />
        <View style={styles.text}>
          <MiddleName name={u.name} keepTail={u.kind !== 'Link' && u.kind !== 'Folder'} />
          <Text style={styles.sub} numberOfLines={1}>{subtext(u, k)}</Text>
          <View style={styles.track}><View style={[styles.fill, { width: `${Math.round(u.progress * 100)}%` }]} /></View>
        </View>
      </Pressable>
      <Pressable
        onPress={() => onStart(u.name)}
        accessibilityRole="button"
        accessibilityLabel={`${u.progress > 0 ? 'Resume' : 'Start'} an activity from ${u.name}`}
        style={({ hovered, pressed }) => [styles.play, hovered && { backgroundColor: Colors.brand.softStrong }, pressed && { transform: [{ scale: 0.92 }] }]}
      >
        <Play size={20} strokeWidth={2.4} color={Colors.text.action} />
      </Pressable>
    </View>
  );
}

// What a row says under the name: what it is, and how far along. A link says where it is from
// instead (just the site, never the whole address). No file sizes.
//   "PDF · Not started"   "asana.com · 60%"   "Slides · Completed"
// with a thin bar under it. No exact count of exercises on the row.
const host = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const progressText = (p) => (p >= 1 ? 'Completed' : p > 0 ? `${Math.round(p * 100)}%` : 'Not started');
const subtext = (u, k) => `${u.kind === 'Link' ? host(u.url) || k.label : k.label} · ${progressText(u.progress)}`;

// One line, capped at 28 characters (about 20% fewer than a phone-width row used to show).
// A longer name is cut in the middle, "BC107_Week3_Busin…Notes_v2.docx", so the ending, which
// says what the file is, always stays. Names without an extension (links, folders) are cut at
// the end. If even 28 does not fit the row, the row's own ellipsis takes over.
const MAX_CHARS = 28;
function shortName(name, keepTail) {
  if (name.length <= MAX_CHARS) return name;
  if (!keepTail) return `${name.slice(0, MAX_CHARS - 1)}…`;
  const tail = Math.min(11, Math.floor(MAX_CHARS / 3));
  return `${name.slice(0, MAX_CHARS - 1 - tail)}…${name.slice(-tail)}`;
}

function MiddleName({ name, keepTail }) {
  return <Text style={styles.name} numberOfLines={1}>{shortName(name, keepTail)}</Text>;
}

// The drawer. It covers the list, slides in from the right (24px, ease-out, 220ms) and leaves
// faster (140ms). Unmounts on a timer so a background tab can never leave it stuck.
function Details({ item, onClose, onStart }) {
  const reduced = useReducedMotion();
  const stacked = useWindowDimensions().width < 1180; // the rail sits under the page
  const native = Platform.OS !== 'web';
  const v = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(null);
  const back = useRef(null);

  useEffect(() => {
    if (item) {
      setShown(item);
      Animated.timing(v, { toValue: 1, duration: reduced ? 100 : 220, easing: Motion.ease.out, useNativeDriver: native }).start();
      const t = setTimeout(() => back.current?.focus?.(), 60);
      return () => clearTimeout(t);
    }
    Animated.timing(v, { toValue: 0, duration: reduced ? 80 : 140, easing: Motion.ease.out, useNativeDriver: native }).start();
    const gone = setTimeout(() => setShown(null), reduced ? 90 : 150);
    return () => clearTimeout(gone);
  }, [item, reduced, v, native]);

  const onKey = useCallback((e) => { if (e.key === 'Escape') onClose(); }, [onClose]);
  useEffect(() => {
    if (native || !item || stacked) return undefined; // the sheet handles its own Escape
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [item, onKey, native, stacked]);

  if (!shown) return null;
  const k = KIND[shown.kind] || KIND.Doc;
  const accent = Colors.accent[k.accent];
  const pct = Math.round(shown.progress * 100);
  const done = Math.round(shown.progress * shown.total);
  const resume = shown.progress > 0;
  const isLink = shown.kind === 'Link';

  const facts = [
    { label: 'Type', value: k.label },
    ...(isLink ? [{ label: 'Source', value: host(shown.url) }] : []),
    { label: 'Uploaded', value: shown.age },
    ...(isLink ? [{ label: 'Address', value: shown.url }] : []),
  ];

  const info = (
    <>
        <View style={styles.titleRow}>
          <Tile Icon={k.Icon} muted size={48} />
          {/* The whole name, wrapped, selectable: this is where a long one is read in full. */}
          <Text style={[TITLE, styles.fullName]} selectable>{shown.name}</Text>
        </View>

        <View style={styles.facts}>
          {facts.map((f) => (
            <View key={f.label} style={styles.fact}>
              <Text style={styles.factLabel}>{f.label}</Text>
              <Text style={[styles.factValue, breakAnywhere]} selectable>{f.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.progress}>
          <View style={styles.progressTop}>
            <Text style={[styles.factLabel, { width: 'auto' }]}>Progress</Text>
            <Text style={styles.pct}>{progressText(shown.progress)}</Text>
          </View>
          <ProgressBar currentStep={shown.progress} totalSteps={1} sparkle={false} height={8} fillColor={Colors.brand.primary} />
          <Text style={SUB}>{resume ? `${done} of ${shown.total} exercises done` : `${shown.total} exercises waiting`}</Text>
        </View>
    </>
  );
  const buttons = (
    <>
      <Button title={resume ? 'Resume' : 'Start'} onPress={() => onStart(shown.name)} style={styles.action} />
      <Button title={isLink ? 'View Link' : 'View File'} variant="outline" onPress={() => view(shown)} style={styles.action} />
    </>
  );

  // Where the column sits under the page (a phone or tablet) the details are a full-screen
  // sheet instead of an in-column drawer: the room is the whole screen, not a 560px card.
  if (stacked) {
    return (
      <Sheet open={!!item} onClose={onClose} title="Upload Details" width={560} tall>
        <View style={styles.sheetBody}>{info}</View>
        <View style={styles.sheetActions}>{buttons}</View>
      </Sheet>
    );
  }

  return (
    <Animated.View
      accessibilityViewIsModal
      style={[styles.drawer, { opacity: v, transform: reduced ? [] : [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }]}
    >
      <View style={styles.bar}>
        <Pressable
          ref={back}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Back to recent uploads"
          style={({ hovered, pressed }) => [styles.back, (hovered || pressed) && { backgroundColor: Colors.surface.raised }]}
        >
          <ArrowLeft size={22} strokeWidth={2.4} color={Colors.icon.secondary} />
        </Pressable>
        <Text style={SUB}>Recent Uploads</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {info}
      </ScrollView>

      <View style={styles.actions}>{buttons}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, backgroundColor: Colors.surface.card, overflow: 'hidden' },
  head: { position: 'relative', zIndex: 5, gap: Space[12], paddingHorizontal: Space[16], paddingVertical: Space[12], borderBottomWidth: 1, borderBottomColor: Colors.border.hairline },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space[12], minHeight: 44 },
  tools: { flexDirection: 'row', alignItems: 'center', gap: Space[4] },
  tool: { width: 44, height: 44, borderRadius: Radii.control.md, alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: Space[8], minHeight: 48, paddingLeft: Space[12], paddingRight: Space[4], borderRadius: Radii.control.md, borderWidth: 2, borderColor: Colors.border.control, backgroundColor: Colors.surface.card },
  searchInput: { flex: 1, minWidth: 0, height: 44, padding: 0, fontFamily: FontFamilies.medium, fontSize: fs(16), color: Colors.text.primary },
  clear: { width: 36, height: 36, borderRadius: Radii.control.sm, alignItems: 'center', justifyContent: 'center' },
  list: { paddingVertical: Space[8] },
  // A name line and a subtext line: every row is the same height.
  row: { flexDirection: 'row', alignItems: 'center', gap: Space[12], minHeight: 64, paddingVertical: Space[8], paddingLeft: Space[16], paddingRight: Space[8], ...Platform.select({ web: { transitionProperty: 'background-color', transitionDuration: '140ms' } }) },
  main: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: Space[12], minHeight: 48, ...Platform.select({ web: { cursor: 'pointer' } }) },
  text: { flex: 1, minWidth: 0, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline' },
  name: { fontFamily: FontFamilies.demi, fontSize: fs(16), lineHeight: lh(22), color: Colors.text.primary },
  sub: { fontFamily: FontFamilies.medium, fontSize: fs(15), lineHeight: lh(20), color: Colors.text.secondary },
  // A subtle bar: a hairline-thin grey track, blue fill. Empty when not started.
  track: { height: 4, borderRadius: 2, marginTop: Space[4], backgroundColor: Colors.progress.track, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, backgroundColor: Colors.brand.primary },
  play: { width: 44, height: 44, borderRadius: Radii.control.md, alignItems: 'center', justifyContent: 'center' },
  empty: { paddingHorizontal: Space[16], paddingVertical: Space[24] },

  drawer: { ...StyleSheet.absoluteFillObject, zIndex: 10, backgroundColor: Colors.surface.card },
  bar: { flexDirection: 'row', alignItems: 'center', gap: Space[8], paddingHorizontal: Space[16], paddingVertical: Space[12], borderBottomWidth: 1, borderBottomColor: Colors.border.hairline },
  back: { width: 44, height: 44, borderRadius: Radii.control.md, alignItems: 'center', justifyContent: 'center' },
  body: { padding: Space[24], gap: Space[24] },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space[12] },
  fullName: { flex: 1, minWidth: 0, ...breakAnywhere },
  facts: { borderTopWidth: 1, borderTopColor: Colors.border.hairline },
  fact: { flexDirection: 'row', alignItems: 'flex-start', gap: Space[16], paddingVertical: Space[12], borderBottomWidth: 1, borderBottomColor: Colors.border.hairline },
  factLabel: { width: 96, fontFamily: FontFamilies.medium, fontSize: fs(15), lineHeight: lh(22), color: Colors.text.secondary },
  factValue: { flex: 1, minWidth: 0, fontFamily: FontFamilies.demi, fontSize: fs(16), lineHeight: lh(22), color: Colors.text.primary },
  pct: { fontFamily: FontFamilies.demi, fontSize: fs(16), lineHeight: lh(22), color: Colors.text.primary },
  progress: { gap: Space[8] },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space[16] },
  sheetBody: { gap: Space[24] },
  sheetActions: { gap: Space[8] },
  actions: { gap: Space[8], padding: Space[24], paddingTop: Space[12], borderTopWidth: 1, borderTopColor: Colors.border.hairline },
  action: { alignSelf: 'stretch' },
});
