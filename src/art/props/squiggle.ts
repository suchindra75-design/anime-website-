import { art } from '../kit.ts';

/** Hand-drawn art-nouveau flourish placed between two nav links. Monoline currentColor. */
export default art({
  name: 'squiggle',
  w: 160,
  h: 60,
  draw: () =>
    `<path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="` +
    'M20 30C14 26 8 30 10 36C12 42 20 42 24 36C30 28 40 26 50 34C60 42 72 46 79 36C86 25 76 14 68 22C60 30 70 46 92 43' +
    'C112 40 124 22 140 22C150 22 154 30 148 35C143 39 137 34 141 29' +
    `"/>`,
});
