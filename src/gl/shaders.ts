/**
 * GLSL programs for the illustration "plates".
 *
 * Every plate shares the same vertex shader and a set of common uniforms
 * (clip rect, melt in/out, opacity, time). Each `program` adds its own
 * fragment body. Colours are authored in sRGB and passed straight through.
 */

export const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const common = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uSize;      // plate size in CSS px
uniform float uDpr;
uniform vec4 uClip;      // device-px clip rect in gl_FragCoord space (x0, y0, x1, y1)
uniform float uOpacity;
uniform float uIn;       // 0 -> 1 melt in (content drips into place)
uniform float uOut;      // 0 -> 1 melt out (content drips away)
uniform float uSeed;

float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}

void applyClip() {
  vec2 fc = gl_FragCoord.xy;
  if (fc.x < uClip.x || fc.y < uClip.y || fc.x > uClip.z || fc.y > uClip.w) discard;
}

// Vertical "melt": columns of pixels slide with per-column noise, leaving
// paint-drip streaks. Returns (sample uv, alpha multiplier).
vec3 melt(vec2 uv) {
  if (uIn >= 0.999 && uOut <= 0.001) return vec3(uv, 1.0);
  float col = floor(uv.x * uSize.x / 3.0);
  float n = 0.5 * hash11(col + uSeed * 17.0) + 0.5 * vnoise(vec2(col * 0.045 + uSeed * 3.1, 0.5));
  float yTop = 1.0 - uv.y;
  float a = 1.0;
  float src = yTop;

  float sIn = (1.0 - uIn) * (1.25 + n * 0.9);
  src += sIn;
  if (src > 1.0) {
    float streak = (1.0 - uIn) * (0.06 + 0.35 * n) + 1e-4;
    a *= 1.0 - smoothstep(0.0, streak, src - 1.0);
    src = 1.0;
  }

  float o = pow(uOut, 1.6);
  float sOut = o * (1.25 + n * 0.9);
  src -= sOut;
  if (src < 0.0) {
    float streak = (0.1 + 0.6 * n) * min(1.0, uOut * 2.0) + 1e-4;
    a *= 1.0 - smoothstep(0.0, streak, -src);
    src = 0.0;
  }
  return vec3(uv.x, 1.0 - src, a);
}
`;

/** Textured ink illustration with line boil, accent recolouring and fill masking. */
const art = /* glsl */ `
${common}
uniform sampler2D uMap;
uniform vec4 uUvRect;     // xy offset, zw scale (cover fit)
uniform vec3 uAccent;
uniform float uBoil;
uniform float uDim;
uniform float uShake;
uniform float uLoaded;
uniform float uFill;      // 0..1 liquid fill level for ACCENT areas
uniform vec3 uFillBox;    // x: top y (uv, y-down), y: bottom y, z: enabled
uniform float uFlash;     // whiten

