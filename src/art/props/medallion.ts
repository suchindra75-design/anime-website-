import { art, id, type Pt } from '../kit.ts';

/**
 * Brand medallion — monoline stroke art in currentColor (recoloured by CSS).
 * A robed saint with a radiant halo pours from a tiny bottle into a coupe,
 * set in a stained-glass rose of lead lines. Outer ring r190 + inner r178.
 */

const C = 200;
const HEAD: Pt = [200, 108];
const R_IN = 178;

const f = (n: number) => (Math.round(n * 10) / 10).toString();

/** The figure is drawn with its head at (200,100) and placed by this transform. */
const FIG_SCALE = 0.96;
const FIG_T = `translate(${HEAD[0]} ${HEAD[1]}) scale(${FIG_SCALE}) translate(-200 -100)`;

export default art({
  name: 'medallion',
  w: 400,
  h: 400,
  draw: () => {
    const [hx, hy] = HEAD;

    // ------------------------------------------------------------ figure
    // robe silhouette (also the knock-out for the lead lines)
    const robe =
      'M190 128C182 131 172 134 167 142' + // left shoulder
      'C160 158 156 186 152 214C148 236 144 252 147 266' + // left sleeve outer edge to its tip
      'C150 290 144 320 136 352' + // robe left side
      'C150 358 160 352 172 357C184 362 192 355 202 360C212 364 222 355 234 358C246 361 254 356 264 352' + // hem
      'C258 320 252 292 254 266' + // robe right side
      'C258 250 254 232 250 212C246 188 242 160 234 142' + // right sleeve outer edge
      'C228 134 218 131 210 128';

    let fig = '';
    fig += `<path d="${robe}"/>`;
    // collar
    fig += '<path d="M190 128Q200 142 210 128"/>';
    // left sleeve: hanging inner edge sweeping up to the cuff, trim band
    fig += '<path d="M147 266C164 262 178 248 184 228"/>';
    fig += '<path d="M154 254C166 250 175 242 179 232"/>';
    fig += '<path d="M184 228C180 222 179 214 182 208"/>';
    // right sleeve (forearm raised): long hanging edge up to a higher cuff
    fig += '<path d="M254 266C240 256 234 232 233 210C232 196 230 188 227 182"/>';
    fig += '<path d="M245 255C238 246 236 230 236 214"/>';
    fig += '<path d="M227 183C232 179 238 177 242 179"/>';
    // waist cord with a hanging tie
    fig += '<path d="M187 240Q201 246 216 239"/>';
    fig += '<path d="M200 244C197 258 202 272 198 290"/>';
    // robe folds sweeping out to the hem
    fig += '<path d="M190 248C187 276 182 304 175 330"/>';
    fig += '<path d="M211 248C214 276 219 304 226 331"/>';
    fig += '<path d="M201 298C202 310 202 320 201 331"/>';
    fig += '<path d="M153 286C157 300 159 314 158 327"/>';
    fig += '<path d="M247 286C243 300 242 314 243 327"/>';
    fig += '<path d="M172 344L170 356M202 346L202 360M232 344L234 357"/>';
    // two trim bands above the hem
    fig += '<path d="M140 330C170 340 230 340 261 330"/><path d="M139 340C170 350 230 350 262 340"/>';
    // bare feet
    fig += '<path d="M187 361Q192 368 199 364"/><path d="M203 365Q209 369 214 362"/>';

    // head (slightly tilted towards the glass) and long hair
    fig += '<path d="M188 100C188 112 193 120 200 120C207 120 212 112 212 100"/>';
    fig += '<path d="M200 79C190 79 184 88 185 100C186 112 182 124 178 132C174 142 172 156 174 170C175 178 172 186 168 192"/>';
    fig += '<path d="M200 79C210 79 216 88 215 100C214 112 218 124 222 132C223 134 224 136 224 138"/>';
    fig += '<path d="M200 79C195 85 190 92 189 100"/><path d="M200 79C205 85 210 92 211 100"/>';
    fig += '<path d="M189 110C188 124 184 138 182 152"/><path d="M211 110C212 120 213 128 215 134"/>';
    fig += '<g stroke-width="2.6"><path d="M191.5 100Q194.5 102.5 197.5 100"/><path d="M202.5 100Q205.5 102.5 208.5 100"/><path d="M200 103L199 109.5L201 110"/><path d="M197 114.5Q200 116 203 114.5"/></g>';
    // neck
    fig += '<path d="M196 121L196 128M204 121L204 128"/>';

    // coupe glass held at the chest
    fig += '<path d="M176 198Q192 218 208 198Z"/>';
    fig += '<path d="M192 208L192 222M184 225Q192 220 200 225"/>';
    // left hand cupping the stem (fingers emerging from the cuff)
    fig += '<path d="M182 212C186 214 188 217 188 220C190 222 193 222 195 219"/>';
    // tiny bottle, tilted, pouring; its base end is hidden in the right fist
    const bottle =
      'M-3.5 -5L-3.5 5M3.5 -5L3.5 5M-4.5 -5L4.5 -5' + // neck + lip
      'M-3.5 5C-3.5 9 -7.5 9 -7.5 13L-7.5 24M3.5 5C3.5 9 7.5 9 7.5 13L7.5 24' + // shoulders + body
      'M-7.5 17L7.5 17' + // label edge
      'M-10 24L10 24C12 24 12 26 12 28L12 34C12 38 10 40 6 40L-6 40C-10 40 -12 38 -12 34L-12 28C-12 26 -12 24 -10 24Z' + // fist
      'M-12 30L-6 30M-12 35L-6 35'; // finger creases
    fig += `<path transform="translate(206 180) rotate(-148)" d="${bottle}"/>`;
    // pour stream into the bowl
    fig += '<path d="M202.5 183C199 188 197 192 197 198"/>';
    // right forearm from the fist down into the raised sleeve's cuff
    fig += '<path d="M220 160C223 168 225 175 227 183M232 156C236 164 239 172 242 179"/>';

    // ------------------------------------------------------------ halo
    let halo = '<path d="M174 115A30 30 0 1 1 226 115"/>';
    let rays = '';
    const NR = 23;
    for (let i = 0; i < NR; i++) {
      const a = ((-205 + (230 * i) / (NR - 1)) * Math.PI) / 180;
      const r0 = 37;
      const r1 = i % 2 === 0 ? 62 : 51;
      rays += `M${f(200 + Math.cos(a) * r0)} ${f(100 + Math.sin(a) * r0)}L${f(200 + Math.cos(a) * r1)} ${f(100 + Math.sin(a) * r1)}`;
    }
    halo += `<path d="${rays}"/>`;

    // ------------------------------------------------------------ stained-glass leads
    // gently curved radials from the halo out to a border band of panes
    const BAND = 158;
    const toBand = (a: number) => {
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const ox = hx - C;
      const oy = hy - C;
      const b = ox * dx + oy * dy;
      const c = ox * ox + oy * oy - BAND * BAND;
      return -b + Math.sqrt(b * b - c);
    };
    let leads = '';
    const NRAD = 20;
    for (let i = 0; i < NRAD; i++) {
      const a = -Math.PI / 2 + ((i + 0.5) / NRAD) * Math.PI * 2;
      const r0 = 74;
      const r1 = toBand(a);
      if (r1 - r0 < 24) continue; // above the halo the rays take over
      const p0: Pt = [hx + Math.cos(a) * r0, hy + Math.sin(a) * r0];
      const p1: Pt = [hx + Math.cos(a) * r1, hy + Math.sin(a) * r1];
      const bend = (r1 - r0) * 0.07 * (i % 2 === 0 ? 1 : -1);
      const m: Pt = [(p0[0] + p1[0]) / 2 - Math.sin(a) * bend, (p0[1] + p1[1]) / 2 + Math.cos(a) * bend];
      leads += `M${f(p0[0])} ${f(p0[1])}Q${f(m[0])} ${f(m[1])} ${f(p1[0])} ${f(p1[1])}`;
    }
    // border band: panes divided by short arcs
    const NB = 28;
    for (let i = 0; i < NB; i++) {
      const a = (i / NB) * Math.PI * 2;
      const a2 = a + 0.06;
      leads += `M${f(C + Math.cos(a) * BAND)} ${f(C + Math.sin(a) * BAND)}Q${f(C + Math.cos(a2) * 169)} ${f(C + Math.sin(a2) * 169)} ${f(C + Math.cos(a) * 180)} ${f(C + Math.sin(a) * 180)}`;
    }
    leads = `<path d="${leads}"/><circle cx="${hx}" cy="${hy}" r="112"/><circle cx="${C}" cy="${C}" r="${BAND}"/>`;

    const mid = id('medallion-knock');
    const knock =
      `<mask id="${mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400">` +
      `<circle cx="${C}" cy="${C}" r="${R_IN - 2}" fill="#fff"/>` +
      `<g fill="#000" stroke="#000" stroke-width="8" stroke-linejoin="round" transform="${FIG_T}">` +
      `<path d="${robe}Z"/>` +
      `<path d="M184 354h34v18h-34Z"/>` +
      `</g></mask>`;

    return (
      knock +
      `<g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">` +
      `<circle cx="${C}" cy="${C}" r="190" stroke-width="5"/>` +
      `<circle cx="${C}" cy="${C}" r="${R_IN}"/>` +
      `<g mask="url(#${mid})" stroke-width="3.4">` +
      leads +
      `</g>` +
      `<g transform="${FIG_T}">` +
      halo +
      fig +
      `</g>` +
      `</g>`
    );
  },
});
