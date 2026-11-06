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

## Mechanics confirmed in the shipped script

- The 1000vh door rule is only the stylesheet fallback. `animations.js` sets the door to `(TOTAL + 1 + VERROU) * 100vh`. `TOTAL` is 1.95 and `VERROU` is 0.35, so the live intro is about 3.3 screens.
- Progress `u` is screens scrolled past a 0.35-screen hold. Ink cover eases from 0 to 1.5 screens. The phrase opacity starts at 1.25 and settles by 1.65. The bar appears when cover reaches 0.985. Follow lag uses a 0.084s time constant.
- Without WebGL, the mark scales with `70 ^ (e ^ 2.2)` through a CSS mask. The WebGL path is a fluid simulation of their own logo. That logo path is not reused.
- Lenis, when motion is allowed, uses duration 1.1s and easing `1 - (1 - t)^4`. Reduced motion and the no-JS path keep native scrolling. Touch is not given the wheel smoother.
- The gallery is a sticky viewport. Cell size is `(width - 2 * margin) / 12`, margin 32px from 768px and 20px below. Desktop spans are 3, 4, 3, 4, 6 cells at columns 0, 4, 9, 13, 18. Under 1200px the spans are 4, 5, 4, 5, 7. Phone and very tall viewports use 10–12 cell frames on one vertical center (14% / 50% / 86% anchors otherwise).
- A project click, unless modified or reduced-motion, prevents the instant navigation, flies the visible image toward the opening frame in 650–1050ms with cubic ease-out, then assigns the real URL so history stays intact.
- Occurrences alternate noir and cream. Crossing a connector retargets scroll by one occurrence length. The bar and the following project page take that theme.

## Adapted for A/0001

- Same dark field, ivory type, mono labels, 20/32px margins, 112/160px section padding, and the same easing.
- The intro is about 3.2 screens. The A/0001 stamp scales over an ivory field until the field reads as the site black, then the tagline settles. It is not the Neuv fluid logo.
- The works strip is a sticky viewport on a 12-column grid with the same span and anchor rules, plus drag and previous/next.
- Wheel scrolling on a fine pointer is smoothed for about a second. Reduced motion and touch keep native scrolling.
- Choosing a work flies its image toward an opening frame, then navigates with the router so history stays real.
- The page ends on an ivory field with the stamp. A further downward wheel returns to the top. It is one wrap, not cloned page occurrences.
- Tattoo and Shop stay separate pages. The homepage points at them. Works remain tattoo-free.
- The existing brush and tiny click dab stay. Ink follows the ivory text color so it remains visible.
- The infinite theme loop and WebGL mark were not reproduced.