void main() {
  applyClip();
  vec3 m = melt(vUv);
  vec2 uv = m.xy;

  // Line boil: tiny stepped wobble like re-inked animation frames.
  float t = floor(uTime * 7.0);
  vec2 bo = vec2(vnoise(uv * 7.0 + t * 1.73), vnoise(uv * 7.0 + t * 1.73 + 19.3)) - 0.5;
  uv += bo * uBoil * 2.2 / max(uSize, vec2(1.0));

  // Shimmer / vibration
  uv.x += sin(uTime * 55.0 + uv.y * 24.0) * uShake * 0.0035;

  vec2 tuv = uUvRect.xy + uv * uUvRect.zw;
  vec4 c = texture2D(uMap, tuv);
  c.rgb /= max(c.a, 1e-4);   // textures are uploaded premultiplied

  // ACCENT (#ff00ff) unmixing: c = a * magenta + grey.
  float acc = clamp(min(c.r, c.b) - c.g, 0.0, 1.0);
  if (uFillBox.z > 0.5) {
    float yDown = 1.0 - tuv.y;
    float level = mix(uFillBox.y, uFillBox.x, uFill);
    float wave = sin(tuv.x * 40.0 + uTime * 6.0) * 0.004 * uFill * (1.0 - uFill);
    float empty = smoothstep(level - 0.004, level + 0.004, yDown + wave);
    empty = 1.0 - empty;
    c.rgb = c.rgb - acc * vec3(1.0, 0.0, 1.0) + acc * mix(uAccent, vec3(0.97), empty);
    c.a *= 1.0 - acc * empty * 0.7;
  } else {
    c.rgb = c.rgb - acc * vec3(1.0, 0.0, 1.0) + acc * uAccent;
  }

  float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  c.rgb = mix(c.rgb, vec3(lum) * 0.55 + 0.05, uDim);
  c.rgb = mix(c.rgb, vec3(1.0), uFlash);

  gl_FragColor = vec4(c.rgb, c.a * m.z * uOpacity * uLoaded);
}
`;

/** Flat colour block (section backgrounds) — still melts. */
const solid = /* glsl */ `
${common}
uniform vec3 uColor;
void main() {
  applyClip();
  vec3 m = melt(vUv);
  gl_FragColor = vec4(uColor, m.z * uOpacity);
}
`;

/** Screentone gradient panel background. */
const tone = /* glsl */ `
${common}
void main() {
  applyClip();
  vec3 m = melt(vUv);
  vec2 px = m.xy * uSize;
  float ang = 0.5236;
  mat2 rot = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
  vec2 g = rot * px / 7.0;
  vec2 cell = fract(g) - 0.5;
  float grad = smoothstep(0.1, 1.0, 1.0 - m.y) * 0.75 + fbm(px * 0.004 + 3.0) * 0.35 - 0.12;
  float r = clamp(grad, 0.0, 1.0) * 0.42;
  float d = length(cell);
  float dotMask = 1.0 - smoothstep(r - 0.06, r + 0.06, d);
  vec3 paper = vec3(0.937, 0.925, 0.894);
  vec3 ink = vec3(0.078, 0.071, 0.063);
  gl_FragColor = vec4(mix(paper, ink, dotMask), m.z * uOpacity);
}
`;

/** Hero background: slow-drifting dry-brush strokes on charcoal. */
const brush = /* glsl */ `
${common}
uniform vec2 uMouse;
void main() {
  applyClip();
  float aspect = uSize.x / max(uSize.y, 1.0);
  vec2 p = vec2(vUv.x * aspect, vUv.y) + uMouse * 0.02;
  float t = uTime * 0.025;

  float warp = fbm(p * 1.6 + vec2(t, -t));
  float band = fbm(vec2(p.x * 0.7 + t, p.y * 5.5 + warp * 1.8));
  float bristle = vnoise(vec2(p.x * 3.0 + t * 2.0, p.y * 160.0 + warp * 20.0));
  float stroke = smoothstep(0.5, 0.6, band) * (0.55 + 0.45 * bristle);

  float band2 = fbm(vec2(p.x * 1.1 - t * 0.8, p.y * 8.0 + 7.0 + warp));
  float bristle2 = vnoise(vec2(p.x * 2.0, p.y * 220.0 + 5.0));
  float dark = smoothstep(0.56, 0.64, band2) * (0.5 + 0.5 * bristle2);

  vec3 base = vec3(0.114);
  vec3 col = mix(base, vec3(0.19, 0.188, 0.183), stroke * 0.85);
  col = mix(col, vec3(0.075), dark * 0.85);
  float vig = smoothstep(1.2, 0.3, length((vUv - 0.5) * vec2(aspect, 1.0)));
  col *= 0.82 + 0.18 * vig;
  gl_FragColor = vec4(col, uOpacity);
}
`;

/** Rising ink splash that wipes the dark title to paper. */
const splash = /* glsl */ `
${common}
uniform float uProgress;
void main() {
  applyClip();
  float aspect = uSize.x / max(uSize.y, 1.0);
  vec2 p = vec2(vUv.x * aspect, 1.0 - vUv.y);   // y down
  float pr = uProgress;
  float level = mix(1.1, -0.5, pow(pr, 1.25));

  // Crest: gentle noisy waves, then round bulbous blobs merged on top
  // (smooth-min of circles) so the edge reads as thick splashed ink.
  float crest = (fbm(vec2(p.x * 2.2, 3.0 + pr * 0.6)) - 0.5) * 0.26;
  crest += (vnoise(vec2(p.x * 9.0, 1.0 + pr)) - 0.5) * 0.05;
  float sd = (level + crest) - p.y;                  // < 0 inside the mass
  float cx = aspect * 0.5;
  for (int i = 0; i < 9; i++) {
    float fi = float(i);
    float hx = hash11(fi * 7.3 + 1.0);
    float hy = hash11(fi * 3.1 + 5.0);
    float centre = 1.0 - abs(fi - 4.0) / 4.0;        // taller towards the middle
    vec2 c = vec2(cx + (fi - 4.0) * aspect * 0.075 + (hx - 0.5) * 0.06,
                  level + 0.03 - centre * centre * 0.1 - hy * 0.03);
    float r = 0.04 + 0.05 * hy + centre * 0.04;
    float k = 0.07;
    float cd = length(p - c) - r;
    float hh = clamp(0.5 + 0.5 * (cd - sd) / k, 0.0, 1.0);
    sd = mix(cd, sd, hh) - k * hh * (1.0 - hh);       // smooth union
  }
  float crest2 = sd;
  float aa = 1.5 / uSize.y;
  float mass = 1.0 - smoothstep(-aa, aa, crest2);

  // Droplets above the crest: blobby cells that rise with progress.
  float above = max(crest2, 0.0);                    // distance above the mass
  vec2 q = vec2(p.x * 7.0, p.y * 7.0 + pr * 5.0);
  vec2 cell = floor(q);
  vec2 f = fract(q) - 0.5;
  float h = hash12(cell + 11.0);
  vec2 off = (vec2(hash12(cell + 3.1), hash12(cell + 7.7)) - 0.5) * 0.6;
  float near = 1.0 - smoothstep(0.0, 0.32, above);
  float rad = (0.06 + 0.24 * h) * near * step(0.55, h) * step(0.0, above);
  float dropD = length((f - off) * vec2(1.0, 0.85)) - rad;
  float drop = 1.0 - smoothstep(-0.02, 0.02, dropD);

  // Secondary fine spray close to the crest
  vec2 q2 = vec2(p.x * 19.0, p.y * 19.0 + pr * 11.0);
  vec2 c2 = floor(q2);
  vec2 off2 = (vec2(hash12(c2 + 1.3), hash12(c2 + 8.1)) - 0.5) * 0.6;
  float h2 = hash12(c2 + 5.0);
  float near2 = 1.0 - smoothstep(0.02, 0.22, above);
  float r2 = 0.2 * near2 * step(0.86, h2) * step(0.01, above);
  float spray = 1.0 - smoothstep(-0.03, 0.03, length(fract(q2) - 0.5 - off2) - r2);

  float a = clamp(mass + drop + spray, 0.0, 1.0);
  gl_FragColor = vec4(vec3(0.937, 0.925, 0.894), a * uOpacity);
}
`;

/** Whirlwind of white dry-brush strokes around the floating saint. */
const vortex = /* glsl */ `
${common}
uniform float uSpin;
uniform float uPower;
uniform vec3 uAccent;
void main() {
  applyClip();
  float aspect = uSize.x / max(uSize.y, 1.0);
  vec2 p = (vUv - vec2(0.5, 0.48)) * vec2(aspect, 1.0);
  float r = length(p) + 1e-4;
  float ang = atan(p.y, p.x);
  float lr = log(r);
  float spin = uSpin + uTime * 0.08;
  // Logarithmic-spiral coordinates: strokes run along s = const.
  float s = ang - lr * 2.4 + spin;
  float t = lr;
  vec2 arm = vec2(cos(s), sin(s));

  // Broad arms (2 per turn) broken up by noise, plus dry-brush bristles.
  float arms = 0.5 + 0.5 * sin(s * 2.0 + fbm(arm * 1.3 + t * 0.6) * 3.0);
  float breakup = fbm(arm * 2.2 + vec2(t * 2.6 - uTime * 0.05, t * 1.3));
  // Bristles sampled on a circle so they wrap seamlessly around the centre.
  float bristle = vnoise(arm * 7.3 + vec2(t * 5.0, -t * 3.0));
  float bristle2 = vnoise(arm * 19.0 + vec2(3.0 + t * 9.0, t * 4.0));
  float body = arms * 0.55 + breakup * 0.6 + bristle * 0.18 + bristle2 * 0.1;

  float inner = smoothstep(0.06 - uPower * 0.03, 0.24, r);
  float outer = 1.0 - smoothstep(0.6 + uPower * 0.25, 1.15 + uPower * 0.3, r);
  float ring = inner * outer;
  float thr = mix(1.0, 0.8, uPower);
  float strokes = smoothstep(thr, thr + 0.035, body) * ring;
  // Tapered ends: thin out where the arm fades
  strokes *= smoothstep(0.25, 0.6, arms + breakup * 0.4);
  float tw = s;

  // White flecks thrown outward
  // Integer cells per turn keep the angular wrap on a cell boundary.
  vec2 fq = vec2(tw * 38.0 / 6.2831853, r * 20.0 - uTime * (0.6 + uPower * 2.0));
  float fh = hash12(vec2(mod(floor(fq.x), 38.0), floor(fq.y)));   // wrap-safe cell id
  float fleck = step(0.93 - uPower * 0.05, fh) * (1.0 - smoothstep(0.1, 0.35, length(fract(fq) - 0.5))) * ring;

  // Accent sparks
  vec2 sq = vec2(tw * 64.0 / 6.2831853, r * 34.0 - uTime * (1.0 + uPower * 3.0));
  float spark = step(0.994 - uPower * 0.012, hash12(vec2(mod(floor(sq.x), 64.0), floor(sq.y)) + 9.0)) * ring * (1.0 - smoothstep(0.15, 0.4, length(fract(sq) - 0.5)));

  vec3 col = vec3(0.06);
  col = mix(col, vec3(0.95, 0.94, 0.9), clamp(strokes + fleck, 0.0, 1.0));
  col = mix(col, uAccent, spark * 0.9);
  gl_FragColor = vec4(col, uOpacity);
}
`;

/** Pointer-driven smear for the hand scene surface. */
const smear = /* glsl */ `
${common}
uniform sampler2D uMap;
uniform sampler2D uTrail;
uniform vec4 uUvRect;
uniform float uLoaded;
uniform float uPower;
uniform float uBoil;

