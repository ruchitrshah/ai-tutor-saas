// Plays a small Lottie spark burst, once, each time `play` turns true (a card being
// hovered). It never intercepts the pointer, sits over the card's top-right corner, and
// is skipped under reduced motion. Lottie runs off lottie-web's SVG renderer.
import React, { useEffect, useMemo, useRef } from 'react';
import lottie from 'lottie-web';

import { useReducedMotion } from '../brand';
import { sparkBurst } from './sparkData';

export default function LottieBurst({ play, colors, size = 140, style }) {
  const reduced = useReducedMotion();
  const box = useRef(null);
  const anim = useRef(null);
  const data = useMemo(() => sparkBurst(colors), [colors.join(',')]);

  useEffect(() => {
    if (reduced || !box.current) return undefined;
    anim.current = lottie.loadAnimation({
      container: box.current,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData: data,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });
    return () => { anim.current?.destroy(); anim.current = null; };
  }, [data, reduced]);

  useEffect(() => {
    if (play && anim.current) anim.current.goToAndPlay(0, true);
  }, [play]);

  if (reduced) return null;
  return (
    <div
      ref={box}
      aria-hidden="true"
      style={{ position: 'absolute', right: 6, top: 0, width: size, height: size, pointerEvents: 'none', zIndex: 2, ...style }}
    />
  );
}
