// A dropdown: a 48px control that shows the current choice, and a menu that opens
// below it, anchored to the control's right edge (it grows leftward), scaling out from
// that corner. Click outside, Escape, or choosing closes it.
//
// On a phone (under 640px wide) this is never a floating menu: the same options rise from the
// bottom of the screen as a sheet over a soft scrim, with a grab handle and a title. That is
// the rule for every dropdown and filter in the app, so nothing here has to opt in.
//
// Keyboard: Enter / Space / ArrowDown opens on the current choice; ArrowUp / ArrowDown
// (and Home / End) move; Enter or Space picks; Escape closes and returns focus to the
// control. The menu sits above the page's top fade.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { CONTROL, Colors, FontFamilies, Motion, Radii, Space, useReducedMotion } from '../brand';
import { Check, ChevronDown } from './icons';
import { fs, lh } from '../theme/fluid';

// Drawn straight into <body> on the web, so no transformed ancestor can trap the sheet.
const createPortal = Platform.OS === 'web' ? require('react-dom').createPortal : null;

// `Icon` + `iconOnly` makes the control a square icon button (no label, no chevron); `tinted`
// tints it, e.g. when a filter is applied.
export default function Dropdown({ label, value, options, onChange, menuWidth = 300, Icon, iconOnly = false, tinted = false }) {
  const reduced = useReducedMotion();
  const phone = useWindowDimensions().width < 640;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(0);
  const [sheetH, setSheetH] = useState(0);
  const current = options.find((o) => o.key === value) || options[0];
  const v = useRef(new Animated.Value(0)).current;
  const btn = useRef(null);
  const itemRefs = useRef([]);

  // Enter 160ms, exit 110ms: leaving is quicker than arriving. Unmount on a timer so a
  // background tab can never leave the menu stuck open.
  useEffect(() => {
    const native = Platform.OS !== 'web';
    if (open) {
      setMounted(true);
      Animated.timing(v, { toValue: 1, duration: reduced ? 80 : phone ? 280 : 160, easing: phone ? Motion.ease.drawer : Motion.ease.out, useNativeDriver: native }).start();
      return undefined;
    }
    Animated.timing(v, { toValue: 0, duration: reduced ? 60 : phone ? 200 : 110, easing: Motion.ease.out, useNativeDriver: native }).start();
    const t = setTimeout(() => setMounted(false), reduced ? 70 : phone ? 220 : 130);
    return () => clearTimeout(t);
  }, [open, reduced, v, phone]);

  const close = useCallback((refocus) => {
    setOpen(false);
    if (refocus && Platform.OS === 'web') setTimeout(() => btn.current?.focus?.(), 0);
  }, []);

  // The sheet has no focused control to hear Escape, so listen on the page while it is open.
  useEffect(() => {
    if (Platform.OS !== 'web' || !open || !phone) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(true); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, phone, close]);

  const openMenu = useCallback(() => {
    setActive(Math.max(0, options.findIndex((o) => o.key === value)));
    setOpen(true);
  }, [options, value]);

  // Move focus to the active option while open.
  useEffect(() => {
    if (Platform.OS !== 'web' || !open) return;
    const t = setTimeout(() => itemRefs.current[active]?.focus?.(), 30);
    return () => clearTimeout(t);
  }, [open, active]);

  const onMenuKey = (e) => {
    const k = e.nativeEvent?.key || e.key;
    const last = options.length - 1;
    if (k === 'ArrowDown') { e.preventDefault?.(); setActive((i) => (i >= last ? 0 : i + 1)); }
    else if (k === 'ArrowUp') { e.preventDefault?.(); setActive((i) => (i <= 0 ? last : i - 1)); }
    else if (k === 'Home') { e.preventDefault?.(); setActive(0); }
    else if (k === 'End') { e.preventDefault?.(); setActive(last); }
    else if (k === 'Escape') { e.preventDefault?.(); close(true); }
    else if (k === 'Tab') close(false);
  };

  const onBtnKey = (e) => {
    const k = e.nativeEvent?.key || e.key;
    if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault?.(); openMenu(); }
  };

  const sheet = (
    <View style={styles.sheetLayer} pointerEvents={open ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.overlay.scrim, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] }) }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close(true)} accessibilityLabel="Close" focusable={false} />
      </Animated.View>
      <Animated.View
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}
        style={[styles.sheet, { opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 1] }), transform: reduced ? [] : [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [sheetH || 480, 0] }) }] }]}
      >
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>{label}</Text>
        <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={styles.sheetList} showsVerticalScrollIndicator={false}>
          <View role="listbox" aria-label={label} style={styles.list}>
            {options.map((o, i) => {
              const on = o.key === value;
              return (
                <Pressable
                  key={o.key}
                  role="option"
                  aria-selected={on}
                  onPress={() => { onChange(o.key); close(true); }}
                  style={({ pressed }) => [styles.item, styles.sheetItem, on && { backgroundColor: Colors.brand.soft }, pressed && { backgroundColor: Colors.surface.raised, transform: [{ scale: 0.99 }] }]}
                >
                  {o.leading || null}
                  <View style={styles.itemText}>
                    <Text style={[styles.itemLabel, on && { color: Colors.text.accent }]} numberOfLines={1}>{o.label}</Text>
                    {o.hint ? <Text style={styles.itemHint} numberOfLines={1}>{o.hint}</Text> : null}
                  </View>
                  <View style={styles.tick}>{on ? <Check size={18} color={Colors.text.accent} strokeWidth={3} /> : null}</View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );

  return (
    <View style={styles.wrap}>
      {open && !phone && <Pressable style={styles.backdrop} onPress={() => close(false)} accessibilityLabel="Close menu" focusable={false} />}
      <Pressable
        ref={btn}
        onPress={() => (open ? close(false) : openMenu())}
        onKeyDown={onBtnKey}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current.label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={({ hovered, pressed }) => [styles.btn, iconOnly && styles.btnIcon, tinted && { backgroundColor: Colors.brand.soft }, (hovered || open) && !tinted && { backgroundColor: Colors.surface.raised }, pressed && { transform: [{ scale: 0.95 }] }]}
      >
        {iconOnly && Icon ? <Icon size={20} strokeWidth={2.4} color={tinted ? Colors.text.action : Colors.icon.secondary} /> : (
          <>
            {current.leading || null}
            <Text style={styles.btnText} numberOfLines={1}>{current.label}</Text>
            {/* One chevron that turns over, driven by the same value as the menu, instead of
                morphing between two shapes (whose in-between frame looked broken). */}
            <Animated.View style={{ transform: reduced ? [] : [{ rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
              <ChevronDown size={18} color={Colors.icon.secondary} strokeWidth={2.4} />
            </Animated.View>
          </>
        )}
      </Pressable>

      {mounted && phone && (createPortal ? createPortal(sheet, document.body) : sheet)}

      {mounted && !phone && (
        <Animated.View
          pointerEvents={open ? 'auto' : 'none'}
          style={[
            styles.menu,
            { width: menuWidth, opacity: v, transform: reduced ? [] : [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }] },
          ]}
        >
          <View role="listbox" aria-label={label} onKeyDown={onMenuKey} style={styles.list}>
            {options.map((o, i) => {
              const on = o.key === value;
              return (
                <Pressable
                  key={o.key}
                  ref={(el) => { itemRefs.current[i] = el; }}
                  role="option"
                  aria-selected={on}
                  focusable
                  onPress={() => { onChange(o.key); close(true); }}
                  onFocus={() => setActive(i)}
                  style={({ hovered, pressed }) => [
                    styles.item,
                    (hovered || active === i) && { backgroundColor: Colors.surface.raised },
                    on && { backgroundColor: Colors.brand.soft },
                    pressed && { transform: [{ scale: 0.99 }] },
                  ]}
                >
                  {o.leading || null}
                  <View style={styles.itemText}>
                    <Text style={[styles.itemLabel, on && { color: Colors.text.accent }]} numberOfLines={1}>{o.label}</Text>
                    {o.hint ? <Text style={styles.itemHint} numberOfLines={1}>{o.hint}</Text> : null}
                  </View>
                  <View style={styles.tick}>{on ? <Check size={18} color={Colors.text.accent} strokeWidth={3} /> : null}</View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', zIndex: 30 },
  backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 29 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[10],
    minHeight: CONTROL,
    paddingHorizontal: Space[16],
    borderRadius: Radii.control.md,
    borderWidth: 2,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.surface.card,
    ...Platform.select({ web: { userSelect: 'none', WebkitUserSelect: 'none' } }),
  },
  btnIcon: { width: CONTROL, paddingHorizontal: 0, justifyContent: 'center', borderWidth: 0, backgroundColor: 'transparent' },
  btnText: { fontFamily: FontFamilies.demi, fontSize: fs(15), color: Colors.text.primary },
  menu: {
    position: 'absolute',
    top: CONTROL + 8,
    right: 0,
    zIndex: 31,
    maxWidth: '92vw',
    padding: Space[6],
    backgroundColor: Colors.surface.card,
    borderWidth: 2,
    borderColor: Colors.border.subtle,
    borderRadius: Radii.card.default,
    ...Platform.select({ web: { transformOrigin: 'top right' } }),
  },
  list: { gap: Space[2] },
  item: { flexDirection: 'row', alignItems: 'center', gap: Space[12], minHeight: 56, paddingLeft: Space[14], paddingRight: Space[12], paddingVertical: Space[8], borderRadius: Radii.control.md },
  itemText: { flex: 1, minWidth: 0, gap: 1 },
  itemLabel: { fontFamily: FontFamilies.demi, fontSize: fs(16), lineHeight: lh(22), color: Colors.text.primary },
  itemHint: { fontFamily: FontFamilies.medium, fontSize: fs(15), lineHeight: lh(20), color: Colors.text.secondary },
  tick: { width: 20, alignItems: 'center' },

  // Phone: a bottom sheet over a soft scrim.
  sheetLayer: { ...Platform.select({ web: { position: 'fixed' }, default: { position: 'absolute' } }), top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '82%',
    paddingTop: Space[8],
    ...Platform.select({ web: { paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }, default: { paddingBottom: Space[16] } }),
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.control, opacity: 0.5, marginBottom: Space[8] },
  sheetTitle: { fontFamily: FontFamilies.demi, fontSize: fs(20), lineHeight: lh(28), textAlign: 'center', color: Colors.text.primary, paddingHorizontal: Space[24], paddingTop: Space[8], paddingBottom: Space[16] },
  sheetList: { paddingHorizontal: Space[12], paddingBottom: Space[4] },
  sheetItem: { minHeight: 56 },
});
