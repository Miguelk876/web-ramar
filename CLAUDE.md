# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> 📘 **Para humanos**: lee primero `README.md` — explica setup, estructura y cómo agregar productos. Este archivo es para el contexto profundo que un asistente de IA necesita.

## Project Overview

Static marketing website for **Construaceros RAMAR**, a B2B steel/construction materials distributor based in Oaxaca, Mexico. 26 years in business, 7 active branches + 1 upcoming + 4 authorized distributors.

Vanilla HTML5 + CSS3 + JavaScript — no build, no package manager, no frameworks.

## Development

```bash
npx serve .             # or  python -m http.server 8080
```

There is no build — files are served as-is. There IS a pre-publish check script; run it after any change to the catalog, images, or shared chrome:

```bash
node scripts/verificar.js
```

It validates: PRODUCTS/TABLE_HTML parse and have no duplicate ids or orphaned table keys, required product fields, every local image reference exists on disk, internal links resolve, navbar/footer consistency, and WhatsApp float presence. Exit code 1 on errors — do not push if it fails.

It only checks **local** images. The catalog's product photos are hotlinked from supplier servers, so they can die silently when a supplier reorganizes their site. A second script checks those, run by hand (it makes ~88 requests to third-party servers and needs open outbound internet):

```bash
node scripts/verificar-fotos.js                 # informe completo
node scripts/verificar-fotos.js --solo-muertas  # solo lo que falla
node scripts/verificar-fotos.js --csv           # para hoja de cálculo
```

Exit 1 if any photo is dead, exit 2 if every request failed with the same code — that means the network running the script is blocked (proxy/firewall), not that the suppliers went down, so don't edit the catalog based on that run.

## Architecture

8 HTML pages linked via plain `<a href="...">` navigation:

| Page | Purpose | Notes |
|------|---------|-------|
| `index.html` | Homepage | Hero carousel, stats bar, "Por qué RAMAR", 10 rotating tips, FB feed embed |
| `nosotros.html` | History and values | |
| `catalogo.html` | **Single unified catalog** | NEVER split into sub-pages. Products live in JS arrays inside the file. Filters by category. |
| `guia.html` | "¿Qué material necesito?" | Project-type filters |
| `ubicaciones.html` | 7 branches + Google Maps | Has full Schema.org JSON-LD with all branch addresses |
| `contacto.html` | Form + contact info | Posts to Formspree → redirects to `gracias.html` |
| `gracias.html` | Thank-you page | `<meta name="robots" content="noindex">` |
| `aviso-privacidad.html` | Legal — LFPDPPP privacy notice | Linked from every footer and from the contact form. **Keep it truthful:** if a feature starts storing or transferring visitor data, the notice must be updated in the same commit. |

All pages share copy-pasted `<header class="navbar">` and `<footer>` blocks. **There are no server-side includes or components**, so changes to navbar/footer must be replicated in all 7 pages manually.

### Shared structure of every page
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <!-- charset, viewport, title, description -->
  <!-- og:* tags, canonical, twitter:card -->
  <!-- favicons (6 sizes), site.webmanifest, theme-color -->
  <!-- preconnect Google Fonts, FA 6.4 from cdnjs, styles.css -->
  <!-- (index.html only) Schema.org Organization + WebSite JSON-LD -->
</head>
<body>
  <a href="#main" class="skip-link">Saltar al contenido principal</a>
  <header class="navbar">...</header>
  <main id="main">...</main>
  <footer id="footer-section">...</footer>
  <a class="whatsapp-float">...</a>
  <script src="main.js"></script>
</body>
</html>
```

## Files

- **`styles.css`** — all CSS for every page (~3700 lines). Variables declared at `:root` top:
  - `--color-blue: #1C2B54` (primary)
  - `--color-yellow: #F08018` (accent / CTAs)
  - `--color-red: #DD3B2E` (secondary accent)
  - `--font-heading: 'Oswald'`, `--font-body: 'Inter'`
