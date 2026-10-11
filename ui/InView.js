// Animates in when it scrolls into view, once: a fade, a short rise and a small settle. For a
// long list this means the entrance happens where you are looking, not all at once at the
// top of the page. On the web it uses IntersectionObserver; elsewhere (and if the observer
// never fires, for example in a background tab) it simply shows. Opacity and transform only.
import React, { useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';

import { Motion, useReducedMotion } from '../brand';

export default function InView({ children, delay = 0, y = 16, scaleFrom = 0.96, style }) {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const web = Platform.OS === 'web';
  const v = useRef(new Animated.Value(web ? 0 : 1)).current;

  useEffect(() => {
    if (!web) return undefined;
    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      Animated.timing(v, { toValue: 1, duration: reduced ? 100 : 380, delay: reduced ? 0 : delay, easing: Motion.ease.out, useNativeDriver: false }).start();
    };
    let io;
    if (ref.current && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { show(); io.disconnect(); } }, { threshold: 0.08 });
      io.observe(ref.current);
    }
    const guard = setTimeout(() => { if (!io) show(); }, 600);
    return () => { done = true; clearTimeout(guard); if (io) io.disconnect(); };
  }, [web, v, delay, reduced]);

  return (
    <Animated.View
      ref={ref}
      style={[
        style,
        {
          opacity: v,
          transform: reduced ? [] : [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [y, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [scaleFrom, 1] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
