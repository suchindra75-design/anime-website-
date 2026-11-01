# Implementation report

## What was built

A complete, working recreation of *The Notturno Experience* (santionispirits.com) as
**The Nocturne Experience** for the placeholder brand **Vigilia Spirits**, in this folder (it was empty,
so there was no existing architecture to preserve — a Vite + TypeScript project was created here).

Every section of the reference is reproduced in order, with its interaction:

| # | Section | Behaviour |
|---|---|---|
| 1 | Loader | Line-art medallion, hand-drawn progress line; first chapter's art is prepared behind it |
| 2 | Age gate | "Are you of / legal age?" split-letter intro + exit, Yes/No (No shows a refusal), remembered 30 days (`?gate` forces it) |
| 3 | Title | Drifting dry-brush backdrop (shader), interlocked-ring "O", swash "E"; on scroll letters scatter and a white ink splash rises to paper |
| 4 | Arrival comic | Hand-inked panel frames, figures breaking out of panels, screentone, caption boxes that wipe in; panels drip ("melt") into place |
| 5 | Hand — *Hold & move* | Engraved hand follows the pointer while held; the fibrous surface smears with red glow (trail texture); completing pushes through and auto-advances |
| 6 | Arch | Wind-blown silhouette in the red circle; scroll zooms in, then the whole image drips away into black |
| 7 | Hall | Red colonnade drips in with scroll; eyes strip drifts over |
| 8 | Table | Saint beside the pedestal with three bottles |
| 9 | Choose flavour | Bottles bob, shimmer on hover/focus, click or arrow keys choose; the choice recolours liquid, robe, eyes, vortex sparks and the 3D bottle |
| 10 | Pour — *Hold & pour* | Bottle tips over the glass, a wobbling stream falls, the glass fills (shader mask); release stops; scrolling past completes it |
| 11 | Drink | Column, drinking saint, inset panel, wide eyes (iris = chosen colour) |
| 12 | Vortex — *Hold* | Spiral of white brush strokes spins up while held, saint lifts; completion flashes and auto-advances |
| 13 | Collapse | Cracked columns, stones flying in front of everything (front WebGL layer) |
| 14 | Finale | Big extruded title, ruined colonnade, saint walking away; ruins drip into the black band |
| 15 | Collection | "Indulge tonight / Repent tomorrow", labels, justified copy, ritual card with a real-time 3D martini glass, 3D bottle carousel (buttons, arrow keys, swipe) with giant flavour name and specs |
| 16 | Forthcoming + footer | Ornament, display line, logo, Instagram, email, credit, Legal dialog |

Global: fixed header (logo tone switches over light/dark scenes, active nav item), hand-drawn nav box with
squiggle, red scroll-progress thumb, animated 4-bar sound toggle, custom cursor with contextual labels and a
hold-progress ring, Lenis smooth scrolling, scroll-velocity streaking + film grain post pass, line boil on all
ink art, procedural Web Audio sound design (drone, wind tied to scroll speed, pour gurgle, vortex roar, chimes).

## Verified

- Type-check and production build pass.
- Desktop walkthrough (1440×900) and phone walkthrough (390×844, touch emulation) in headless Chrome on a
  real GPU, every section screenshotted, no console errors; no horizontal overflow on phones.
- Interactions exercised: age gate, hand hold, flavour select (choice recolours later scenes), pour hold →
  full glass, vortex hold → completion, carousel next/prev, nav state, and the touch Hold buttons on phones.

## Not identical to the reference (by design or unavoidable)

- **Artwork, logo, copy and brand** are original stand-ins. The reference's hand-drawn illustrations, brand,
  wording and fonts are proprietary, so the story beats are redrawn in code and rewritten.
- **Fonts** are free look-alikes: Smythe (for Charles Rosie), Nunito 900 (for PP Nikkei Maru Ultrabold),
  DM Sans 300 (for GT Era Text Light). Swap in licensed files in `src/main.ts` / `base.css` if you have them.
- **Sound** is synthesised; the original uses a composed Plan8 soundtrack.
- **Exact timings/easings** of Active Theory's engine can't be read from the outside; they were matched by
  eye from the reel and the live site.
- The reference's 3D bottle uses production models and physically based glass; this one is procedural
  (lathe geometry + environment reflections).

## Where to change things

See `README.md` → *Customising*.

## Art-direction pass (second iteration)