- **`main.js`** — mobile hamburger toggle + `IntersectionObserver` for `.fade-in` (with 800 ms fallback that forces `.visible` if observer doesn't fire).
- **`assets/images/`** — local images. Files prefixed **`ramar-`** are the company's own photos, taken in the warehouse and supplied by the user; prefer them over hotlinked supplier photos whenever one covers the product. The rest of the catalog still hotlinks ~85 photos from supplier servers (see `verificar-fotos.js`).
  - **Processing own photos:** phone shots arrive portrait at ~1.3 MB. Crop to landscape (4:3 for product cards, 16:9 for hero backgrounds), cap the long side at 1200 px / 1920 px, JPEG quality ~0.84, keeping each file under 500 KB. There is no ImageMagick, `cwebp` or PIL in this environment — resizing is done through Chromium's canvas (see the pattern in a prior session: serve the originals over the local HTTP server, load them by URL, `drawImage` a crop into a canvas, read back `toDataURL`). Loading originals as base64 data URIs fails with `EncodingError`; serve them by URL instead.
  - Remember the cache rule above: **never overwrite an image filename** — publish under a new name.
- **`assets/images/tips/*.svg`** — 10 hand-crafted illustrations for the home tips section. `electrodos.svg` is animated (welding sparks pulse).
- **`_headers`** (lo leen Cloudflare y Netlify por igual; hoy sirve Cloudflare) — CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, cache policy. HTML, `styles.css` and `main.js` all revalidate on every request, so a deploy reaches visitors immediately. Images under `assets/images/` are cached for a year as `immutable`: **to replace an image, give it a new filename** and update the references — overwriting the same filename leaves returning visitors on the old one for up to a year.
- **`robots.txt` / `sitemap.xml`** — absolute URLs pointing to https://construacerosramar.mx (they never named the host, so the migration did not touch them).
- **`.well-known/security.txt`** — RFC 9116 contact.

## Key Patterns

- **Adding a page**: copy the closest existing page, update content. Then **add a nav link to every other page's header manually** (no shared include). Don't forget to update `sitemap.xml`.
- **Adding products**: products live in the JS data array inside `catalogo.html`. Each entry: `id`, `cat`, `name`, `tagline`, `svg` (inline) or `photo`, `svgNote`, `specs[]`, `wa` (URL-encoded WhatsApp text). Rendered into `.pcard` blocks via JS.
- **Responsive breakpoints**: `@media (max-width: 1100px | 900px | 768px | 600px | 480px)`. Hamburger activates at **900px**.
- **Scroll animations**: add `class="fade-in"`; `main.js` IntersectionObserver handles it.
- **Google Maps embeds**: in `ubicaciones.html`, each branch has an `<iframe>` with a Maps `src`. Get the embed URL from Google Maps → Share → Embed a map.
- **External dependencies** (CDN only): Google Fonts (Oswald, Inter), Font Awesome 6.4.0 (cdnjs), Microsoft Fluent Emoji 3D (downloaded locally to `assets/images/tips/` for offline reliability).

## SEO and standards (already implemented)

- HTML5 semantic (`<header> <nav> <main> <section> <footer>` everywhere)
- Canonical URLs on all 8 pages → https://construacerosramar.mx
- Open Graph + Twitter Card meta tags on all pages
- Schema.org JSON-LD: `Organization` (index.html), `LocalBusiness` × 7 (ubicaciones.html), `WebSite`
- Skip-to-content link on all pages
- `:focus-visible` global with brand color
- All `<img>` have `alt` attributes
- `_headers` enforces strict CSP, HSTS, no camera/mic/geo

## Mobile-first reality check

**The site is consumed primarily on cheap Android phones**: salespeople send WhatsApp links to leads. Test mentally on 360 px width before declaring any visual change done. Optimize image weight aggressively (target < 500 KB per photo). Tap targets ≥ 44 px.

## Company history (source of truth)

From the company's own printed history sheet, supplied by the user. `nosotros.html` follows this — don't rewrite it from imagination.

> ⚠️ **Privacy — this repository is public.** Discretion about the family, as the user set out on 2026-09-18.
>
> - **The founder, Félix Martínez Lázaro, may be named.** He has passed away and the user wants him credited in the company's story. Surname included.
> - **No one else.** No officer, no relative, no living family member — not on the pages, not in commit messages, not in PR descriptions, not in these notes. Write "un negocio de familia".
> - **Never explain what RAMAR stands for.** The acronym comes from family surnames; the user asked that it not be spelled out. "Construaceros" from *construyendo aceros* is fine.
> - If a future sheet, photo or message carries other names, leave them out and tell the user.

- **2000-08-08** — founded by **Félix Martínez Lázaro**; opens at Av. del Valle N°6, Col. Ex Garita, Santa Cruz Xoxocotlán, under the name **"Perfiles San Miguel"**. A 300 m² yard plus a 6 m² caseta used as the counter. "Perfiles" for the product; "San Miguel" for **San Miguel Amatlán**, Sierra Juárez, the founder's home town.
- **2010** — outgrows the first premises and moves to a larger site on Blvd. Guadalupe Hinojosa de Murat. More delivery units and staff, to cover the whole state.
- **2021** — takes the current name, **Construaceros RAMAR**, from *construyendo aceros*. (Do not spell out the RAMAR acronym — see the privacy note above.)
- Catalogue of **+5,000 products** across perfilería, aceros estructurales, láminas, aceros especiales, herrajes.
- Foráneas routes: Miahuatlán, Huatulco, Mixes, Juquila, Mixteca, Peras, Teojomulco, Istmo, Valle Nacional, Zimatlán.
- Customers by trade: herreros, torneros, balconeros, hojalateros, carroceros, mofleros, estructuristas, constructoras, revendedores, distribuidores.
- Slogans: "Tu Soporte de Acero", the logo line "Si de perfil lo va a realizar, que sea de Construaceros RAMAR", and **"La Mujer de Acero"** — the resilience line the user explicitly wants kept. It stays unattributed on purpose; never pair it with a name.

**Do not mention the intermediate trade name "Perfiles de Antequera"** — removed on user request; more corporate changes are expected and they don't want that history on the site. Don't explain "RAMAR" as surname initials either (see the privacy note).

**Branches vs. the sheet — resolved 2026-09-18.** The sheet lists a **Lachigolo** branch: it is **not** a RAMAR branch and must **not** be added to `ubicaciones.html`, the sitemap or the JSON-LD. The sheet predates **Tlacolula**, which is correct as it stands (badge "Próximamente", no `openingHours` in its JSON-LD) — leave it alone.

## Privacy notice — keep it accurate

`aviso-privacidad.html` describes the **real** data flows of this site, not boilerplate: the contact form is processed by FormSubmit and lands in Gmail; Google Maps, the Meta page plugin, Google Fonts and Cloudflare are embedded and see the visitor's IP; the site is hosted on Cloudflare (was Netlify until 2026-09-21; section 4 of the notice was corrected in the same commit, and the notice date bumped to 2026-09-21).

Two rules follow from that:

- **No localStorage, no own cookies, no analytics** without updating the notice in the same commit. The catalog's quote list deliberately uses `sessionStorage` (product ids and quantities only, cleared when the tab closes) and the notice says exactly that.
- **Add a new third party → disclose it.** Any new embed, form processor or tracking tool means a new bullet in sections 4 and 5 of the notice.

⚠️ The notice identifies the responsable by commercial name and the Matriz address. **The user still has to confirm the razón social with their accountant/lawyer**, and the whole document should be reviewed by a lawyer before being relied on.

## Fiscal and legal claims — be careful

The FAQ in `contacto.html` answers "¿Facturan?". Two rules, both learned the hard way on 2026-09-19:

- **Never ask the customer for their Constancia de Situación Fiscal — it is a fineable offence.** Under CFF art. 83 fr. IX conditioning a CFDI on handing over the CSF is an infraction, sanctioned by art. 84 with **$21,420 to $122,440**, and preventive closure of 3–15 days on repeat. Invoicing needs four data points — RFC, razón social o nombre, código postal fiscal, régimen fiscal — plus an email. The CSF carries far more (CURP, home address, phone, economic activities), so asking for it collects personal data well beyond what the purpose needs, which cuts against the proportionality principle of the LFPDPPP and against the privacy notice this repo publishes. The page now states plainly that it is **not** required.
- **Never state a shorter deadline than the law gives.** An earlier version asserted "una vez cerrado el mes, el SAT ya no permite emitirla con esa fecha". **That was false.** The SAT's position is that the invoice may be requested **throughout the same fiscal year** of the operation, and refusing it merely because the month closed is itself an improper practice. The page now says so.

> 🔎 **You CAN research from here.** `curl` and `WebFetch` on most sites are blocked by the egress proxy, but the **`WebSearch` tool works** and was what settled both points above. Don't conclude "no internet" from a failed `curl` — try `WebSearch` first. Some domains are still blocked to `WebFetch`, so prefer `WebSearch` and cross-check across several results.

General principle: for anything fiscal, legal or about deadlines, **verify with `WebSearch` before writing**, prefer describing what RAMAR *does* over what the law *says*, and still tell the user to have their contador or abogado confirm.

## Copy audit — 2026-09-21

The user reported that people were telling him the site had spelling mistakes. A
full pass over all visible text (139,859 characters across the 8 pages, including
what the JS renders) found 20 items. UTF-8 is clean on every page — there is no
mojibake, so don't go looking for one.

**Facts the user confirmed in that conversation, which the copy now reflects:**

- **Corte a medida = placa y piezas de perfil tubular.** For any other material
  the customer is told to ask in the branch. This was previously an unqualified
  "Dimensionamos el material según las necesidades exactas de tu proyecto", which
  contradicted the catalog (Lámina Negra "no se dobla ni se corta"; tablero de
  portones "sin corte a medida").
- **Polín Z is not stocked** — only Polín C (Canal Monten). The guide's advice to
  prefer Z over C for vanos > 6 m was removed; it now says to ask in the branch.
- **Electrode 6011 is not stocked** — the catalog carries 6013 and 7018 only. The
  6011 card was removed from `guia.html` along with its now-dead
  `.electrode-6011` CSS rules.
- **The Ejutla distributor's email stays as it is**, even though it contains
  `perfilesantequera`. The user decided that explicitly. It is the only remaining
  trace of that trade name on the site — do not "clean" it without asking.

**Spelling and consistency rules established:**

- `Lozacero`, never `Losacero`, and never `FortaDeck` or its `FD15/FD25/FD30`
  model codes. The product's SVG said "LOSACERO / FORTADECK"; it now says
  "LOZACERO" and the models read `Lozacero 15 / 25 / 30`.
- **`acero al carbón`**, not `al carbono`. Both forms were in use; the site was
  unified to `al carbón`, which is what customers say. `al carbono` is the more
  technically correct term if the user ever prefers it.
- **`Construaceros RAMAR`** in full caps. All 8 footers said
  "Construaceros Ramar".
- **`Av. del Valle`** — lowercase `del`, including inside the JSON-LD
  `streetAddress`.
- **No `®`** on the slogans. `ubicaciones.html` had "Somos tu soporte de Acero®",
  which asserts a registered trademark. Don't reintroduce it unless the user
  confirms the mark is registered.
- `Espacia` (no accent) is the imperative of *espaciar* — `Espacía` is wrong.

**Still open, waiting on the user:**

- **Calibre table in `guia.html`.** Rows for cal. **12** and **13** were exact
  duplicates of cal. **9** and **11**, which made cal. 12 read thicker than
  cal. 10 and 11 and contradicted the table's own headline ("número más alto =
  material más delgado"). A row labelled **`2/4`** (0.8750") is not a gauge
  designation at all. All three rows were **removed** on the user's instruction
  ("quita esas calibres") rather than guessed at. If he supplies the real values,
  add them back; if the `2/4` row meant plate sold by fraction, it belongs in a
  separate table, not in a gauge column.
