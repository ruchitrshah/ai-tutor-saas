import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Animated,
  Easing,
  Text,
} from 'react-native';
import {
  Heart,
  MessageCircle,
  Compass,
  Settings2,
  CircleUserRound,
  UserRoundPen,
  Check,
} from 'lucide-react-native';
import { HeartIcon, ChatCircleIcon, CompassIcon, UserCircleIcon, SlidersHorizontalIcon } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLikeStore } from '../store/likeStore';
import { useMessageStore } from '../store/messageStore';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
// ✅ useLikes removed — TabBar no longer owns a useLikes instance
import { emitTabReselect } from '../lib/tabReselect';
import { Colors, Space, Radius, Type } from '../brand';
import Button from '../components/Button';
import GlassSurface, { GLASS_PAD, GLASS_SIDE_GAP, glassBottomGap } from './GlassSurface';
import { useButtonHeight } from './Footer';

// Geometry of the bar, kept next to the styles that produce it so the two
// cannot drift apart. Screens under the tab navigator must pad their scroll
// content by `useTabBarHeight()` — a hardcoded number goes wrong the moment
// the device uses 3-button navigation (48dp inset) instead of gestures (24dp).
const TAB_ROW_HEIGHT = 52;
// Spacing is built so every VISIBLE gap in the bar is GLASS_PAD (14):
//   capsule edge → buttons      GLASS_PAD
//   buttons → tab icons         ACTION_GAP (4) + the 10 of air inside a tab cell
//   tab icons → capsule edge    BAR_EDGE (4) + the same 10
// The action row is in the normal layout flow, not absolutely positioned, so
// the gap below it is exact whatever the button's real height is (it grows
// with the OS font size).
const TAB_CELL_AIR = 10;
const BAR_EDGE = GLASS_PAD - TAB_CELL_AIR;
const ACTION_GAP = GLASS_PAD - TAB_CELL_AIR;

// The bar floats: a glass capsule inset from the screen edges, with `gap` of
// empty screen under it. Inner padding is symmetric (Space[10] top and bottom).
export function useTabBarHeight({ withActions = false } = {}) {
  const insets = useSafeAreaInsets();
  const buttonHeight = useButtonHeight();
  return (
    (withActions ? GLASS_PAD + buttonHeight + ACTION_GAP : BAR_EDGE) +
    TAB_ROW_HEIGHT +
    BAR_EDGE +
    glassBottomGap(insets.bottom)
  );
}

const TABS = [
  { name: 'Likes', Icon: Heart, FilledIcon: HeartIcon, label: 'Likes' },
  { name: 'Messages', Icon: MessageCircle, FilledIcon: ChatCircleIcon, label: 'Messages' },
  { name: 'Discover', Icon: Compass, FilledIcon: CompassIcon, label: 'Discover' },
  { name: 'Profile', Icon: CircleUserRound, FilledIcon: UserCircleIcon, label: 'Profile' },
  { name: 'Settings', Icon: Settings2, FilledIcon: SlidersHorizontalIcon, label: 'Settings' },
];

function TabBarBackground({ children, hasActions = false }) {
  return (
    <GlassSurface
      radius={hasActions ? 32 : 36}
      contentStyle={{
        paddingTop: hasActions ? GLASS_PAD : BAR_EDGE,
        paddingBottom: BAR_EDGE,
      }}
    >
      {children}
    </GlassSurface>
  );
}