See `docs/before-after.jpg` for side-by-side frames.

- **Illustrations** — floating saint redrawn (anatomy, posture, scale); looking-up inset face rebuilt on the
  shared inked head pieces; drinking inset recomposed as a tight close-up; bottle hand given knuckles,
  tendons, a thumb and draped sleeve; feathered brows on both eye strips; drinking arm now connects to the
  shoulder; finger seams fixed on the reaching hand; table scene rescaled (pedestal at hip height, bigger
  bottles, arched niche, cast shadow); storm cloud rebuilt from rim-lit billows with rain.
- **Cohesion** — every hard section boundary is now an ink-drip transition (shader) in the previous
  section's colour; hand-lettered manga sound effects at three beats (bell, portal hum, columns cracking).
- **Performance** — all shader programs precompiled behind the loader; texture work prioritised (on-screen
  first, look-ahead only when scrolling is calm); illustrations pre-generated in idle time; uploads via
  premultiplied ImageBitmaps (browser fast path); texture cap 2560 px; loader waits for the first screens only.
- **Accessibility** — page behind the age gate is inert; nav contrast raised to WCAG AA; descriptive labels on
  hold buttons; pour result announced; reduced-motion now also removes scroll-linked zoom/parallax and the
  title/finale letter animations.
- **Responsive** — portrait tablets use the stacked layout (previously the desktop crop hid bottles/pour).
- **Fixes** — vortex seam at the angular wrap; stale cursor label when scrolling under a still mouse;
  flavour label styled like the caption boxes.

## Final quality audit (third iteration)

### Performance — measured, not guessed
Profiled with a dev-only `?profile` mode (GPU work fenced with `gl.finish()`), headless Chrome on this
Mac's Intel UHD 630, 1440×900:

- Per-frame cost is small everywhere: JS ≈0.3 ms median, GPU ≈0.3–0.8 ms p95 per scene; texture uploads
  totalled 11 ms for the whole story. Rendering, shaders and the post pass were **not** the bottleneck.
- The real bottleneck: rasterising each SVG illustration runs on the main thread (20–220 ms per piece) and
  happened just as art scrolled into view.
- Fix: look-ahead rasterisation (6 viewports ahead on desktop, 3 on touch) that only runs after scrolling has
  been calm for 300 ms; on-screen art still goes first. Scroll velocity is now derived from the real scroll
  position (Lenis' value stayed 0 for native/programmatic scrolling, which kept the gate open).
- Result (production build, machine load ≈4): scroll-and-pause reading — 0 janky frames, 0 long tasks in
  two runs (was 14 janky frames, worst 433 ms); non-stop 40 s scroll — p99 16.8 ms, 2 frames > 50 ms, worst
  117 ms (was 27 > 50 ms, worst 300 ms). Live texture memory ≈ 92 MB on desktop.

### Safari / iOS (code audit + Chrome emulation of the Safari code paths; no Safari run)
- Fast ImageBitmap uploads are used only in Chromium after a runtime flip check; Safari/Firefox use the
  spec-guaranteed canvas upload (`?nobitmap` renders identically — verified).
- WebGL canvases are sized to the large viewport (`100lvh`) and the story layout only re-measures on real
  resizes, so iOS toolbars no longer reallocate buffers or refresh triggers mid-scroll.
- `overflow-x: hidden` fallback for Safari < 16; tap highlight removed; SVG-to-canvas taint check falls back
  to plain SVG art instead of blank panels.
- No-WebGL fallback fixed: accent colours were raw magenta, flavour choice didn't work, 3D objects were
  missing (now SVG stand-ins).

### Accessibility — verified with real key events and the browser accessibility tree
- Gate traps focus; Enter on Yes enters; focus then returns to the skip link.
- Logical tab order through header, hold buttons (visible on focus), flavour radio group, carousel, footer.
- Holding Space on a hold button completes the interaction.
- Landmarks, 14 named regions, h1–h3, named buttons/links, illustrations exposed as labelled images.
- Contrast: small text on red raised from 3.05:1 to 4.68:1 (paper); everything else ≥ 4.68:1.
- Reduced motion: no smooth scroll, no melts/zoom/parallax/letter animations (verified).

### Visual polish
- Sound toggle restyled as a white ink-framed box (was turning teal over red via a blend mode).
- Finale black band shortened; phone paragraph no longer justified (word rivers).
