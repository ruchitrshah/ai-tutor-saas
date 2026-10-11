// The tutor's character. Eight to choose from (Profile → Your Tutor), all built from
// the same few shapes: one tall rounded body that rises out of the bottom edge, two
// raised hands, eyes and (mostly) a mouth. Same pose and proportions for every one, so
// switching character never changes the layout. Colours come from the brand palette.
//
// Still by default (avatars, the picker). With `live`, it moves:
//   · ambient   blinks every few seconds, hands sway a hair
//   · `mood`    a state it holds: 'idle' | 'listen' | 'think' | 'speak' | 'sad'
//   · `gesture` a one-off, { name, id }: wave · tilt · offer · curious · pump · calm ·
//               cheer · oops. A new `id` replays it.
// Motion follows the hand-drawn principles: anticipation before the move, ease-out into
// it, a settle after. Eyes and mouth change with the moment (smiling eyes on a cheer,
// wide eyes when listening, a small frown on an oops). Under reduced motion the
// expressions still change but nothing moves.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

import { Colors, useReducedMotion } from '../brand';
import { usePortal } from '../store/portal';

export const MASCOTS = [
  { key: 'cactus', name: 'Pokey Pip' },
  { key: 'bear', name: 'Bumble Bruno' },
  { key: 'fox', name: 'Rusty Riddle' },
  { key: 'owl', name: 'Quill Hoot' },
  { key: 'frog', name: 'Puddle Quest' },
  { key: 'bunny', name: 'Biscuit Hop' },
  { key: 'cat', name: 'Whisker Wonder' },
  { key: 'penguin', name: 'Pebble Waddle' },
];

const SPEC = {
  cactus: { tone: 'blue', top: 18, eyes: [[50, 68, 4.4], [70, 68, 4.4]], mouth: { y: 79, w: 8 } },
  bear: { tone: 'purple', top: 6, eyes: [[50, 66, 4.4], [70, 66, 4.4]], mouth: { y: 82, w: 5.5 } },
  fox: { tone: 'orange', top: 0, eyes: [[50, 68, 4.4], [70, 68, 4.4]], mouth: { y: 83, w: 5.5 } },
  owl: { tone: 'yellow', top: 4, eyes: [[47, 67, 5.6], [73, 67, 5.6]], mouth: null },
  frog: { tone: 'green', top: 8, eyes: [[43, 41, 4.6], [77, 41, 4.6]], mouth: { y: 72, w: 14 } },
  bunny: { tone: null, top: -8, eyes: [[50, 68, 4.4], [70, 68, 4.4]], mouth: { y: 82, w: 5.5 } },
  cat: { tone: null, top: 2, fill: '#FFA3A3', eyes: [[50, 68, 4.4], [70, 68, 4.4]], mouth: { y: 83, w: 7 } },
  penguin: { tone: null, top: 16, fill: '#3B4F5A', eyes: [[50, 65, 3.4], [70, 65, 3.4]], mouth: null },
};

// The colour family each character belongs to, for screens that tint themselves to match.
export const MASCOT_TONE = { cactus: 'blue', bear: 'purple', fox: 'orange', owl: 'yellow', frog: 'green', bunny: 'blue', cat: 'red', penguin: 'blue' };

const AG = Animated.createAnimatedComponent(G);
const AE = Animated.createAnimatedComponent(Ellipse);
const out = Easing.bezier(0.23, 1, 0.32, 1);
const native = false; // SVG props are not native-driven
const go = (v, to, ms, easing = out) => Animated.timing(v, { toValue: to, duration: ms, easing, useNativeDriver: native });
const seq = Animated.sequence;
const par = Animated.parallel;

// What the face does for each gesture / mood.
const FACE = { cheer: 'grin', pump: 'grin', wave: 'grin', oops: 'frown', tilt: 'happy', offer: 'happy', curious: 'o', calm: 'happy' };
const MOOD_FACE = { listen: 'o', think: 'flat', speak: 'speak', sad: 'frown', idle: 'happy' };
const SMILE_EYES = { cheer: 0.3, pump: 0.4, wave: 0.55, calm: 0.5 };