- **Lozacero calibre.** The entry claimed "Cal. 18 al 24 · Peso 6.72–13.68 kg/m²".
  Per the rule above it is **solo cal. 22**, so the range was replaced with
  "Solo cal. 22" and the weight range dropped — it covered calibres that aren't
  sold. The kg/m² for cal. 22 alone is unknown; ask before writing one.
- **`guia.html` still recommends `PTR 4"×4"`** — corrected from cal. 12 to
  cal. 11, because the PTR table says 4" exists only in cal. 11.
- **Over-technical tips.** Several `Tip` fields still use language the user asked
  to avoid: `hss` cites ASTM A500, `barra-hueca` talks about presión hidráulica
  and ST-52, `placa-acero` about oxicorte. Not changed — flagged only.

## Performance — what was measured, and what not to re-try

Measured 2026-09-21 with Chromium: 360 px viewport, Fast 3G (1.6 Mbps / 150 ms),
CPU throttled 4×, 3 runs per page, scrolling the full page so lazy images enter
the viewport.

**CLS is 0.000 on all 8 pages.** All three runs, every page.

**Do not "fix" the missing `width`/`height` attributes on `<img>`.** None of the
24 `<img>` tags carry them, and it does not matter: the CSS already reserves the
box for every image, so nothing can shift.

