// A Lottie animation, written as data (no file, no asset): a burst of small sparks that
// fly outward from the centre, turn and fade. 160x160, 60fps, about half a second.
// Colours are passed in as hex so each card's burst matches its own accent.
const rgb = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).concat(1);
};

const DIRS = [
  [80, 18], [126, 34], [144, 80], [126, 126], [80, 142], [34, 126], [16, 80], [34, 34],
  [108, 26], [134, 58], [134, 102], [108, 134], [52, 134], [26, 102], [26, 58], [52, 26],
];

export function sparkBurst(colors) {
  const palette = colors.map(rgb);
  return {
    v: '5.7.4',
    fr: 60,
    ip: 0,
    op: 48,
    w: 160,
    h: 160,
    nm: 'Spark burst',
    ddd: 0,
    assets: [],
    layers: DIRS.map((end, i) => {
      const delay = (i % 4) * 2;
      const size = i < 8 ? 9 : 6;
      return {
        ddd: 0,
        ind: i + 1,
        ty: 4,
        nm: `Spark ${i + 1}`,
        sr: 1,
        ks: {
          o: { a: 1, k: [{ t: delay, s: [0] }, { t: delay + 5, s: [100] }, { t: delay + 34, s: [0] }] },
          r: { a: 0, k: 0 },
          p: { a: 1, k: [{ t: delay, s: [80, 80, 0] }, { t: delay + 34, s: [end[0], end[1], 0] }] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 1, k: [{ t: delay, s: [40, 40, 100] }, { t: delay + 8, s: [100, 100, 100] }, { t: delay + 34, s: [55, 55, 100] }] },
        },
        ao: 0,
        shapes: [
          { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [size, size] }, d: 1, nm: 'Dot' },
          { ty: 'fl', c: { a: 0, k: palette[i % palette.length] }, o: { a: 0, k: 100 }, r: 1, bm: 0, nm: 'Fill' },
          { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
        ],
        ip: 0,
        op: 48,
        st: 0,
        bm: 0,
      };
    }),
  };
}