export default function Mascot({ kind, size = 56, head = false, live = false, mood = 'idle', gesture = null, style }) {
  const portal = usePortal();
  const reduced = useReducedMotion();
  const key = SPEC[kind] ? kind : SPEC[portal.mascot] ? portal.mascot : 'cactus';
  const spec = SPEC[key];
  const body = spec.tone ? Colors.accent[spec.tone].solid : spec.fill || (Colors.mode === 'dark' ? '#E3EAEE' : '#DCE5EA');
  const ink = Colors.ink;
  const white = '#FFFFFF';
  const box = head ? { x: 8, y: spec.top, w: 104, h: 98 - spec.top } : { x: 0, y: 0, w: 120, h: 120 };

  // Animated pose. All of it rests at 0 / 1.
  const v = useRef({
    lid: new Animated.Value(1), lookX: new Animated.Value(0), lookY: new Animated.Value(0),
    mouth: new Animated.Value(0), armL: new Animated.Value(0), armR: new Animated.Value(0),
    swayL: new Animated.Value(0), swayR: new Animated.Value(0),
    y: new Animated.Value(0), rot: new Animated.Value(0), sx: new Animated.Value(1), sy: new Animated.Value(1),
  }).current;
  const [face, setFace] = useState('happy');
  const run = useRef(null);

  const rest = (ms = 220) =>
    par([
      go(v.lid, 1, ms), go(v.lookX, 0, ms), go(v.lookY, 0, ms), go(v.mouth, 0, ms),
      go(v.armL, 0, ms), go(v.armR, 0, ms), go(v.y, 0, ms), go(v.rot, 0, ms), go(v.sx, 1, ms), go(v.sy, 1, ms),
    ]);

  // Persistent mood: look, tilt and face while it lasts.
  useEffect(() => {
    if (!live) return undefined;
    setFace(MOOD_FACE[mood] || 'happy');
    if (reduced) return undefined;
    let loop;
    if (mood === 'listen') {
      par([go(v.rot, -4, 260), go(v.lid, 1.15, 260), go(v.y, -2, 260)]).start();
    } else if (mood === 'think') {
      par([go(v.rot, 5, 300), go(v.lookX, 2.2, 300), go(v.lookY, -2.4, 300), go(v.armR, 8, 300)]).start();
    } else if (mood === 'sad') {
      par([go(v.rot, -3, 320), go(v.armL, 14, 320), go(v.armR, -14, 320), go(v.lid, 0.82, 320), go(v.y, 2, 320)]).start();
    } else if (mood === 'speak') {
      loop = Animated.loop(seq([go(v.mouth, 1, 140), go(v.mouth, 0.25, 130), go(v.mouth, 0.8, 120), go(v.mouth, 0, 150)]));
      loop.start();
    } else {
      rest().start();
    }
    return () => { if (loop) loop.stop(); };
  }, [mood, live, reduced, v]);

  // One-off gestures.
  useEffect(() => {
    if (!live || !gesture) return undefined;
    const name = gesture.name;
    setFace(FACE[name] || 'happy');
    let timer;
    const done = () => {
      timer = setTimeout(() => setFace(MOOD_FACE[mood] || 'happy'), 0);
    };
    if (reduced) {
      timer = setTimeout(() => setFace(MOOD_FACE[mood] || 'happy'), 1400);
      return () => clearTimeout(timer);
    }
    const smile = SMILE_EYES[name];
    const jump = (h = 9) => seq([par([go(v.sy, 0.93, 90), go(v.sx, 1.05, 90)]), par([go(v.y, -h, 170), go(v.sy, 1.04, 170), go(v.sx, 0.98, 170)]), par([go(v.y, 0, 150), go(v.sy, 0.95, 120), go(v.sx, 1.04, 120)]), par([go(v.sy, 1, 130), go(v.sx, 1, 130)])]);
    const pose = {
      // Anticipate (arm drops a touch), then wave through three swings, settle.
      wave: seq([go(v.armR, -8, 120), go(v.armR, 24, 150), go(v.armR, -6, 150), go(v.armR, 24, 150), go(v.armR, -6, 150), go(v.armR, 0, 220)]),
      cheer: seq([par([go(v.armL, 8, 100), go(v.armR, -8, 100)]), par([go(v.armL, -24, 170), go(v.armR, 24, 170), jump(10)]), par([go(v.armL, -8, 160), go(v.armR, 8, 160)]), par([go(v.armL, -24, 150), go(v.armR, 24, 150), jump(7)]), rest(260)]),
      pump: seq([go(v.armR, -10, 110), par([go(v.armR, 28, 150), jump(6)]), go(v.armR, 0, 260)]),
      offer: seq([par([go(v.armL, -14, 260), go(v.armR, 14, 260), go(v.rot, -3, 260), go(v.y, 1, 260)]), Animated.delay(800), rest(280)]),
      tilt: seq([par([go(v.rot, 7, 280), go(v.lookX, 2.4, 280), go(v.lookY, -2.4, 280)]), Animated.delay(900), rest(300)]),
      curious: seq([go(v.lookX, -2.6, 200), Animated.delay(280), go(v.lookX, 2.6, 260), Animated.delay(280), par([go(v.rot, 4, 220), go(v.lookX, 0, 220)]), Animated.delay(300), rest(260)]),
      calm: seq([par([go(v.lid, 0.08, 380), go(v.armL, 5, 380), go(v.armR, -5, 380)]), Animated.delay(160), par([go(v.lid, 1, 420), go(v.armL, 0, 420), go(v.armR, 0, 420)])]),
      oops: seq([par([go(v.rot, -5, 200), go(v.armL, 16, 260), go(v.armR, -16, 260), go(v.y, 3, 260), go(v.lid, 0.8, 200)]), Animated.delay(950), rest(320)]),
    }[name];
    if (smile) go(v.lid, smile, 140).start();
    if (run.current) run.current.stop();
    run.current = pose || null;
    if (pose) pose.start(() => { if (smile) go(v.lid, 1, 200).start(); done(); });
    return () => { if (run.current) run.current.stop(); clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gesture && gesture.id, live, reduced]);

  // Ambient: blink every few seconds, hands sway slightly.
  useEffect(() => {
    if (!live || reduced) return undefined;
    let t;
    const blink = () => {
      t = setTimeout(() => {
        seq([go(v.lid, 0.08, 70), go(v.lid, 1, 110)]).start(blink);
      }, 2600 + Math.random() * 2600);
    };
    blink();
    const sway = Animated.loop(
      seq([par([go(v.swayL, 2.5, 2200, Easing.inOut(Easing.sin)), go(v.swayR, -2.5, 2200, Easing.inOut(Easing.sin))]), par([go(v.swayL, -1, 2200, Easing.inOut(Easing.sin)), go(v.swayR, 1, 2200, Easing.inOut(Easing.sin))])])
    );
    sway.start();
    return () => { clearTimeout(t); sway.stop(); };
  }, [live, reduced, v]);

  const rotL = useMemo(() => Animated.add(v.armL, v.swayL), [v]);
  const rotR = useMemo(() => Animated.add(v.armR, v.swayR), [v]);

  const eyes = (
    <>
      {spec.eyes.map(([x, y, r], i) => (
        <AE key={i} cx={Animated.add(x, v.lookX)} cy={Animated.add(y, v.lookY)} rx={r} ry={Animated.multiply(v.lid, r)} fill={ink} />
      ))}
    </>
  );

  const m = spec.mouth;
  const mouth = m ? (
    face === 'speak' ? (
      <AE cx={60} cy={m.y + 3} rx={m.w * 0.5} ry={Animated.add(1.2, Animated.multiply(v.mouth, m.w * 0.55))} fill={ink} />
    ) : face === 'grin' ? (
      <Path d={`M${60 - m.w * 1.15} ${m.y} Q60 ${m.y + m.w * 1.7} ${60 + m.w * 1.15} ${m.y} Z`} fill={ink} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
    ) : face === 'o' ? (
      <Ellipse cx={60} cy={m.y + 3} rx={m.w * 0.38} ry={m.w * 0.5} fill={ink} />
    ) : face === 'flat' ? (
      <Path d={`M${60 - m.w * 0.55} ${m.y + 3} H${60 + m.w * 0.55}`} stroke={ink} strokeWidth={3.2} strokeLinecap="round" />
    ) : face === 'frown' ? (
      <Path d={`M${60 - m.w} ${m.y + 5} Q60 ${m.y - m.w * 0.4 + 2} ${60 + m.w} ${m.y + 5}`} stroke={ink} strokeWidth={3.2} strokeLinecap="round" fill="none" />
    ) : (
      <Path d={`M${60 - m.w} ${m.y} Q60 ${m.y + m.w} ${60 + m.w} ${m.y}`} stroke={ink} strokeWidth={3.2} strokeLinecap="round" fill="none" />
    )
  ) : null;

  const svg = (
    <Svg
      width={size}
      height={size * (box.h / box.w)}
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      aria-hidden="true"
      style={live ? { overflow: 'visible' } : undefined}
    >
      {/* Features that sit behind the head */}
      {key === 'bear' && (
        <>
          <Circle cx={38} cy={36} r={12} fill={body} />
          <Circle cx={82} cy={36} r={12} fill={body} />
          <Circle cx={38} cy={36} r={5.5} fill={white} fillOpacity={0.4} />
          <Circle cx={82} cy={36} r={5.5} fill={white} fillOpacity={0.4} />
        </>
      )}
      {key === 'fox' && (
        <>
          <Path d="M34 44 L36 10 L58 34 Z" fill={body} strokeLinejoin="round" stroke={body} strokeWidth={4} />
          <Path d="M86 44 L84 10 L62 34 Z" fill={body} strokeLinejoin="round" stroke={body} strokeWidth={4} />
          <Path d="M40 36 L40 20 L50 32 Z" fill={ink} fillOpacity={0.55} />
          <Path d="M80 36 L80 20 L70 32 Z" fill={ink} fillOpacity={0.55} />
        </>
      )}
      {key === 'owl' && (
        <>
          <Path d="M34 42 L33 14 L56 33 Z" fill={body} stroke={body} strokeWidth={4} strokeLinejoin="round" />
          <Path d="M86 42 L87 14 L64 33 Z" fill={body} stroke={body} strokeWidth={4} strokeLinejoin="round" />
        </>
      )}
      {key === 'cat' && (
        <>
          <Path d="M33 44 L37 14 L57 33 Z" fill={body} stroke={body} strokeWidth={5} strokeLinejoin="round" />
          <Path d="M87 44 L83 14 L63 33 Z" fill={body} stroke={body} strokeWidth={5} strokeLinejoin="round" />
          <Path d="M39 36 L40 24 L49 33 Z" fill="#FFFFFF" fillOpacity={0.55} />
          <Path d="M81 36 L80 24 L71 33 Z" fill="#FFFFFF" fillOpacity={0.55} />
        </>
      )}
      {key === 'bunny' && (
        <>
          <Ellipse cx={46} cy={24} rx={10} ry={26} fill={body} />
          <Ellipse cx={74} cy={24} rx={10} ry={26} fill={body} />
          <Ellipse cx={46} cy={26} rx={4.6} ry={17} fill={Colors.accent.red.solid} fillOpacity={0.4} />
          <Ellipse cx={74} cy={26} rx={4.6} ry={17} fill={Colors.accent.red.solid} fillOpacity={0.4} />
        </>
      )}

      {/* Arms, up and out. A thick round stroke is the whole arm and hand; each turns
          about its shoulder. */}
      <AG rotation={rotL} originX={40} originY={90}>
        <Path d="M40 90 H28 Q20 90 20 82 V54" stroke={body} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </AG>
      <AG rotation={rotR} originX={80} originY={90}>
        <Path d="M80 90 H92 Q100 90 100 82 V54" stroke={body} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </AG>

      {/* Body: one tall pill that rises out of the bottom edge. */}
      <Rect x={31} y={32} width={58} height={100} rx={29} fill={body} />

      {key === 'cactus' && <Rect x={40} y={48} width={5} height={26} rx={2.5} fill={white} fillOpacity={0.28} />}

      {key === 'bear' && (
        <>
          <Ellipse cx={60} cy={79} rx={15} ry={11} fill={white} fillOpacity={0.45} />
          <Ellipse cx={60} cy={74} rx={4.6} ry={3.4} fill={ink} />
        </>
      )}
      {key === 'fox' && (
        <>
          <Path d="M31 78 Q60 68 89 78 V92 Q60 112 31 92 Z" fill={white} fillOpacity={0.92} />
          <Ellipse cx={60} cy={77} rx={4.4} ry={3.2} fill={ink} />
        </>
      )}
      {key === 'owl' && (
        <>
          <Circle cx={47} cy={67} r={12.5} fill={white} />
          <Circle cx={73} cy={67} r={12.5} fill={white} />
          <Polygon points="54,80 66,80 60,91" fill={Colors.accent.orange.solid} stroke={Colors.accent.orange.solid} strokeWidth={3} strokeLinejoin="round" />
        </>
      )}
      {key === 'penguin' && (
        <>
          <Ellipse cx={60} cy={92} rx={22} ry={34} fill="#FFFFFF" />
          <Circle cx={50} cy={64} r={6.5} fill="#FFFFFF" />
          <Circle cx={70} cy={64} r={6.5} fill="#FFFFFF" />
          <Polygon points="53,74 67,74 60,84" fill={Colors.accent.orange.solid} stroke={Colors.accent.orange.solid} strokeWidth={3} strokeLinejoin="round" />
        </>
      )}
      {key === 'frog' && (
        <>
          <Circle cx={43} cy={40} r={14} fill={body} />
          <Circle cx={77} cy={40} r={14} fill={body} />
          <Circle cx={43} cy={40} r={9} fill={white} />
          <Circle cx={77} cy={40} r={9} fill={white} />
          <Ellipse cx={40} cy={80} rx={6} ry={4} fill={Colors.accent.red.solid} fillOpacity={0.35} />
          <Ellipse cx={80} cy={80} rx={6} ry={4} fill={Colors.accent.red.solid} fillOpacity={0.35} />
        </>
      )}
      {key === 'bunny' && <Ellipse cx={60} cy={76} rx={3.6} ry={2.8} fill={Colors.accent.red.solid} />}
      {key === 'cat' && <Polygon points="56,75 64,75 60,80" fill={ink} stroke={ink} strokeWidth={2} strokeLinejoin="round" />}

      {eyes}
      {mouth}

      {key === 'cat' && <Path d="M36 76 H22 M36 83 L23 88 M84 76 H98 M84 83 L97 88" stroke={ink} strokeOpacity={0.55} strokeWidth={2.4} strokeLinecap="round" />}
    </Svg>
  );

  if (!live) return <View style={style}>{svg}</View>;

  // Live: the drawing may swing past its own box (arms, ears, a tilt, a jump), so the SVG
  // draws outside its viewBox. A fixed outer box clips only the bottom edge, flat and
  // level, so the character still seems to rise out of the surface it stands on while the
  // inner copy rotates about that line.
  const h = size * (box.h / box.w);
  return (
    <View style={[style, { width: size, height: h }, Platform.select({ web: { clipPath: 'inset(-400px -400px 0px -400px)' } })]}>
      <Animated.View
        style={{
          width: size,
          height: h,
          transform: [{ translateY: v.y }, { rotate: v.rot.interpolate({ inputRange: [-30, 30], outputRange: ['-30deg', '30deg'] }) }, { scaleX: v.sx }, { scaleY: v.sy }],
          ...Platform.select({ web: { transformOrigin: '50% 100%' } }),
        }}
      >
        {svg}
      </Animated.View>
    </View>
  );
}
