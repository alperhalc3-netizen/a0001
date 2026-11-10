# Portfolio and shop notes

Looked at on 10 Nov 2026 while fixing the Spencer-style A/0001 site. Only patterns that keep the current white page, condensed headlines, pills, and curved carousel were used.

## What was actually opened

- https://www.theposterclub.com/ — the homepage text was readable. A featured artist sits above a “Bestsellers” selection. Each print shows a title, a price (“From 319,00 kr”), the artist, and “Available in N sizes.” The home page is a selection, not the whole catalog.
- https://www.hvasshannibal.dk/ — the live page returned almost no readable layout (the studio site is client-rendered). No spacing, navigation, or shop behavior was measured there, so nothing from that URL was copied.
- Case studies, not the shops themselves: [Wonderza’s artist portfolio note](https://wonderza.com/en/work/artist-portfolio/) (a selected gallery, each piece linked to its print), [StillFrames](https://analogelk.com/work/stillframes) (series on the home page, a print reached from the photograph), and the [Hvass & Hannibal write-up](https://www.granyon.com/work/hvass-hannibal) (the shop stays in the same visual system as the archive). Those pages describe the work. They were not used as measured layouts.

## Adopted

- Home Art, Tattoo, and Shop show at most nine pieces. Tattoo and Shop, which have more, get an “All / Tümü” pill to a full archive page (`/works/`, `/tattoo/`, `/shop/`). Art has seven works, so the home carousel already is the full set; the archive page still lists all seven.
- Those archive pages reuse the same card grid, type, and radius. They are not a second design.
- A shop detail leads with the price in the headline face, then availability and the shipping note, then one Shopier pill. There is no cart on this site.
- The intro has three pills, Art, Tattoo, and Shop, that scroll to the matching sections. The page keeps a top offset so the fixed About button does not cover the heading.

## Left out

- Size, crop, and frame choosers, and a magnifier. They fight the brush cursor and the single Shopier checkout.
- A full catalog on the homepage. The selection is the point of the sites above.
- New type, color, or a storefront grid. The Spencer-style page stays the look.
