import { art } from '../kit.ts';
import { drawStone } from './_stone.ts';

/** Flying stone debris — tall tilted shard. */
export default art({
  name: 'stone-b',
  w: 320,
  h: 240,
  draw: () =>
    drawStone({
      seed: 302,
      verts: [
        [58, 156], // 0
        [96, 74], // 1
        [152, 18], // 2
        [204, 36], // 3
        [256, 96], // 4
        [276, 148], // 5
        [238, 206], // 6
        [150, 224], // 7
        [74, 212], // 8
        [138, 104], // 9
        [198, 132], // 10
      ],
      outline: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      faces: [
        { v: [0, 1, 2, 3, 9], kind: 'top', angle: 0 },
        { v: [0, 9, 10, 7, 8], kind: 'mid', angle: 72 },
        { v: [9, 3, 4, 10], kind: 'mid', angle: 120 },
        { v: [10, 4, 5, 6, 7], kind: 'dark', angle: 55 },
      ],
      cracks: [
        [
          [120, 50],
          [112, 72],
          [124, 86],
          [108, 112],
        ],
        [
          [96, 150],
          [114, 170],
          [106, 190],
        ],
      ],
    }),
});
