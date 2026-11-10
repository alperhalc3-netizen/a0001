# Spencer Gabor reference notes

Inspected live https://spencergabor.work on 10 Nov 2026. The homepage HTML and the shipped CSS/JS were fetched (Nuxt, `x-powered-by: Nuxt`). Layout and interaction were measured in headless Chrome at 1440×900 and 390×844. Screenshots were used only to check what the measurements described. Effects below were either measured in the browser or read from the shipped CSS. Anything not opened is listed at the end.

## Pages that were opened

- `/` at 1440 and at 390.
- Carousel click landed on `/Nike`. The close control returned to `/`. Loading `/Nike` directly also showed the project overlay.
- `/about` at 1440.
- On the 390 homepage, the first grid card click landed on `/frugo` and showed the same overlay.
- A scripted click on the second palette swatch changed the theme. The palette fan itself did not open from that scripted toggle click (see below).

The homepage link list and the grid `href`s also include `/Shred`, `/Vroom`, `/Whop`, `/ballin`, `/bikers`, `/brompton`, `/caulfield-cup`, `/dance`, `/dj`, `/dream-vault`, `/emails`, `/frugo`, `/goose`, `/jaffa`, `/jump`, `/lovely-day`, `/olympics`, `/sax`, `/shakeshack`, `/sk8`, `/skate`, `/strike`, `/subway-surfer`, `/surfs-up`, `/vr`, `/260-collins`, `/Bike`, `/Commute`, `/DoGood`, `/Graffitti`, `/Horse`, `/Kick`, and `/about`. Those URLs were not each opened.

## Homepage, 1440×900

- Background computed `rgb(255, 255, 255)`. Text `#363636`. CSS variables after hydration: `--color-primary: #ffffff`, `--color-secondary: #d2d2d2`, `--color-onPrimary: #363636`. The stylesheet default for secondary is `#cbcbcb`; the live value is the hydrated theme.
- No horizontal overflow. Document scroll height 7851px, viewport 900px.
- Headline font computed `100.8px / 82.656px "Futura Now Headline"`, uppercase, letter-spacing `-2.016px` (−0.02em). The rule is `font-size: max(3.8rem, 7cqi)` inside a container named `hero`.
- Location line “BROOKLYN, NEW YORK” and the email sit above the name. Email is the secondary grey. “CLIENTS INCLUDE” plus the client list sit below the grey role line. Role line uses the same headline size and the secondary color.
- Four hero images, each 202×202, in a row from x=435 to x=789 at y=299. They overlap (`margin-right: -6%` on all but the last). Rotations measured about 2°, −3°, 6°, −2°. Radius 1rem. Soft shadow: `0 9px 21px rgba(0,0,0,.1), 0 38px 38px rgba(0,0,0,.09), 0 85px 51px rgba(0,0,0,.05)`.
- One pointer move to (200, 400) changed the images’ `--offsetX` / `--offsetY` / `--velocity`. The first image read about 49.13 / 98.27 / 15.76. The shipped spring uses stiffness `0.05` and damping `0.8`. Images are `pointer-events: auto`; the wrapper is `pointer-events: none`.
- Before mount, words are `scale: 1 0` and images are `scale: 0`. After `mounted=true`, words transition 0.8s and images 1s on `--ease-out-elastic`, with per-word and per-image delays. Top and bottom meta fade in over 1.2s.
- Header is fixed, top right. The only control is a 48×48 circle at about (1361, 16), `aria-label="About me"`, `href="/about"`. It holds an SVG portrait. Shadow matches the hero shadow. The header itself is `pointer-events: none`; the button is `pointer-events: auto`.
- Palette control is a 48px circle, fixed bottom right. Four swatches measured 16px: `rgb(237, 230, 211)`, `rgb(7, 121, 255)`, `rgb(55, 175, 93)`, `rgb(60, 3, 80)`. CSS fans them on an arc when `open=true` (`--idx`, sine/cosine translate, 0.5s elastic). A DOM click on `.color-picker__toggle` left `open` unset and the swatches stacked. Clicking the second swatch still applied primary `#0779ff`, secondary `#002180`, on-primary `#b7f9ff`, body background `rgb(7, 121, 255)`.
- Index column gap is 8rem, 12rem from 768px. Section inner gap is 4rem.
- “FEATURED WORK” / “Select recent and notable projects”, then a curved carousel. Six slides measured 480×544: NIKE, SHAKESHACK, JAFFA, CAULFIELD CUP, FRUGO, WHOP. Slide width rule is `min(30rem, 80vw)`. Images radius 1rem. The track curves with `rotate: calc(var(--transform) * .03deg)`, origin `50% 70vw`, and a cosine vertical shift. Cursor is `grab`, `grabbing` while active. Off-screen slides enter at `scale: .8` and `translate: 0 20%` over 1.4s elastic. Label under the centered slide is a pill (`border-radius: 50rem`, padding `1rem 2rem`, uppercase headline face). Pill hover scale 1.05 and shadow; active scale 0.95.
- “MORE WORK” / “Take a scroll, stay a while”, then 35 cards. First card 272×272. Grid is 2 columns, 3 from 768px, `max-width: 1200px`, gap `min(10vw, 5rem)` and `min(10vw, 8rem)` from 768px, padding `0 2rem 10rem` and `2rem 4rem 10rem` from 768px. Stacked cards rotate and shift from `--rotation`, `--posX`, `--posY`. Before inview, media scale is 0.7 and the shadow opacity is 0. Hover scales the stacked layers about 1.01–1.03; active scales them about 0.97–0.99. Transition 0.8s–1s elastic.
- Footer is `position: fixed`, full viewport, background the secondary grey, behind `main` (`z-index: 1` on main). A following phantom is `min-height: 100dvh`, so the footer is revealed at the end of the scroll. At scroll 6951 the word CONTACT measured 470.25px (the rule is `33cqi`), white, `scaleY` identity, letter-spacing about −0.04em, uppercase. Links under it: mailto `spencergabor9@gmail.com`, Instagram, Dribbble. Link hover in CSS: color primary and `scaleY(1.2)` over 1s elastic. The exact mid-scroll `scaleY` curve was not sampled; CSS binds it to a runtime variable.