| Class | What reserves the space |
|---|---|
| `.pcard-photo` | `height: 188px` (fixed) — covers the ~85 hotlinked supplier photos |
| `.tip-watermark` | `260px × 260px` (fixed) |
| `.promo-img` | `aspect-ratio: 4 / 3` |
| `.brand-logo` | `max-width` / `max-height` |
| Hero slides | CSS `background-image`, not `<img>` |

Adding the attributes would be a neutral change: more markup to maintain, zero
measurable gain. Per the performance-optimization skill, neutral is a revert.

Caveat on the measurement: external requests (Google Fonts, Font Awesome, the
hotlinked supplier photos) were aborted, because the egress proxy blocks them and
they hang the run. That turns out not to weaken the conclusion — `.pcard-photo`
has a fixed height, so those photos cannot shift anything whether they load or
not. `.pmodal-photo` has only `max-height: 260px`, but it renders inside a modal
the visitor opens, so any shift carries `hadRecentInput` and is excluded from CLS
by definition.

**If CLS ever needs re-measuring**, the script pattern is in the session notes:
`PerformanceObserver` on `layout-shift` with `buffered: true`, injected via
`addInitScript`, plus `Emulation.setCPUThrottlingRate` and
`Network.emulateNetworkConditions` over CDP.

## Promociones (`index.html`)

A `PROMOS` array inside `index.html`, rendered into `#promos-grid`. Sits between
the stats bar and the product categories, so it is the first thing after the hero.

- **The section carries `hidden` in the HTML.** The script removes it only when
  there is at least one live promo. Empty list, or a JS failure → stays hidden.
  Never show an empty block or an expired promo.
- Each entry: `titulo`, `texto` (accepts `<strong>`), `img`, `alt`, `hasta`
  (`'YYYY-MM-DD'`, inclusive), `wa` (URL-encoded). `img` and `wa` are optional —
  without `img` the card renders text-only, which looks fine.
- **Expiry is automatic**: `hasta` is compared as a string against today's local
  date (ISO dates sort chronologically). The day after `hasta`, the promo
  disappears on its own — nobody has to remember to remove it.
- `.promo-img` uses `aspect-ratio: 4/3` plus explicit `width`/`height` so the
  text doesn't jump while the photo loads (CLS).
- WhatsApp goes to `5219512283263` (the general number, same as the navbar).
- Image rules are the same as everywhere: landscape, under 500 KB, and **never
  overwrite a published filename** — `_headers` caches images for a year.

⚠️ `verificar.js` scans for `assets/images/…` references **even inside JS
comments**. The commented-out example entry deliberately uses
`ramar-promo-<nombre>.jpg` so the angle brackets break the regex; don't "fix" it
into a real-looking path or the check will fail on a file that doesn't exist.

**Pulling promos automatically from Facebook was considered and deliberately not
built** (2026-09-21). Reading a page's photos through the Graph API needs App
Review plus Business Verification (~20 days, frequently rejected) and a token
that expires every ~60 days and would fail silently. Worse, a blind pull would
put birthday and holiday posts into the site, portrait and 1–2 MB. If it is ever
revisited, the agreed design is: the user curates a Facebook album named `WEB`,
a scheduled job reads **only that album**, and it opens a PR rather than
publishing directly. Note that a server-side pull sends no visitor data to Meta,
so it would **not** require changing `aviso-privacidad.html` — but embedding any
new Meta widget on the page would.

