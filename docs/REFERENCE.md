# Reference analysis — "The Notturno Experience"

Source reel: instagram.com/reel/De1njZtRl4t (samanastudios, 23 s screen recording of a laptop).
The site shown is **santionispirits.com** — "The Notturno Experience" for Santioni Spirits,
built by Active Theory with sound by Plan8 (Awwwards Site of the Day, 5 Oct 2026).
Inspected both the reel (frame by frame) and the live site (desktop 1024×768, after the age gate).

## Art direction
- Interactive manga / graphic novel told by vertical scroll (~33 viewport heights on desktop).
- Ink illustration: bold black contours, engraving hatching, screentone, flat spot colour.
- Palette (Awwwards): maroon `#592223`, red `#C82924`; plus charcoal `#1d1d1d`, ink `#121212`,
  paper off-white `~#efede6`, khaki robe, flavour accents blue / green / yellow.
- Typography (all commercial, so substituted in the recreation):
  - **Charles Rosie** — art-nouveau display caps (age gate, title, collection headings).
  - **PP Nikkei Maru Ultrabold** — rounded heavy sans for UI, captions, labels (15px, uppercase, +0.005em).
  - **GT Era Text Light** — body copy (15/22.5, justified in collection).

## Global UI
- Loader: charcoal screen, wordmark top-centre, line-art medallion centre, hand-drawn progress line bottom.
- Age gate: "ARE YOU OF" (top) / "LEGAL AGE?" (bottom) at ~124px, YES / NO boxes with rough borders, small ornament between.
- Header: medallion + script wordmark top-left; top-right white nav box (rough black border, ~295×40):
  EXPERIENCE · red squiggle · COLLECTION; the active item is black, the other grey.
- Right edge: thin scroll-progress track with a red thumb. Bottom-right: 4-bar audio toggle.
- Custom cursor: white circle bubble with contextual label ("HOLD & MOVE", "CHOOSE FLAVOR", "HOLD & POUR", "HOLD") plus a small dot.
- Mobile: portrait layout; landscape phones get "Please rotate your device."

## Sequence (scroll order)
1. **Title** — charcoal with drifting brush-stroke texture, "THE NOTTURNO EXPERIENCE" (interlocking OO, swash E),
   white ink splash rises from the bottom and wipes to paper.
2. **Comic panels on paper** — tilted bordered panels; figures break out of frames; caption boxes
   (white, thin black border, offset shadow, red lead-in words): traveller in desert → profile → steps,
   storm cloud, monolith & maroon orb → corridor portal with radiating lines.
3. **Hand** (HOLD & MOVE) — full-bleed maroon fibrous surface, an engraved hand reaches in; holding and moving
   drags the hand and smears the surface (red glow blotches, pixel smear).
4. **Arch** — circular window, red sun, black silhouette with wind-blown hair, balustrade; "TAKING A DEEP BREATH, HE STEPS IN."
5. **Melt** — image drips into black in vertical streaks → red colonnade hall, altar with 3 bottles;
   eyes strip slides over; red floor tiles.
6. **Table** — saint beside pedestal with three bottles; line-hatched floor.
7. **Choose flavour** — close-up of three bottles on vertical-stroke backdrop; hover shimmer, click to choose.
8. **Pour** (HOLD & POUR) — hand tilts the bottle, a stream fills a martini glass.
9. **Drink** — giant column, saint drinks; inset panel; wide eyes (iris = chosen colour).
10. **Vortex** (HOLD) — white wind strokes swirl on black, saint floats, robe turns the chosen colour.
11. **Collapse** — columns crack, stones fly over red sky; title "THE NOTTURNO EXPERIENCE" returns huge in red;
    saint walks toward the ruined colonnade; melt to black.
12. **Collection** — red: "INDULGE NOW / ATONE LATER", labels, justified paragraph; white card with big text
    and a 3D martini glass; 3D bottle carousel with giant flavour name, specs (N.02 · 13% ABV · 750 ML), prev/next.
13. **Select houses forthcoming** — paper, ornament, big display line.
14. **Footer** — charcoal: logo, Instagram, email, credits, Legal.

## Effects & motion
- Vertical "melt"/pixel-stretch transitions: columns of pixels stretch downward with per-column noise.
- Scroll-velocity streaking across the whole frame.
- Panel reveals: rough clip/melt-in, parallax between figure and frame layers.
- Hold interactions with progress, fluid smear on the hand surface, liquid pour, vortex spin.
- WebGL throughout (Active Theory's in-house engine), Lottie for small UI animations, ambient audio.
