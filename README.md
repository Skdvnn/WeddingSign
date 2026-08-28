# Allison + Skylar — Welcome Sign

Interactive directions for a 24 × 36 in (2×3 ft) birch A-frame welcome sign, plus SVG exports for lettering and graphics.

## Open locally

```bash
cd WeddingSign
python3 -m http.server 8765
```

Then visit [http://localhost:8765](http://localhost:8765).

The room is also saved in `data/seating-state.json`, so a new browser or host does not start empty. Edits still live in that browser until you **Save layout** or **Download JSON**. The GitHub repo is private — guest names stay off the public internet.

- **Welcome sign directions:** `index.html`
- **Table numbers (5 × 7 in):** `tables.html`
- **Our seating (working room):** `plan.html`
- **Seating chart (24 × 36 in poster):** `seating.html`
- **Earlier moodboard:** `moodboard.html`

Name / detail face pickers include the suite fonts (Instrument Serif, Roboto Mono, Helvetica Neue Black / Thin via local install) plus the earlier Google Fonts options. See `assets/fonts/suite.css`.

## Table numbers

Open `tables.html` for 5 × 7 in “When we were [age]” cards. Twenty layouts: the six sketches you made, then translations of the invite / save-the-date / welcome sign, then further experiments. Upload childhood photos, star a shortlist, print a card at actual size.

Open `plan.html` to lay people on the three longs — drag parties, same last names recruit, print the working room. Open `seating.html` for the guest poster: <b>A–Z by last name</b>, sign number on the right. The 5×7 number is still the age. Attending only (83); one name per line, A–Z. Star one, then **JPEG for Walgreens** (24 × 36 at ~200 dpi) for the photo lab, or **PNG for Figma** at 1728 × 2592 for mocks.

## SVG export

Graphics and lettering are copyable / downloadable as SVG:

| Asset | Path |
| --- | --- |
| Agave botanical | `assets/svg/agave.svg` |
| Champagne flutes | `assets/svg/champagne.svg` |
| Registration marks | `assets/svg/registration-marks.svg` |
| Name letterforms template | `assets/svg/letterforms-template.svg` |

**In the page**

1. Sticky **Export SVG** bar — copy/download live lettering (current names, face, colour) plus the three graphics.
2. **SVG assets** section — copy or download each mark.
3. Every layout card — **Copy graphic / ↓ Graphic / Copy lettering / ↓ Lettering / ↓ Full sign**.

**Vinyl / stencil tip:** Use **↓ Outlined cut (send this)** on a layout card — lettering is converted to paths so the shop doesn’t need your fonts. The editable-text cut is a backup if you want to tweak type later.
