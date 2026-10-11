// src/components/ProgressBar.js
//
// Rilla's segmented onboarding progress bar. Advancing a step fills the next
// segment left → right, and a spark lands on the leading tip as it arrives.
//
// Four decisions worth stating, because they are why this feels right rather
// than merely correct:
//
//   1. Segments are never resized. Each fill is a full-width pill parked off to
//      the left of its own clipped segment and pulled in with translateX.
//      Width animates layout every frame; scaleX squashes the rounded cap into
//      an ellipse at exactly the moment the segment is mostly empty. translateX
//      keeps the cap round and runs on the native driver.
//
//   2. The fill uses ease-out, not a spring. Motion.spring.settle overshoots by
//      ~3%, and on a *segmented* bar that overshoot is not a soft bounce — it
//      is a sliver of yellow appearing in the next, not-yet-earned segment and
//      then retracting. Reading that as a glitch takes no effort at all.
//
//   3. The spark punctuates the arrival, not the departure. It is delayed so
//      its peak lands as the fill decelerates into place. A spark that fires on
//      the button press celebrates the click; one that fires on arrival
//      celebrates the step, which is the thing the user actually did.
//
//   4. Backwards doesn't sparkle. Going back is a correction, not an
//      achievement. The fill retracts, quietly.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Colors, Motion, useReducedMotion } from '../brand';

// The two palettes are reconciled — Colors.js is Rilla's now — so the fill and
// track read from tokens instead of living here.
const RILLA_YELLOW = Colors.progress.fill;
const RILLA_TRACK = Colors.progress.track;
// The spark's core reads white-hot; only its glow and debris carry the hue.
// A spark that is uniformly yellow looks like a sticker, not like light.
const SPARK_CORE = '#FFFEF2';

// Gradient ids are global to the SVG namespace, so two bars on one screen would
// otherwise share — and fight over — a single `url(#…)` reference.
let glowSeq = 0;

// The spark's own canvas. Generous, so debris has room to travel before it is
// clipped.
const TIP_BOX = 56;

// Four-point star in a 24×24 box. Concave sides matter: a diamond reads as a
// shape, a star with pinched sides reads as light.
const STAR =
  'M12 0 C12.6 6.6 17.4 11.4 24 12 C17.4 12.6 12.6 17.4 12 24 ' +
  'C11.4 17.4 6.6 12.6 0 12 C6.6 11.4 11.4 6.6 12 0 Z';

// Debris fans forward from the tip, biased in the direction of travel.
// Angles are degrees from +x; positive y is down in React Native.
const PARTICLES = [
  { angle: -62, distance: 15, size: 4.5, delay: 0.0 },
  { angle: -20, distance: 21, size: 3.5, delay: 0.07 },
  { angle: 20, distance: 20, size: 4.0, delay: 0.05 },
  { angle: 61, distance: 14, size: 3.0, delay: 0.12 },
];

const TRAVEL_MS = 340; // one segment, ease-out — ~95% covered by 200ms
const SPARK_DELAY_MS = 200; // so the peak lands on arrival, not on the press
const SPARK_MS = 520;

