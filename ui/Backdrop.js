// A quiet abstract that sits behind a character and belongs to the subject. One stroke
// weight throughout (so nothing looks uneven); depth comes from the fade, not thickness.
//   waves  Business Communication       flowing lines, like speech
//   rings  Marketing Management         a target, rings around the audience
//   steps  Introduction to Programming  a stepped square wave, like logic
//   bars   Business Statistics          a bell of columns, like a distribution
//
// It is drawn larger than its box on every side (the box clips it), so moving or growing it
// never uncovers an edge. `lift` (0 to 1) drives the motion: pass your own for hover, or set
// `loop` for a slow, endless drift. Transform only. Still under reduced motion.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useReducedMotion } from '../brand';

const FADES = [0.5, 0.36, 0.24];

export default function Backdrop({ shape, color, width, height, lift, loop = false, u = 1, anchor = 0.5 }) {
  const reduced = useReducedMotion();
  const own = useRef(new Animated.Value(0)).current;
  const v = lift || own;

  useEffect(() => {
    if (!loop || reduced) return undefined;
    const run = Animated.loop(Animated.sequence([
      Animated.timing(own, { toValue: 1, duration: 7000, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(own, { toValue: 0, duration: 7000, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
    ]));
    run.start();
    return () => run.stop();
  }, [loop, reduced, own]);

  if (!width || !height) return null;
  const W = width;
  const H = height;
  const m = 80 * u; // extra room left and right
  const mv = 20 * u; // extra room top and bottom
  const sw = 8 * u;
  const slide = v.interpolate({ inputRange: [0, 1], outputRange: [0, -30 * u] });
  const grow = v.interpolate({ inputRange: [0, 1], outputRange: [1, shape === 'bars' ? 1.14 : 1.08] });

  let art;
  if (shape === 'waves') {
    const wave = (y) => {
      const p = 60 * u;
      let d = `M ${-W} ${y} Q ${-W + p / 2} ${y - 20 * u} ${-W + p} ${y}`;
      for (let x = -W + 2 * p; x <= 2 * W; x += p) d += ` T ${x} ${y}`;
      return d;
    };
    art = [0.34, 0.57, 0.8].map((f, i) => <Path key={i} d={wave(H * f)} stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" strokeOpacity={FADES[i]} />);
  } else if (shape === 'rings') {
    art = [0.46, 0.73, 1.0].map((f, i) => <Circle key={i} cx={W * anchor} cy={H + 8 * u} r={H * f * (u > 1 ? 0.9 : 1)} stroke={color} strokeWidth={sw} fill="none" strokeOpacity={FADES[i]} />);
  } else if (shape === 'steps') {
    const run = 60 * u;
    const path = (y, off) => {
      let d = `M ${-W + off} ${y}`;
      for (let x = -W + off, up = false; x < 2 * W; x += run, up = !up) d += ` H ${x + run} V ${up ? y : y - 34 * u}`;
      return d;
    };
    art = [[0.77, 0], [0.58, 30 * u], [0.39, 0]].map(([f, o], i) => <Path key={i} d={path(H * f, o)} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeOpacity={FADES[i]} />);
  } else {
    const gap = 40 * u;
    const n = Math.ceil((W + 2 * m) / gap) + 2;
    const mid = (W * anchor) / gap;
    art = Array.from({ length: n }).map((_, k) => {
      const i = k - 2;
      const h = (28 + 112 * Math.exp(-(((i - mid) / 3.4) ** 2))) * u * (H > 300 ? 3 : 1);
      return <Rect key={k} x={i * gap} y={H - h} width={24 * u} height={h + 40 * u} rx={12 * u} fill={color} fillOpacity={0.3} />;
    });
  }
  const transform = shape === 'waves' || shape === 'steps' ? [{ translateX: slide }] : [{ scale: grow }];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[{ position: 'absolute', left: -m, right: -m, top: -mv, bottom: -mv, transform }, Platform.select({ web: { transformOrigin: '50% 100%' } })]}
      >
        <Svg width="100%" height="100%" viewBox={`${-m} ${-mv} ${W + 2 * m} ${H + 2 * mv}`}>{art}</Svg>
      </Animated.View>
    </View>
  );
}