## Project overlay

- `/Nike` is a fixed full-viewport layer, padding 1rem from 768px and 0.5rem below, scrim `#0009`. The panel is white, radius 2rem, full size of that inset, scrollable, scrollbar hidden. Close is a round button at the top right.
- Enter/leave: overlay opacity 0.3s; the panel scales from 0.9. Title words scale up from `scale: 1 0` over 0.8s elastic. Description fades to opacity 0.6.
- Nike’s title and the sentence “Artwork commissioned by Nike…” were centered. Five images were in the page. The wide one measured 860×860 inside an 860px content column (`--max-width: 860px`). Grid is 2 columns, gap 1rem from 768px; every third image and a lone image span both columns. Radius 1rem. `object-fit` computed `fill`. Multi-image pictures scale to 0.98 while active.
- Page route transition in CSS is opacity 0.2s (`page-enter` / `page-leave`). It was not frame-timed.

## About, 1440

- Path `/about`. Scroll height 3614px. No horizontal overflow.
- “ABOUT” then uppercase headline paragraphs. The first measured in the headline size (h1 computed 64px, which is `--font-h2` at ≥768: `4rem / .82`). Later paragraphs that were not in the center of the viewport were grey; CSS sets those spans to opacity 0.25 until they intersect. Enter: title `scale: 1 0`; paragraphs opacity 0, `scale: 1 1.2`, `translate: 0 4rem`, then 1s elastic.
- Further down the text included NEWS cards and a PROJECTS name list (Brompton, 260 Collins, and others). CSS for that list: titles at opacity 0.25, hover opacity 1 and `scale: 1 1.1`; hovering the list reveals absolutely positioned images (`width: min(30%, 12rem)`, radius 1rem, shadow) with staggered scale. That hover was not exercised with a pointer, only read from CSS and seen as a list in the extracted text.

## Mobile, 390×844

- Headline computed 60.8px (`max(3.8rem, 7cqi)` floors at 3.8rem).
- Hero images 96×96. Header button still 48px wide.
- Grid still 35 cards. First card 144×150. Scroll height 5991px. No horizontal overflow.
- The same rounded project overlay opened over the first card.

## Easing present in the page

- `--ease-out-elastic: linear(0, .5737 7.6%, .8382 11.87%, .9463 14.19%, 1.0292 16.54%, 1.0886 18.97%, 1.1258 21.53%, 1.137 22.97%, 1.1424 24.48%, 1.1423 26.1%, 1.1366 27.86%, 1.1165 31.01%, 1.0507 38.62%, 1.0219 42.57%, .9995 46.99%, .9872 51.63%, .9842 58.77%, 1.0011 81.26%, 1)`
- `--ease-out-elastic-100-30: linear(0, .2178 2.1%, 1.1144 8.49%, 1.2959 10.7%, 1.3463 11.81%, 1.3705 12.94%, 1.3726, 1.3643 14.48%, 1.3151 16.2%, 1.0317 21.81%, .941 24.01%, .8912 25.91%, .8694 27.84%, .8698 29.21%, .8824 30.71%, 1.0122 38.33%, 1.0357, 1.046 42.71%, 1.0416 45.7%, .9961 53.26%, .9839 57.54%, .9853 60.71%, 1.0012 68.14%, 1.0056 72.24%, .9981 86.66%, 1)`
- Also defined, and used by buttons, overlays, or the palette: `--ease-out-expo: cubic-bezier(.19, 1, .22, 1)`, `--ease-in-out-sine: cubic-bezier(.445, .05, .55, .95)`, `--ease-out-sine: cubic-bezier(.39, .575, .565, 1)`, `--ease-in-out-cubic: cubic-bezier(.645, .045, .355, 1)`, `--ease-in-cubic: cubic-bezier(.55, .055, .675, .19)`.

## Not observed

- No custom cursor. The only cursor rules found are `pointer` on buttons and `grab` / `grabbing` on the carousel.
- The palette fan animation was not seen. The CSS for it was read, and a theme change from a swatch was seen.
- Not every project URL was opened. Nike (click, close, and direct load) and Frugo (mobile click) were.
- Mux video players are in the CSS and markup for some projects. Nike’s opened view was still images. No video was played.
- Named view transitions for `brompton-bg` and `lovely-day-bg` are in the CSS. Those projects were not opened.
- The footer title’s intermediate `scaleY` while approaching the phantom was not sampled.
- There is no separate contact route. Contact is the footer.