export default function ProgressBar({
  currentStep = 1,
  totalSteps = 7,
  height = 5,
  gap = 10,
  fillColor = RILLA_YELLOW,
  trackColor = RILLA_TRACK,
  sparkle = true,
  // Duolingo's bar has a lighter stripe riding inside the fill — it reads as
  // a glossy tube rather than a flat rectangle. It lives inside the fill, so
  // it travels with it for free.
  shine = false,
  style,
}) {
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);

  const target = clamp(currentStep, 0, totalSteps);
  const segmentWidth =
    width > 0 ? Math.max(0, (width - gap * (totalSteps - 1)) / totalSteps) : 0;

  // Measured in steps, not in pixels or in 0–1: at 2.4 the third segment is 40%
  // full. Every position in the bar falls out of this one number.
  const progress = useRef(new Animated.Value(target)).current;
  const spark = useRef(new Animated.Value(1)).current; // 1 = spent / idle
  const previousStep = useRef(target);
  const isFirstRun = useRef(true);

  useEffect(() => {
    const movedForward = target > previousStep.current;
    previousStep.current = target;

    // The opening state is a state, not an event. Animating on mount narrates
    // something the user did not do.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      progress.setValue(target);
      return;
    }

    // Reduce motion is not no motion: the travel *is* the information, so it
    // stays. What goes is the spark and the long tail.
    Animated.timing(progress, {
      toValue: target,
      duration: reduceMotion ? Motion.duration.micro : TRAVEL_MS,
      easing: Motion.ease.out,
      useNativeDriver: true,
    }).start();

    if (!sparkle || reduceMotion || !movedForward) return;

    // Restarting from zero is right here — a new step earns a new spark. The
    // shaping lives in the interpolations below so this driver stays linear,
    // which lets one native-driven value carry the whole timeline.
    spark.setValue(0);
    Animated.sequence([
      Animated.delay(SPARK_DELAY_MS),
      Animated.timing(spark, {
        toValue: 1,
        duration: SPARK_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();
  }, [target, reduceMotion, sparkle, progress, spark]);

  // The tip walks segment to segment, skipping the gaps. The doubled stops with
  // a hair of separation are what put the jump *in* the gap: the spark goes
  // dark at the end of one segment and reappears at the start of the next,
  // rather than sliding across dead track it hasn't earned.
  const tipTranslate = useMemo(() => {
    if (segmentWidth <= 0) return progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0] });
    //
    // Stops run i → i+1−ε per segment, then the final edge. (An earlier version
    // pushed i+1 and then i+1−ε, which is non-monotonic — Animated rejects it
    // the moment the bar has a measured width and more than one segment.)
    const input = [];
    const output = [];
    for (let i = 0; i < totalSteps; i++) {
      const left = i * (segmentWidth + gap);
      input.push(i);
      output.push(left);
      input.push(i + 1 - 0.0001);
      output.push(left + segmentWidth);
    }
    input.push(totalSteps);
    output.push((totalSteps - 1) * (segmentWidth + gap) + segmentWidth);
    return progress.interpolate({ inputRange: input, outputRange: output, extrapolate: 'clamp' });
  }, [progress, segmentWidth, gap, totalSteps]);

  const showSpark = sparkle && !reduceMotion && segmentWidth > 0;

  return (
    <View
      style={[styles.root, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: totalSteps, now: currentStep }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <View style={[styles.row, { height }]}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              {
                height,
                borderRadius: height / 2,
                backgroundColor: trackColor,
                marginLeft: i === 0 ? 0 : gap,
              },
            ]}
          >
            <Animated.View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: segmentWidth,
                height,
                borderRadius: height / 2,
                backgroundColor: fillColor,
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [i, i + 1],
                      outputRange: [-segmentWidth, 0],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              }}
            >
              {shine && height >= 10 ? (
                <View
                  style={{
                    position: 'absolute',
                    top: Math.round(height * 0.22),
                    left: height * 0.6,
                    right: height * 0.6,
                    height: Math.max(2, Math.round(height * 0.26)),
                    borderRadius: height,
                    backgroundColor: 'rgba(255,255,255,0.45)',
                  }}
                />
              ) : null}
            </Animated.View>
          </View>
        ))}
      </View>

      {showSpark && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tipLayer,
            {
              width: TIP_BOX,
              height: TIP_BOX,
              marginLeft: -TIP_BOX / 2,
              marginTop: -TIP_BOX / 2,
              transform: [{ translateX: tipTranslate }],
            },
          ]}
        >
          {PARTICLES.map((p, i) => (
            <Particle key={i} spark={spark} spec={p} color={fillColor} />
          ))}
          <Star spark={spark} />
        </Animated.View>
      )}
    </View>
  );
}

// ── Tip glow ───────────────────────────────────────────────────────────────
//
// Faintly lit at rest so the tip reads as the live end of the bar; brightest
// while the fill is travelling, then back down. Opacity on a gradient, not a
// blur radius — a real blur this size costs a frame and buys nothing here.
function Glow({ spark, color }) {
  const id = useRef(`rillaTipGlow${glowSeq++}`).current;

  const opacity = spark.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [0.5, 1, 0.22],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
      <Svg width={TIP_BOX} height={TIP_BOX}>
        <Defs>
          {/* An ellipse, not a circle. A round bloom on a 5px bar reads as a
              ball parked on the line; light on a thin filament spreads along
              it. */}
          <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="30%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.5" />
            <Stop offset="45%" stopColor={color} stopOpacity="0.13" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width={TIP_BOX} height={TIP_BOX} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

// ── The star ───────────────────────────────────────────────────────────────
function Star({ spark }) {
  const opacity = spark.interpolate({
    inputRange: [0, 0.08, 0.42, 0.75],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });

  // Starts at 0.45, never at 0. Nothing in the world appears from nothing —
  // even a spark has a shape before it has a size.
  const scale = spark.interpolate({
    inputRange: [0, 0.24, 0.8],
    outputRange: [0.45, 1.15, 0.7],
    extrapolate: 'clamp',
  });

  const rotate = spark.interpolate({
    inputRange: [0, 1],
    outputRange: ['-18deg', '30deg'],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.center, { opacity, transform: [{ scale }, { rotate }] }]}>
      <Svg width={16} height={16} viewBox="0 0 24 24">
        <Path d={STAR} fill={SPARK_CORE} />
      </Svg>
    </Animated.View>
  );
}

// ── Debris ─────────────────────────────────────────────────────────────────
function Particle({ spark, spec, color }) {
  const { angle, distance, size, delay } = spec;
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad) * distance;
  const dy = Math.sin(rad) * distance;

  const opacity = spark.interpolate({
    inputRange: [delay, delay + 0.12, delay + 0.5],
    outputRange: [0, 0.95, 0],
    extrapolate: 'clamp',
  });

  // Travel decelerates: debris leaves fast and coasts, the way thrown things
  // do. The easing lives in the output curve rather than in the driver so all
  // four particles can share one native-driven value.
  const travel = spark.interpolate({
    inputRange: [delay, delay + 0.2, delay + 0.72],
    outputRange: [0, 0.72, 1],
    extrapolate: 'clamp',
  });

  const translateX = travel.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
  const translateY = travel.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
  const scale = spark.interpolate({
    inputRange: [delay, delay + 0.18, delay + 0.72],
    outputRange: [0.5, 1, 0.3],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[styles.center, { opacity, transform: [{ translateX }, { translateY }, { scale }] }]}
    >
      <View
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }}
      />
    </Animated.View>
  );
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  segment: {
    flex: 1,
    overflow: 'hidden', // clips each fill's trailing cap off its left edge
  },
  tipLayer: {
    position: 'absolute',
    left: 0,
    top: '50%',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