function TabButton({ tab, isFocused, onPress, badgeCount = 0 }) {
  const focusAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const hoverAnim = useRef(new Animated.Value(0)).current;

  const badgeScale = useRef(new Animated.Value(badgeCount > 0 ? 1 : 0)).current;
  const prevCountRef = useRef(badgeCount);
  const [renderCount, setRenderCount] = useState(badgeCount);

  useEffect(() => {
    const prev = prevCountRef.current;
    prevCountRef.current = badgeCount;
    if (badgeCount === prev) return;

    if (badgeCount > 0) setRenderCount(badgeCount);

    if (prev === 0 && badgeCount > 0) {
      Animated.spring(badgeScale, {
        toValue: 1, stiffness: 300, damping: 10, useNativeDriver: true,
      }).start();
    } else if (badgeCount === 0) {
      Animated.spring(badgeScale, {
        toValue: 0, stiffness: 400, damping: 18, useNativeDriver: true,
      }).start(() => setRenderCount(0));
    } else {
      Animated.sequence([
        Animated.spring(badgeScale, { toValue: 1.45, stiffness: 600, damping: 8,  useNativeDriver: true }),
        Animated.spring(badgeScale, { toValue: 1,    stiffness: 350, damping: 13, useNativeDriver: true }),
      ]).start();
      setRenderCount(badgeCount);
    }
  }, [badgeCount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Animated.spring(focusAnim, {
      toValue: isFocused ? 1 : 0,
      stiffness: 240,
      damping: 20,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  }, [focusAnim, isFocused]);

  const animateHover = (toValue) => {
    if (Platform.OS !== 'web') return;
    Animated.timing(hoverAnim, {
      toValue,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const scale = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const translateY = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1.5],
  });

  const iconOpacity = Animated.add(
    focusAnim.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }),
    hoverAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] })
  ).interpolate({ inputRange: [0.82, 1.12], outputRange: [0.82, 1] });

  const TabIcon = isFocused ? tab.FilledIcon : tab.Icon;

  return (
    <Animated.View
      style={[
        styles.tabTouch,
        { opacity: iconOpacity, transform: [{ translateY }, { scale }] },
      ]}
      onMouseEnter={Platform.OS === 'web' ? () => animateHover(1) : undefined}
      onMouseLeave={Platform.OS === 'web' ? () => animateHover(0) : undefined}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.activePill,
          {
            opacity: focusAnim,
            transform: [
              { scale: focusAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
            ],
          },
        ]}
      />
      <Button
        onPress={onPress}
        variant="ghost"
        haptic="none"
        style={styles.tabGhostButton}
      >
        <View style={styles.tabIconWrap}>
          <TabIcon
            size={23}
            color={isFocused ? Colors.text.primary : Colors.text.secondary}
            {...(isFocused ? { weight: 'fill' } : { strokeWidth: 1.9 })}
          />

          {renderCount > 0 && (
            <Animated.View
              style={[styles.tabBadge, { transform: [{ scale: badgeScale }] }]}
              accessibilityLabel={`${renderCount} unread`}
            >
              <Text style={styles.tabBadgeText}>
                {renderCount > 99 ? '99+' : renderCount}
              </Text>
            </Animated.View>
          )}
        </View>
      </Button>
    </Animated.View>
  );
}