## Quote list (`catalogo.html`)

`lista` is a `Map` of product id → `{producto, cantidad}`, mirrored into `sessionStorage` under `ramar-cotizacion` as `[[id, cantidad], …]`. `enviarLista()` builds one WhatsApp message with every line. The target number comes from `waDeSucursal()`.

**`SUCURSALES_WA` lists all 8 branches**, confirmed on 2026-09-21 against the company's printed branch directory. In that directory the numbers under **"Teléfono" are landlines** and those under **"Celular" are the ones that take WhatsApp** — that is the rule to apply for any new number.

⚠️ **One unresolved conflict:** the directory lists Matriz's **951 533 6045** and **951 549 4636** under *Teléfono*, but they are published as WhatsApp and have been working that way. They were left as WhatsApp; ask the user before changing.

⚠️ The directory also lists **10 celulares for Matriz** and the site shows 3. The other 7 (951 227 5121, 951 322 1154, 951 228 7621, 951 228 3683, 951 271 1683, 951 476 9740, 951 204 5998, 951 350 3587, 951 475 5306) were **not** added: 14 phone chips on one card is unreadable. Decide with the user where they belong — likely the Telemarketing section of `contacto.html`.

## Content Rules

- The catalog (products) lives **ONLY** in `catalogo.html`. Never split into sub-pages, never add product listings to `index.html`. Sub-catalog files (`catalogo-comercial.html`, `catalogo-estructural.html`, `catalogo-especializado.html`, `catalogo-pintura.html`) were deleted on 2026-05-05 by user request — do not recreate them.

### Reading a warehouse photo — finish and shape (told by the user 2026-09-21)

Before placing any photo on a product, identify **shape** and **finish**. Putting
a photo on the wrong product is worse than leaving the supplier hotlink.

**Shape** — the user's own words for what look similar in a photo:

| He calls it | Catalog product |
|---|---|
| **Monten** | `polin-c` — Canal Monten / Polín C. C-channel with inward lips |
| **Cuadrado** | `ptr-c` — PTR Cuadrado. Closed square section |
| **Tubular** | rectangular tube — `ptr-r`. He names it apart from "cuadrado" |

**Finish** — by the colour of the *material itself*, not of the painted ends:

| Colour of the steel | What it is |
|---|---|
| **Verde** | **Galvanizado** |
| **Gris claro / medio claro** | **Galvanizado** too, a different type |
| **Negro** | Acero negro (the sheet version is sold as *Lámina Negra*) |
| Bright, mirror-like | Inoxidable — none of the photos so far |

⛔ **The painted ends are an internal code. NEVER publish it or explain it.**

RAMAR paints the cut ends **azul, naranja, amarillo, blanco** to identify the
**calibre** in the warehouse. They keep their own colour-to-calibre chart. The
user was explicit: *"eso no agregues… nosotros lo tenemos así para identificarlo
en la bodega, pero nadie sabe por qué lo pintamos así"*. Treat it like the RAMAR
acronym — it stays out of the site, the product text, the `alt` attributes and
the commit messages.

⚠️ **Correction to an earlier note.** The commit that added
`ramar-angulo-l-estibado.jpg` claimed "los cantos pintados de amarillo, verde y
azul son la marca de medida". That conflated two different things: **green is a
galvanised finish of the steel**, while **yellow, blue, orange and white are the
painted calibre code**. Don't repeat the conflation.

Practical consequence: **ask for the rack label.** The user's racks are labelled
("CHAMBRANA L", "15", "13", "14"), and that label settles the identification
faster than any visual guess. It is what resolved the chambrana question.

### Warehouse vocabulary the user taught (2026-09-21)

**Rack labels are measured in metres, and `82` means 82 cm.** Confirmed by the
user: *"si es 0.82, pues es centímetro"*. So a label reading `4.88 X 82` is
4.88 m × 0.82 m. That is how the real measurements for `lamina-zincalum`
(largos 4.27 / 4.88 / 5.50 m, anchos 0.82 y 1.08 m) and `lamina-acrilica`
(2.44 × 0.82 m and 3.05 × 0.82 m) were finally written — read off his own rack
labels, not guessed.

**Window profiles are asked for by the *ceja*.** The user: *"si es de una ceja,
posiblemente sí, para ventanas… está la de una ceja, dos cejas, en escalera"*.
So the stepped profile that took three photo batches to identify belongs to
`perfiles-ventana` — it is the *escalonado* (clave 122). `perfiles-ventana` now
carries a `Cómo pedirlo` spec with that vocabulary, because that is how the
customer says it at the counter.

**Two different round pipes — do not mix them up:**

| What it looks like | What it is |
|---|---|
| Black, unthreaded, rack says `TUBO NEGRO` | `tubos-negros` — gas LP, air, structure |
| **Grey (galvanised), blue-painted end, threaded** | `tubo-galvanizado-agua` — **water under pressure** |