vec4 sampleArt(vec2 uv) {
  vec4 c = texture2D(uMap, uUvRect.xy + uv * uUvRect.zw);
  c.rgb /= max(c.a, 1e-4);   // textures are uploaded premultiplied
  return c;
}

void main() {
  applyClip();
  vec3 m = melt(vUv);
  vec2 uv = m.xy;
  float t = floor(uTime * 7.0);
  uv += (vec2(vnoise(uv * 6.0 + t), vnoise(uv * 6.0 + t + 7.0)) - 0.5) * uBoil * 2.0 / uSize;

  vec4 tr = texture2D(uTrail, uv);
  vec2 vel = (tr.rg - 0.5) * 2.0;
  float k = tr.b;
  vec4 acc = vec4(0.0);
  for (int i = 0; i < 8; i++) {
    float f = float(i) / 7.0;
    acc += sampleArt(uv - vel * k * (0.09 + uPower * 0.14) * f);
  }
  vec4 c = acc / 8.0;

  // Column stretch where the trail is strong (pixel-sort look)
  float col = floor(uv.x * uSize.x / 3.0);
  float n = hash11(col);
  vec4 stretched = sampleArt(vec2(uv.x, uv.y + k * n * 0.12));
  c = mix(c, stretched, smoothstep(0.25, 0.85, k) * 0.75);

  float glow = smoothstep(0.15, 0.95, k) * (0.55 + 0.45 * vnoise(uv * 24.0 + uTime * 0.7));
  c.rgb = mix(c.rgb, vec3(0.95, 0.19, 0.12), glow * (0.7 + uPower * 0.3));
  c.rgb += vec3(0.25, 0.04, 0.02) * uPower * (0.4 + 0.6 * vnoise(uv * 3.0 + uTime * 0.3));
  gl_FragColor = vec4(c.rgb, c.a * m.z * uOpacity * uLoaded);
}
`;

/** Pouring liquid stream (local uv: y = 1 at the bottle mouth). */
const stream = /* glsl */ `
${common}
uniform vec3 uAccent;
uniform float uFlow;   // how far the stream has travelled from the mouth (0..1)
uniform float uCut;    // stream detaches from the mouth (0..1)
void main() {
  applyClip();
  float y = 1.0 - vUv.y;           // 0 at mouth, 1 at glass
  float px = uSize.x;
  float wob = sin(y * 18.0 - uTime * 14.0) * 0.12 + sin(y * 7.0 - uTime * 9.0) * 0.08;
  float cx = 0.5 + wob * y * 0.6;
  float w = mix(0.46, 0.2, smoothstep(0.0, 0.6, y)) * (0.9 + 0.1 * sin(y * 40.0 - uTime * 20.0));
  float dx = abs(vUv.x - cx);
  float aa = 1.5 / px;
  float body = 1.0 - smoothstep(w * 0.5 - aa, w * 0.5 + aa, dx);
  float head = 1.0 - smoothstep(uFlow - 0.02, uFlow, y);
  float tail = smoothstep(uCut - 0.02, uCut, y);
  float a = body * head * tail;
  float rim = smoothstep(w * 0.5 - aa * 3.0, w * 0.5, dx);
  vec3 col = mix(uAccent, uAccent * 0.55, rim);
  float hl = 1.0 - smoothstep(0.0, w * 0.18, abs(vUv.x - (cx - w * 0.22)));
  col = mix(col, vec3(1.0), hl * 0.7);
  gl_FragColor = vec4(col, a * uOpacity);
}
`;

/**
 * Ink dripping from the previous section over the top of the next one.
 * uProgress (0..1) lengthens the drips as the boundary scrolls up.
 */
const drips = /* glsl */ `
${common}
uniform vec3 uColor;
uniform float uProgress;

