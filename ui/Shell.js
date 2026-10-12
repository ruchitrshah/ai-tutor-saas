// The signed-in frame: sidebar, a scrolling centre column, and a right rail that
// stays put while the centre scrolls. Every signed-in screen uses it, including
// the task player, where the rail is the tutor.
//
// Depth is two steps: page (grey) and card (white, 1px border, 6px radius).
// Content scrolls *under* a soft gradient at the top and bottom edge, so it
// dissolves into the page instead of being cut off by a hard line.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, CircleUser, Dumbbell, Lightbulb, PanelLeftClose, PanelLeftOpen, RotateCcw, Timer, Upload } from './icons';

import { CONTROL, Colors, ColorUtils, FontFamilies, Motion, Palette, Radii, Space, useReducedMotion } from '../brand';
import { usePortal } from '../store/portal';
import { TITLE } from '../theme/type';
import TutorAvatar from './TutorAvatar';
import Reveal from './Reveal';
import Tile from './Tile';
import { fs } from '../theme/fluid';

// The rail is the same on every screen that has one, so it only animates the
// first time it appears. Moving between screens then changes the centre only.
let railPlayed = false;

// Remembered for the session, so moving between screens keeps the sidebar as you left it.
let sidebarCollapsed = false;

// One accent for the whole sidebar. The selected item says so with a filled icon, a
// tinted row and a blue label; nothing else changes colour.
const NAV = [
  { key: 'uploads', label: 'Uploads', Icon: Upload },
  { key: 'homework', label: 'Homework', Icon: BookOpen },
  { key: 'practice', label: 'Practice', Icon: Dumbbell },
  { key: 'revisions', label: 'Revisions', Icon: RotateCcw },
  { key: 'challenge', label: 'Challenge', Icon: Timer },
  { key: 'profile', label: 'Profile', Icon: CircleUser },
];

const FADE_FROM = Palette.page;
const FADE_TO = ColorUtils.rgba(Palette.page, 0);

// A gradient that is purely visual: never takes a click.
function Fade({ edge, height = 36, style }) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={edge === 'top' ? [FADE_FROM, FADE_TO] : [FADE_TO, FADE_FROM]}
      style={[styles.fade, edge === 'top' ? { top: 0 } : { bottom: 0 }, { height }, style]}
    />
  );
}

