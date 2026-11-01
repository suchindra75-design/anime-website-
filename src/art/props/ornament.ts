import { art } from '../kit.ts';

/**
 * Tiny vertical art-nouveau ornament: a slender haloed saint statuette
 * flanked by whiplash vine scrolls. Monoline currentColor, for dividers.
 */
export default art({
  name: 'ornament',
  w: 120,
  h: 240,
  draw: () => {
    let d = '';
    // halo + head
    d += '<path d="M47 40A17 17 0 1 1 73 40"/>';
    d += '<ellipse cx="60" cy="30" rx="6" ry="7.5"/>';
    // long hair falling to the shoulders
    d += '<path d="M54 28C51 36 50 44 48 52M66 28C69 36 70 44 72 52"/>';
    // slender robe (vesica) with folded arms and a centre fold
    d += '<path d="M60 48C48 50 42 62 43 84C44 116 52 160 60 196C68 160 76 116 77 84C78 62 72 50 60 48Z"/>';
    d += '<path d="M46 66Q60 84 74 66"/>';
    d += '<path d="M60 84L60 176"/>';
    // whiplash vines curling out of the robe
    d += '<path d="M45 108C32 110 18 102 18 88C18 78 28 74 34 80C39 85 35 92 30 90"/>';
    d += '<path d="M75 108C88 110 102 102 102 88C102 78 92 74 86 80C81 85 85 92 90 90"/>';
    d += '<path d="M51 150C40 154 30 164 32 176C34 184 44 184 44 177"/>';
    d += '<path d="M69 150C80 154 90 164 88 176C86 184 76 184 76 177"/>';
    // pedestal and drop finial
    d += '<path d="M42 204Q60 214 78 204"/>';
    d += '<path d="M60 210L60 222"/>';
    d += '<path d="M60 224C56 230 56 236 60 236C64 236 64 230 60 224Z"/>';
    return `<g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${d}</g>`;
  },
});