The user described the second one specifically: *"tiene como una tapa azul y es
así como gris, y tiene enroscado para conectarlos… ese lo ocupan para
transportar agua con alta presión"*. It was **missing from the catalog** and was
added on 2026-09-21. Verified by research: galvanised cédula 40 with threaded
ends is made to ASTM A-53 / NMX-B-177 Grade A, hot-dip galvanised inside and
out, for water, gas and compressed air. Its diameters and lengths were **not**
written — ask the user.

Note this is *not* the same as `tubo-cerquero`, which is also galvanised cédula
40 but made to NMX-H-077 and sold for corrals and fences.

**Most steel arrives in one of two finishes** — plain *acero negro* or
*galvanizado*. Either one can come in; don't assume a single finish per product.

**`cortina-metalica` usage examples** were made concrete at the user's request
(*"da ejemplos"*): abarrotes, farmacia, papelería, taller mecánico, local de
plaza, bodega, cochera, estacionamiento.

**"Lámina tecate" = lámina de lata = hojalata.** Added as `lamina-lata` on
2026-09-21 at the user's instruction (*"busca una comparación y ya lo agregas"*).
The gold colour has a cause: **hojalata is low-carbon steel coated on both faces
with tin (estaño), not zinc.** Because the tin bonds firmly, the sheet can be
cut, bent, stamped and punched by hand without the coating flaking — which is
exactly why RAMAR's *hojalateros* buy it. Locally also called *corcholata*.

It is **not** a roofing sheet for the weather; galvanizada and Zinc Alum are.

Its `TABLE_HTML` entry is a **comparison table against RAMAR's other sheets**,
built because the user asked for the comparison. The axis is the coating:
lata = tin · negra = bare steel · galvanizada / acanalada / galvateja = zinc ·
Zinc Alum = zinc *and* aluminium · Pintro = zinc plus baked paint. Those coating
facts were verified by research, not assumed.

⚠️ Two things about `lamina-lata` still need the user: its **real medidas** (the
85 × 90 cm and 1.70 m figures found online belong to *other* stores and were
deliberately not written — the spec says "pregunta por la medida"), and a
**photo**. It currently carries an inline SVG because it was never clear which
of the warehouse photos showed the golden sheet.

### Two products the warehouse photos revealed were missing (2026-09-21)

Both were absent from the catalog until the user's photos surfaced them. Facts
below come from research, not assumption; anything RAMAR-specific says
"pregunta".

**`lamina-antiderrapante` — Lámina Antiderrapante.** Hot-rolled steel sheet with
a raised **diamond** pattern, made to **ASTM A-786 / A-786M** (that norm defines
the relief geometry and the thickness tolerance). Grades SAE-1008, SAE-1010 and
ASTM A-36. Standard sheet formats in Mexico are 3′×8′, 3′×10′, 4′×8′ and 4′×10′.
For foot traffic a thin gauge is enough; for forklifts and vehicles, 1/8″ to 1/4″.
RAMAR's own thicknesses were **not** written. Note the plate is also the
warehouse's own floor, visible in other photos.

**`reja-acero-panel` — Reja de Acero, panel soldado.** Galvanised steel rod
joined by electric welding and finished with **thermoset polyester baked paint**.
Panels are **2.50 m wide**, with standard heights 0.62 / 1.00 / 1.50 / 2.00 /
2.50 / 3.00 m. White and green are the usual immediate-delivery colours; the
user's photo shows white. Takes concertina or barbed wire on top.

**Do not confuse it with `malla-ciclonica`.** The reja arrives as a *rigid panel*
and does not get tensioned; the ciclónica is rolled chain-link that does. That
distinction is in the product's Tip because a customer asking for "malla" could
mean either.

⚠️ **A person appeared in one of the source photos** (an employee at the right
edge of the reja shot). The crop was tightened to exclude them: the repository is
public and `aviso-privacidad.html` covers visitors' data, not third parties'
likeness. Apply the same care to every future warehouse photo.

### ⛔ The catalog does not teach. Say what it is and what it's for — nothing else.

The user was explicit on 2026-09-21, after a batch of new products came out
explanatory: *"no quiero que me le expliques al cliente… posiblemente te pedí una
explicación, pero para que TÚ te dieras cuenta de cómo era. Para que el cliente
luego piensa que nosotros le vemos la cara de zonzo."*

So: **research as much as needed to place a product correctly, then leave the
lesson out of the page.** The explanation is for whoever is writing the entry,
not for the buyer. The buyer is a herrero, a tornero, a constructor — they know
their trade better than the site does, and a lecture reads as condescension.

What an entry carries: a one-line `tagline`, medidas / calibres / acabado, a
short `Usos`, and at most one practical `Tip`. What it does **not** carry:

- why a material is the colour it is, or how its coating works
- norm numbers as teaching material (`ASTM A-786`, `NMX-B-177`, tin vs zinc)
- "no lo confundas con X" comparisons between products
- comparison tables built to explain a category

Four products added that night were rewritten down to that shape
(`lamina-antiderrapante`, `reja-acero-panel`, `tubo-galvanizado-agua`,
`lamina-lata`), and the comparison table that had been added to `lamina-lata`
was **deleted** — the user had asked for that comparison so the assistant would
understand the product, not so it would ship.