export default function Shell({ active = 'homework', sidebar = true, bottomNav = true, autoCollapse = false, wide = false, tight = false, rail, railFill = false, header, children }) {
  const { width } = useWindowDimensions();
  const [collapsed, setCollapsed] = useState(sidebarCollapsed);
  // While working (a task, an exam, a course being built) there is no sidebar or tab bar at
  // all: the X is the way out.
  const [peek, setPeek] = useState(false);
  const toggle = () => (autoCollapse ? setPeek((p) => !p) : setCollapsed((c) => { sidebarCollapsed = !c; return !c; }));
  const isCollapsed = autoCollapse ? !peek : collapsed;
  // Three layouts: phone (<640, a bottom tab bar), tablet (icon rail), desktop (full sidebar).
  const phone = width < 640;
  const compact = !phone && (width < 960 || isCollapsed);
  // One value drives the whole collapse: the width, the labels' fade and the toggle's slide.
  const reduced = useReducedMotion();
  const sbW = useRef(new Animated.Value(compact ? 84 : 288)).current;
  useEffect(() => {
    Animated.timing(sbW, { toValue: compact ? 84 : 288, duration: reduced ? 0 : 260, easing: Motion.ease.out, useNativeDriver: false }).start();
  }, [compact, reduced, sbW]);
  const labelOp = sbW.interpolate({ inputRange: [84, 170, 288], outputRange: [0, 0, 1], extrapolate: 'clamp' });
  const toggleX = sbW.interpolate({ inputRange: [84, 288], outputRange: [3, 210] });
  // Expanded: the mark at the left, toggle at the right. Collapsed: the mark is gone and the
  // toggle takes its place.
  const toggleY = 4;
  const topH = 52;
  const gutter = phone ? Space[16] : width < 960 ? Space[24] : Space[40];
  const showRail = !!rail && width >= 1180;
  const { go, route, openAbout } = usePortal();
  const routeKey = `${route.name}-${route.subjectId || ''}-${route.taskId || ''}`;

  return (
    <View style={[styles.root, phone && { flexDirection: 'column' }]}>
      {sidebar && !phone && !autoCollapse && (
        <Animated.View style={[styles.sidebar, { width: sbW }]}>
          {/* Rows keep their icon in the same place and clip, so nothing reflows while the
              sidebar slides: the labels just fade out. */}
          <View style={styles.sidebarInner}>
            <View style={[styles.topRow, { height: topH }]}>
              {/* The tutor's mark, on the same line as the icons below. */}
              <Animated.View style={[styles.brand, { opacity: labelOp }]} pointerEvents="none" accessibilityRole="image" accessibilityLabel="AI Tutor">
                <TutorAvatar size={36} />
              </Animated.View>
              {width >= 960 && (
                <Animated.View style={[styles.toggleSlot, { left: toggleX, top: toggleY }]}>
                  <Pressable
                    onPress={toggle}
                    accessibilityRole="button"
                    accessibilityLabel={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    accessibilityState={{ expanded: !isCollapsed }}
                    style={({ hovered, pressed }) => [styles.toggle, hovered && { backgroundColor: Colors.surface.raised }, pressed && { transform: [{ scale: 0.95 }] }]}
                  >
                    {isCollapsed ? <PanelLeftOpen size={24} strokeWidth={2.2} color={Colors.icon.secondary} /> : <PanelLeftClose size={24} strokeWidth={2.2} color={Colors.icon.secondary} />}
                  </Pressable>
                </Animated.View>
              )}
            </View>
            {NAV.map(({ key, label, Icon }) => {
              const on = key === active;
              return (
                <Pressable
                  key={key}
                  onPress={() => go(key)}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ selected: on }}
                  style={({ hovered, pressed }) => [
                    styles.navItem,
                    on && styles.navItemOn,
                    !on && hovered && styles.navItemHover,
                    pressed && { transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <View style={styles.iconBox}>
                    <Icon
                      size={26}
                      strokeWidth={2.2}
                      color={on ? Colors.brand.primary : Colors.icon.secondary}
                      fill={on ? Colors.brand.primary : 'none'}
                      fillOpacity={on ? 0.32 : 0}
                    />
                  </View>
                  <Animated.Text numberOfLines={1} style={[styles.navLabel, on && styles.navLabelOn, { opacity: labelOp }]}>{label}</Animated.Text>
                </Pressable>
              );
            })}

            {/* Pinned to the bottom: what this product is, for anyone who has just arrived. */}
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={openAbout}
              accessibilityRole="button"
              accessibilityLabel="Learn more about AI Tutor"
              style={({ hovered, pressed }) => [
                styles.navItem,
                styles.aboutItem,
                hovered && styles.navItemHover,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={styles.iconBox}><Lightbulb size={26} strokeWidth={2.2} color={Colors.icon.secondary} /></View>
              <Animated.Text numberOfLines={1} style={[styles.navLabel, { opacity: labelOp }]}>Learn More</Animated.Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Only this column scrolls. The rail below is a sibling, not a child. */}
      <View style={styles.centre}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          stickyHeaderIndices={header ? [0] : undefined}
        >
          {header ? (
            <View style={[styles.sticky, { paddingHorizontal: gutter, paddingTop: phone ? Space[16] : Space[32] }]}>
              <View style={[styles.col, wide ? { maxWidth: 1040 } : width >= 1700 && { maxWidth: 840 }, { zIndex: 8 }]}>{header}</View>
            </View>
          ) : null}
          <View style={[styles.contentWrap, { paddingHorizontal: gutter, paddingTop: tight ? Space[16] : phone ? Space[20] : Space[32] }, tight && { paddingBottom: Space[24] }]}>
            <View style={[styles.col, wide ? { maxWidth: 1040 } : width >= 1700 && { maxWidth: 840 }]}>
              <Reveal key={routeKey}>{children}</Reveal>
              {/* Narrow windows have no rail: its content follows the centre. */}
              {rail && !showRail ? <View style={[styles.stacked, railFill && styles.stackedFill, railFill && phone && { height: 560 }]}>{rail}</View> : null}
            </View>
          </View>
        </ScrollView>
        {!header && <Fade edge="top" height={24} />}
        <Fade edge="bottom" height={56} />
      </View>

      {showRail && railFill && (
        <View style={[styles.rail, styles.railFill]}>
          <RailIn style={{ flex: 1 }}>{rail}</RailIn>
        </View>
      )}

      {showRail && !railFill && (
        <View style={styles.rail}>
          <ScrollView contentContainerStyle={styles.railContent} showsVerticalScrollIndicator={false}>
            <RailIn style={styles.railStack}>{rail}</RailIn>
          </ScrollView>
          <Fade edge="top" height={24} />
          <Fade edge="bottom" height={56} />
        </View>
      )}

      {/* Phones: the sidebar becomes a tab bar along the bottom. */}
      {sidebar && phone && bottomNav && !autoCollapse && (
        <View style={styles.tabBar} accessibilityRole="tablist">
          {NAV.map(({ key, label, Icon }) => {
            const on = key === active;
            return (
              <Pressable
                key={key}
                onPress={() => go(key)}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected: on }}
                style={({ pressed }) => [styles.tab, on && styles.tabOn, pressed && { transform: [{ scale: 0.95 }] }]}
              >
                <Icon size={26} strokeWidth={2.2} color={on ? Colors.brand.primary : Colors.icon.secondary} fill={on ? Colors.brand.primary : 'none'} fillOpacity={on ? 0.32 : 0} />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function RailIn({ children, style }) {
  const first = !railPlayed;
  railPlayed = true;
  return (
    <Reveal delay={first ? 90 : 0} duration={first ? 260 : 1} y={first ? 10 : 0} style={style}>
      {children}
    </Reveal>
  );
}

// A card on the page. Titles carry a bare icon, never a box.
export function Panel({ title, icon, accent = 'blue', action, onAction, children, style }) {
  return (
    <View style={[styles.panel, style]}>
      {title ? (
        <View style={styles.panelHead}>
          <View style={styles.panelTitle}>
            {icon ? <Tile Icon={icon} accent={accent} size={40} /> : null}
            <Text style={TITLE}>{title}</Text>
          </View>
          {action ? (
            <Pressable onPress={onAction} accessibilityRole="button" style={styles.panelActionBtn}>
              <Text style={styles.panelAction}>{action}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export const cardBox = {
  backgroundColor: Colors.surface.card,
  borderWidth: 2,
  borderColor: Colors.border.subtle,
  borderRadius: Radii.card.default,
};

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: Colors.surface.page },
  sidebar: { borderRightWidth: 2, borderRightColor: Colors.border.subtle, backgroundColor: Colors.surface.chrome, overflow: 'hidden' },
  sidebarInner: { flex: 1, paddingHorizontal: Space[16], paddingTop: Space[32], paddingBottom: Space[16], gap: Space[4] },
  toggleSlot: { position: 'absolute', top: 0 },
  sidebarCompact: { width: 84, alignItems: 'center', paddingHorizontal: Space[12] },
  topRow: { marginBottom: Space[16], position: 'relative' },
  brand: { position: 'absolute', left: 7, top: 8, height: 36, flexDirection: 'row', alignItems: 'center', gap: Space[12] },
  toggle: { width: 44, height: 44, borderRadius: Radii.control.md, alignItems: 'center', justifyContent: 'center' },
  navItem: { overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: Space[16], minHeight: 52, paddingHorizontal: 12, borderRadius: Radii.control.md },
  navItemCompact: { width: CONTROL + 8, justifyContent: 'center', paddingHorizontal: 0 },
  navItemOn: { backgroundColor: Colors.brand.soft },
  navItemHover: { backgroundColor: Colors.surface.raised },
  // Looks and behaves like every other sidebar row, just pinned to the bottom.
  aboutItem: { marginBottom: Space[4] },
  iconBox: { width: 26, height: 26, flexShrink: 0 },
  navLabel: { flexShrink: 0, fontFamily: FontFamilies.demi, fontSize: fs(15), letterSpacing: 0.9, textTransform: 'uppercase', color: Colors.text.secondary },
  navLabelOn: { color: Colors.text.accent },

  centre: { flex: 1, position: 'relative', minHeight: 0 },
  tabBar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: Space[8], paddingTop: Space[8], paddingBottom: Space[12], borderTopWidth: 2, borderTopColor: Colors.border.subtle, backgroundColor: Colors.surface.chrome },
  tab: { flex: 1, maxWidth: 88, height: 48, borderRadius: Radii.control.md, alignItems: 'center', justifyContent: 'center' },
  tabOn: { backgroundColor: Colors.brand.soft },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  fade: { position: 'absolute', left: 0, right: 0, zIndex: 6 },
  // The header sits flush on the page; the fade below it is the same 32px as the
  // gap before the first card, so at rest there is one clean space, and when
  // scrolled the cards dissolve under the header instead of being cut.
  sticky: { alignItems: 'center', backgroundColor: Colors.surface.page, paddingTop: Space[32], paddingBottom: Space[12], paddingHorizontal: Space[40], zIndex: 5 },
  contentWrap: { alignItems: 'center', paddingTop: Space[32], paddingBottom: Space[96], paddingHorizontal: Space[40] },
  col: { width: '100%', maxWidth: 720 },
  stacked: { marginTop: Space[32] },
  stackedFill: { height: 620, borderRadius: Radii.card.default, borderWidth: 1, borderColor: Colors.border.hairline, overflow: 'hidden', backgroundColor: Colors.surface.card },

  rail: { width: 440, borderLeftWidth: 2, borderLeftColor: Colors.border.subtle, position: 'relative' },
  railFill: { backgroundColor: Colors.surface.card },
  railContent: { padding: Space[32], paddingBottom: Space[80] },
  railStack: { gap: Space[20] },

  panel: { ...cardBox, padding: Space[24], gap: Space[16] },
  panelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Space[12] },
  panelTitle: { flexDirection: 'row', alignItems: 'center', gap: Space[8], flexShrink: 1 },
  panelActionBtn: { minHeight: 32, justifyContent: 'center' },
  panelAction: { fontFamily: FontFamilies.demi, fontSize: fs(15), letterSpacing: 0.9, textTransform: 'uppercase', color: Colors.text.accent },
});
