# Allison + Skylar — Welcome Sign

Interactive directions for a 24 × 36 in (2×3 ft) birch A-frame welcome sign, plus SVG exports for lettering and graphics.

## Open locally

```bash
cd WeddingSign
python3 -m http.server 8765
```

Then visit [http://localhost:8765](http://localhost:8765).

Private backup: [github.com/Skdvnn/WeddingSign](https://github.com/Skdvnn/WeddingSign). The room is also in `data/seating-state.json`, so a new browser or host does not start empty. Edits still live in that browser until you **Save layout** or **Download JSON**. Guest names stay off the public internet.

- **Welcome sign directions:** `index.html`
- **Table numbers (5 × 7 in):** `tables.html`
- **Bar menu (1545 × 2000 portrait):** `bar.html`
- **Our seating (working room):** `plan.html`
- **Seating chart (20 × 30 in poster):** `seating.html`
- **Earlier moodboard:** `moodboard.html`

Name / detail face pickers include the suite fonts (Instrument Serif, Roboto Mono, Helvetica Neue Black / Thin via local install) plus the earlier Google Fonts options. See `assets/fonts/suite.css`.

## Table numbers

Open `tables.html` for 5 × 7 in “When we were [age]” cards. Twenty layouts: the six sketches you made, then translations of the invite / save-the-date / welcome sign, then further experiments. Upload childhood photos, star a shortlist, print a card at actual size.

Open `plan.html` to lay people on the three longs — drag parties, same last names recruit, print the working room. **Export letter PNG** saves `seating-plan-letter.png` (8.5 × 11 in at ~300 dpi) of Not seated + Long tables 1–3 — the staff sheet, not the guest poster. **Print letter** hides the save bar and nav for a one-page browser print / Save as PDF. Open `seating.html` for the guest poster: <b>A–Z by last name</b>, sign number on the right. The 5×7 number is still the age. Attending only (83); one name per line, A–Z. Star one, then **JPEG for Walgreens** (20 × 30 at ~225 dpi) for the photo lab, or **PNG for Figma** at 1440 × 2160 for mocks.

## Bar menu

Open `bar.html` for the portrait bar card (1545 × 2000, ~3:4 / letter). Same suite as the welcome sign and table cards: Instrument Serif names, Roboto Mono ingredients, bone stock. Four signature cocktails stay the poster; beer (Fort Point Kölsch, Sapporo Lager) and wine (Alamos Malbec, Broc Cellars Love White) sit as a designed **Also pouring** chapter — hairline, Beer | Wine columns, readable names. Sticky toggle shows or hides that band on every layout (saved in this browser). B9 (type only) and B30 (inset plate) are the pair that hold with the band on; B38–B45 are cousins of that stack. B34–B37 keep the earlier rail / pane experiments. Edit cocktail and bottle copy, star a shortlist, print a layout, or export PNG / SVG / PDF.

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