This extends the existing tip rule (avoid ASTM grades, hydraulic pressures, SAE
formulas): it is not only about being too technical, it is about not explaining
at all. **El maestro especialista orienta en sucursal.**

### ⛔ No prices. Crop them out of photos.

The site publishes **no prices**, on purpose — `contacto.html` answers *"¿Por qué
no veo los precios en la página?"* with the real reason: steel moves, a published
price would be wrong within days. Keep it that way.

That extends to **photos of the shop floor**. On 2026-09-22 a counter photo of a
Phillips handleset arrived with a **$717.66** price starburst, a neighbouring
item's **$436.05**, and a handwritten internal code (**6651**) on an orange tag.
The crop was tightened to leave all three out, keeping only the product and its
packaging. Do the same every time: price tags, internal SKU tags and shelf codes
do not go on the site.

The internal code was also **not** published as a model number — it looks like a
RAMAR shelf tag, not a Phillips reference. `phillips-gatillo` says "pregunta por
el modelo" until the user confirms one.

### Catalog content rules (RAMAR-specific reality)

Nayvi Padilla (redes) reviewed the catalog in 2026-06. The 96 products reflect what RAMAR **actually stocks in Oaxaca** — don't let generic steel-industry knowledge override these:

- **PTR**: never use "Serie C"/"Serie R" code naming — customers ask by calibre, not code. PTR Cuadrado: cal. 11 is the main one; cal. 12, 14, 16 only in select sizes. PTR Rectangular: only cal. 11, 14, 16. All 6 m.
- **PTR Regiopytsa**: rectangular in cal. 18, 20, 22 (the best sellers).
- **HSS**: only square 4"–12". Espesores in **fraction of inch**, never mm. No kg/m column.
- **Vigas IPR**: peraltes 6, 8, 10, 12, 14 only (no 4").
- **Rejilla electroforjada**: one medida only (1/8"×1", panel 1×6 m, 140 kg).
- **Lámina HR is named "Lámina Negra"** (id stays `lamina-hr`). No "HR"/"CR"/"fría"/A-36/A572 wording. Cal. 14–26. No se dobla ni se corta.
- **Cold Rolled (`lamina-fria`)** is a redirect product — consult Aceros RAMAR.
- **Lámina Galvanizada**: G-45 (not G-60). **Pintro**: solo color rojo. **Galvateja**: solo cal. 26 (Plus = térmica).
- **Lozacero** (not "Losacero"/"FortaDeck"): solo cal. 22.
- **Tablero portones**: solo modelo 170, anchos 2–10", sin corte a medida.
- **Paint is PintuMex, and paint only.** RAMAR does **NOT** sell impermeabilizantes — the `impermeabilizante` product and its `TABLE_HTML` entry were removed on 2026-09-17 by user request, along with the home tip "¿Cuánto dura el imper?" and `assets/images/tips/imper.svg`. Don't reintroduce waterproofing products, IMPERFIBRA or AQUAMAR lines under any name.
- **Pinturas vinílicas**: solo SUPERVIN, OMAR, VINET, KOLORTEX, CH14 (sobre pedido). ESMAFLEX is rezago — never list it.
- **Primario anticorrosivo**: solo Rojo Óxido (1L, ¼, galón, cubeta).
- **Tubería cédula**: solo Ced. 30 y 40. Pared varies by medida, not cédula. Se maneja en mm.
- **Nylamid**: barras hasta 8" Ø; placas ½/¾/1" de 60×60 cm; solo blanco normal (no autolubricado G).
- **Acero maquinaria**: 1018 en redondo/hexagonal/cuadrado; 1045 y 4140 solo redondo; hexagonal hasta 1½".
- **Bronce**: solo redondos 9¾"–10". **Latón**: solo redondos + cuadrado ¾; no solera.
- **Cerraduras Phillips**: only the surviving models (715 AS/CL/IF/LL, 620, 625 DC, AS 625, 775, 800/CH/MAX, 850, 875, X-900/MAX). Mueble and aluminio lines were removed for low rotation — don't re-add.
- **Bisagras PHV**: solo pulidas, no 7/8". **Jaladeras**: solo Estriada y Trenzada, aluminio, atornilladas.
- **Lanzas**: Forjada, Romana CH/G, Barroco, Azteca, Samurai, Árabe, Contemporáneo (±protección), Flor de Liz (±protección), Galo, Gótico, Puflé 107/105. **No alfanje.**
- **Soldadoras**: NO AXTech MIG/TIG, NO Lincoln. Sí: AXT, WF, Línea VOLT (bivoltaje). Microalambre 5 kg y 1 kg.
  - ⚠️ **"NO Lincoln" applies to the *machines* only.** The **electrodes are Lincoln** — the user said so on 2026-09-22 and `electrodo-6013`, `electrodo-7018` and `electrodo-6010` carry `provider:'Lincoln'`. Don't strip that badge thinking of the soldadora rule.
- **Electrodos** (all Lincoln), with the diameters the user gave on 2026-09-22:
  - **6013** — 1/8" · 3/32"
  - **7018** — 1/8" · **5/32"** · 3/32"
  - **6010** — 1/8" only. It was **missing from the catalog** and was added that day.
  - Note the guide's electrode section used to show a **6011** card. It was removed on 2026-09-21 for not being stocked, and that turned out right — what RAMAR carries is **6010**, a different electrode. Don't reintroduce 6011.
- **Herramienta**: Oakland es marca de casa. Rotomartillo = SDS Oakland 800W MR-3100 c/maletín. Compresores Goni Mod. 977 y 940 con accesorios.
- **Truper manual**: NO diablos, paletas, cinceles ni crowbar. Carretilla única: 4.5 ft³ neumática Truper 11740.
- **Tips**: avoid over-technical language (ASTM grades, hydraulic pressures, SAE formulas) — el maestro especialista orienta en sucursal.

### Phone numbers — fijo vs WhatsApp (NOT interchangeable)

- Navbar + floating button: `951 228 3263` → WhatsApp `https://wa.me/5219512283263` (never `tel:`)

### Social links — always use the `www.` form

`https://www.facebook.com/ConstruacerosRamarOficial` · `https://www.instagram.com/ramar.oficial` · `https://www.tiktok.com/@ramar.oficial`

Dropping `www` broke Facebook and TikTok for real users (TikTok in particular does not serve the bare domain reliably). The Facebook page plugin iframe is a *bonus*, never the only content in its panel: tracking protection blocks it often, which left the panel looking empty — the "Abrir nuestro Facebook" button sits above the iframe for that reason.
- Matriz fijo: `951 517 3157`, `951 533 6831` → `tel:` links, `fa-solid fa-phone` icon
- Matriz WhatsApp: `951 533 6045`, `951 549 4636` → `wa.me` links, `fa-brands fa-whatsapp` icon
- Viguera WhatsApp `951 416 0571`/`951 228 3259`, fijo `951 229 1055` · La Unión WhatsApp `951 272 1019`/`951 228 3269`

## Deployment

**Migrated off Netlify to Cloudflare on 2026-09-21.** Netlify is no longer the
host — do not send anyone there, and do not reintroduce `construacerosramar.netlify.app`
in `canonical`, `og:url`, `sitemap.xml` or `robots.txt`.

- **Cloudflare** (canonical): https://construacerosramar.mx — a **Worker with
  static assets**, not Cloudflare Pages. The dashboard steers new projects to
  Workers now, so that is what this is: project `web-ramar`, direct URL
  `web-ramar.motocrossmiguel.workers.dev`.
- **GitHub Pages** (backup): https://miguelk876.github.io/web-ramar/

Both auto-deploy on `git push origin main`. Cloudflare reads `_headers` for
static assets exactly as Netlify did, so the security and cache policy carried
over unchanged. GitHub Pages ignores `_headers` — security headers there are
defaults.

**`wrangler.jsonc` is what makes it work.** Without it, `npx wrangler deploy`
publishes an empty Worker: the build reports "Success", and the dashboard shows
*No URLs enabled*, *Bindings 0* and zero invocations. It happened on the first
attempt. The config declares `assets.directory: "./"` and no `main`, because
there is no server code. `.assetsignore` keeps `CLAUDE.md`, `README.md`,
`scripts/` and `.claude/` out of what gets served.

DNS: the domain stays **registered at Akky**, with nameservers delegated to
Cloudflare (`ben.ns.cloudflare.com`, `betty.ns.cloudflare.com`). The zone holds
a Worker route on the apex, a proxied `CNAME www → construacerosramar.mx`, and
the `google-site-verification` TXT for Search Console — **don't delete that TXT.**

### Why the move — and the deploy discipline that goes with it

Netlify moved to a **credits** model (Sept 2025): 300 credits/month on the free
plan, **15 credits per production deploy**, so roughly **20 deploys a month**, and
when they run out **every site on the team is paused** and visitors get a "Site
not available" page until the cycle resets. That is what happened: seven pushes
to `main` in one day exhausted it. It was not traffic.

Cloudflare's free plan has unmetered static-asset bandwidth and 500 builds a
month, so the same mistake costs nothing. **But batch changes and push once
anyway** — a deploy per fix is sloppy regardless of who is paying.

To force redeploy without changes: `git commit --allow-empty -m "chore: redeploy" && git push`.

✅ **Verified 2026-09-21:** Cloudflare *is* serving the `_headers` policy.
securityheaders.com graded `construacerosramar.mx` an **A** and reported
`Content-Security-Policy`, `Permissions-Policy`, `Referrer-Policy`,
`X-Content-Type-Options` and `X-Frame-Options` all present. Nothing was lost in
the migration. (The grade was capped at A because that scan went over `http://`,
where HSTS is not sent — re-scan over `https://` to see it.)

Note for future sessions: the egress proxy blocks HTTP to
`construacerosramar.mx` and to `*.workers.dev` from this environment, so the
live site cannot be fetched from here. DNS *can* be queried — `dig` is absent but
`pip install dnspython` works, and querying `ben.ns.cloudflare.com` directly is
how the records were confirmed during the migration. For anything that needs a
real HTTP response, ask the user or use an external scanner.
