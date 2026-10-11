// Enter animation: fade + rise. Ease-out, short, and staggerable with `delay`.
// Nothing starts from nothing: it begins at 0.96 opacity-free offset of 10px.
// Reduced motion keeps the fade (it carries meaning) and drops the movement.
import React, { useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';
import { Motion, useReducedMotion } from '../brand';

export default function Reveal({ children, delay = 0, y = 10, scaleFrom = 1, duration = 260, style }) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(duration <= 1 ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: reduced ? Motion.duration.micro : duration,
      delay: reduced ? 0 : delay,
      easing: Motion.ease.out,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [v, delay, duration, reduced]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: reduced
            ? []
            : [
                { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [y, 0] }) },
                ...(scaleFrom !== 1 ? [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [scaleFrom, 1] }) }] : []),
              ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