float sdCapsuleV(vec2 p, float top, float bottom, float r) {
  p.y -= clamp(p.y, top, bottom);
  return length(p) - r;
}

void main() {
  applyClip();
  float aspect = uSize.x / max(uSize.y, 1.0);
  vec2 p = vec2(vUv.x * aspect, 1.0 - vUv.y);       // units of plate height, y down
  float grow = smoothstep(0.0, 1.0, uProgress);

  // Ragged lip along the top edge
  float lip = 0.05 + 0.05 * fbm(vec2(p.x * 2.4 + uSeed, 1.7)) + 0.015 * sin(p.x * 23.0 + uSeed);
  float sd = p.y - lip;

  // Drips: one candidate per column, merged into the lip with a smooth union
  float cw = 0.055;
  for (int k = -1; k <= 1; k++) {
    float ci = floor(p.x / cw) + float(k);
    float h = hash11(ci * 1.37 + uSeed * 11.0);
    float h2 = hash11(ci * 2.91 + 4.0 + uSeed);
    if (h < 0.35) continue;
    float cx = (ci + 0.5 + (h2 - 0.5) * 0.5) * cw;
    float r = cw * (0.12 + 0.22 * h2);
    float len = lip + (0.08 + 0.85 * pow(h, 3.0)) * (0.25 + 0.75 * grow);
    float wobble = 0.004 * sin(uTime * 1.3 + ci);
    float d = sdCapsuleV(vec2(p.x - cx, p.y), 0.0, len + wobble, r);
    // fat droplet at the tip
    d = min(d, length(vec2(p.x - cx, p.y - len - wobble - r * 0.4)) - r * 1.35);
    float kk = 0.03;
    float hh = clamp(0.5 + 0.5 * (d - sd) / kk, 0.0, 1.0);
    sd = mix(d, sd, hh) - kk * hh * (1.0 - hh);
  }
  float aa = 1.2 / uSize.y;
  float a = 1.0 - smoothstep(-aa, aa, sd);
  gl_FragColor = vec4(uColor, a * uOpacity);
}
`;

export const programs = { art, solid, tone, brush, splash, vortex, smear, stream, drips } as const;
export type ProgramName = keyof typeof programs;

/** Full-screen post pass: scroll-velocity streaking + film grain. */
export const postFragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D tScene;
uniform vec2 uRes;
uniform float uVel;
uniform float uTime;
uniform float uGrain;

float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }

void main() {
  vec2 uv = vUv;
  vec4 c = texture2D(tScene, uv);
  float speed = abs(uVel);
  if (speed > 0.0008) {
    float col = floor(uv.x * uRes.x / 4.0);
    float n = hash11(col) * 0.7 + hash11(floor(col / 9.0) + 3.0) * 0.3;
    float amt = speed * n;
    float dir = sign(uVel);
    vec4 acc = c;
    float wsum = 1.0;
    for (int i = 1; i < 10; i++) {
      float f = float(i) / 9.0;
      float w = 1.0 - f * 0.7;
      acc += texture2D(tScene, uv + vec2(0.0, dir * amt * f)) * w;
      wsum += w;
    }
    c = acc / wsum;
  }
  float g = hash12(uv * uRes + fract(uTime * 7.13) * 91.0) - 0.5;
  c.rgb += g * uGrain;
  gl_FragColor = vec4(c.rgb, 1.0);
}
`;