export default function TabBar({ state, navigation, descriptors }) {
  const insets = useSafeAreaInsets();
  // ✅ Read from global store — updates whenever any useLikes instance writes to it
  const likesBadgeCount = useLikeStore((s) => s.pendingCount);
  const unreadMessages  = useMessageStore((s) => s.totalUnread);

  // Owns the unread count for the whole app — the tab bar is the one component
  // that is always mounted while signed in.
  useUnreadMessages();

  if (!state?.routes?.length) return null;

  const activeRoute = state.routes[state.index];
  const isDiscover  = activeRoute?.name === 'Discover';
  const isProfile   = activeRoute?.name === 'Profile';
  const isSettings  = activeRoute?.name === 'Settings';
  const bottomGap = glassBottomGap(insets.bottom);

  const activeOptions        = descriptors?.[activeRoute.key]?.options ?? {};
  const onDiscoverConnect    = activeOptions?.onDiscoverConnect;
  const discoverConnectLabel = activeOptions?.discoverConnectLabel ?? 'Connect Now';
  const discoverConnectDoneLabel = activeOptions?.discoverConnectDoneLabel ?? 'Sent';
  const discoverConnectDone  = !!activeOptions?.discoverConnectDone;
  const onDiscoverPass       = activeOptions?.onDiscoverPass;
  const hasDiscoverProfile   = !!activeOptions?.hasDiscoverProfile;

  const onProfileShare    = activeOptions?.onProfileShare;
  const onProfileEdit     = activeOptions?.onProfileEdit;
  const profileShareLabel = activeOptions?.profileShareLabel || 'Share Profile';

  const onSettingsLogout  = activeOptions?.onSettingsLogout;
  const settingsLoggingOut = !!activeOptions?.settingsLoggingOut;

  const showDiscoverActions = isDiscover && hasDiscoverProfile;
  const showLogout          = isSettings && !!onSettingsLogout;
  const hasActions          = showDiscoverActions || isProfile || showLogout;

  const handleTabPress = (tabName, routeKey, isFocused) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });

    if (isFocused) {
      emitTabReselect(tabName);
      return;
    }

    if (!event.defaultPrevented) {
      navigation.navigate(tabName);
    }
  };

  return (
    <View
      style={[styles.wrapper, { bottom: bottomGap, left: GLASS_SIDE_GAP, right: GLASS_SIDE_GAP }]}
      pointerEvents="box-none"
    >
      <TabBarBackground hasActions={hasActions}>

        {showDiscoverActions ? (
          <View style={styles.actionRow}>
            <Button
              title="Skip For Now"
              variant="outline"
              onPress={onDiscoverPass}
              haptic="light"
              style={styles.actionButtonHalf}
            />
            <Button
              title={discoverConnectLabel}
              variant="primary"
              onPress={onDiscoverConnect}
              // A success notification, not an impact tap. Connecting is the
              // one action here that deserves a different thing in the hand.
              haptic="success"
              style={styles.actionButtonHalf}
              success={discoverConnectDone}
              successTitle={discoverConnectDoneLabel}
              SuccessIcon={Check}
            />
          </View>
        ) : null}

        {isProfile ? (
          <View style={styles.profileActionRow}>
            <Button
              title={profileShareLabel}
              variant="primary"
              onPress={onProfileShare}
              haptic="medium"
              style={styles.profileShareButton}
              disabled={!onProfileShare}
            />
            <Button
              variant="outline"
              onPress={onProfileEdit}
              haptic="light"
              style={styles.profileEditButton}
              disabled={!onProfileEdit}
            >
              <UserRoundPen
                size={17}
                color={onProfileEdit ? Colors.text.primary : Colors.text.tertiary}
                strokeWidth={2.8}
              />
            </Button>
          </View>
        ) : null}

        {showLogout ? (
          <View style={styles.profileActionRow}>
            <Button
              title={settingsLoggingOut ? 'Logging out...' : 'Logout'}
              variant="outline"
              onPress={onSettingsLogout}
              haptic="medium"
              disabled={settingsLoggingOut}
              style={styles.profileShareButton}
            />
          </View>
        ) : null}

        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const tab = TABS.find((t) => t.name === route.name);
            if (!tab) return null;

            const isFocused = state.index === index;

            return (
              <TabButton
                key={route.key}
                tab={tab}
                isFocused={isFocused}
                badgeCount={
                  route.name === 'Likes'
                    ? likesBadgeCount
                    : route.name === 'Messages'
                      ? unreadMessages
                      : 0
                }
                onPress={() => handleTabPress(route.name, route.key, isFocused)}
              />
            );
          })}

        </View>

      </TabBarBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    zIndex: 1000,
  },
  actionRow: {
    paddingHorizontal: GLASS_PAD,
    marginBottom: ACTION_GAP,
    flexDirection: 'row',
    gap: Space[12],
    alignItems: 'center',
  },
  profileActionRow: {
    paddingHorizontal: GLASS_PAD,
    marginBottom: ACTION_GAP,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[12],
  },
  actionButtonHalf: {
    // flexBasis 0 stated outright: the two buttons split the row evenly
    // regardless of label length ("Connect Now" vs "Accept Request").
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    paddingHorizontal: Space[12],
  },

  profileShareButton: { flex: 1 },
  profileEditButton:  { width: 52, minWidth: 52, paddingHorizontal: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Space[16],
  },
  tabTouch: { flex: 1, height: TAB_ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  tabGhostButton: { width: '100%', height: 52, minHeight: 52, paddingHorizontal: 0, paddingVertical: 0 },
  // Selected-tab glass capsule, the way the system tab bar marks the current tab.
  activePill: {
    position: 'absolute',
    alignSelf: 'center',
    width: 64,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16,24,40,0.07)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  tabIconWrap: { position: 'relative', width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  tabBadge: {
    position: 'absolute', top: -6, right: -10,
    minWidth: 24, height: 24, borderRadius: 20,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  tabBadgeText: {
    ...Type.button,
    color: Colors.brand.onPrimary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'none',
  },
});
