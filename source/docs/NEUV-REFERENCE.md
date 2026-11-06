# Neuv reference notes

Inspected live https://neuv.fr/ on 6 Nov 2026 with curl and headless Chrome at 1440×900 and 390×844. Project page `/projects/aeron` and `/mentions-legales` were fetched. Effects below were measured or read from the shipped CSS and `animations.js`. The liquid WebGL logo and the infinite black/cream page loop were seen in the source; their exact canvas motion was not frame-recorded.

## Observed

- Page background `#050505`, text `#F6F5F2`, muted meta `#8E8C86`, hairline `rgba(246,245,242,.14)`. Desktop scroll height about 12725px. No horizontal page overflow.
- Type: Archivo weight 900, width axis condensed, tracking about −0.03em, uppercase. Intro title measured 151px on desktop and 53px on a 390px phone. Mono meta is JetBrains Mono 12px, tracking 0.16em. Body is Inter Tight 16/24.
- Easing used throughout: `cubic-bezier(.16, 1, .3, 1)`. Lenis smooth scroll duration 1.1s, ease `1 - (1 - t)^4`. Pointer follow uses a time constant of about 0.084s.
- Fixed bar is 64px tall on desktop (padding 32px) and 62px on the phone (padding 20px). Logo mark about 24×30 desktop and 22×27 phone. Nav links Work, Services, Contact. At scroll 1800 the bar opacity was still 0; it is revealed when the intro ink effect finishes. On reduced motion the bar is visible immediately.
- Intro is a very tall sticky “door” (CSS starts at 1000vh, then JS). A centered phrase sits on an ivory field while a black field shows through a growing mark. That mark is their identity, not reused here.
- Work gallery is a sticky 100vh horizontal track on a 12-column grid. Desktop first frame measured about 344×487. Phone frame about 292×413. Drag, previous/next, and a “Drag / Swipe” hint. Captions are name, arrow, discipline. Click starts a fixed image flight into the project (`project-flight`).
- Services is a 12-column grid, padding 160px 32px desktop and 112px 20px phone. Three columns from 768px. Section titles Archivo, about 86px desktop and 44px phone.
- Contact padding matches services, with a bottom pad of 32px desktop and 24px phone. The closing title measured 158px desktop and 66px phone.
- Project pages use a 32/20px margin and 24/16px gutter, an opening image, then a definition list and further plates. Legal pages use the same dark page, mono labels, and stacked sections.
- Reduced motion removes the long intro track and the custom cursor. The custom cursor is a 2px point plus a 40px ring, mix-blend difference, hidden on touch.

## Adapted for A/0001

- Same dark field, ivory type, mono labels, 20/32px margins, 112/160px section padding, and the same easing.
- Intro is one screen of the artist’s own tagline, not the Neuv phrase and not the liquid logo.
- Works gallery is a horizontal drag/button strip of A/0001 works. It does not copy the 12-column sticky math or the image-flight transition.
- Tattoo and Shop stay separate pages. The homepage points at them. Works remain tattoo-free.
- The existing brush and tiny click dab stay. Ink follows the ivory text color so it remains visible.
- The infinite theme loop and WebGL mark were not reproduced.
