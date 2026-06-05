# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static marketing website for **Construaceros RAMAR**, a B2B steel/construction materials distributor based in Oaxaca, Mexico. Vanilla HTML5, CSS3, and JavaScript — no build system, no package manager, no frameworks. All copy is in Spanish.

## Development

Serve the root directory with any static file server:
```bash
npx serve .
# or
python -m http.server 8080
```

There are no build, lint, or test commands — files are served as-is.

## Architecture

11 HTML pages linked with standard `<a href="...">` navigation (no SPA router):

- `index.html` — homepage with hero
- `nosotros.html` — company history and values
- `catalogo.html` — **primary product browser** (see below). All product data lives here.
- `catalogo-comercial.html`, `catalogo-estructural.html`, `catalogo-especializado.html`, `catalogo-pintura.html` — **legacy** static product pages, kept for SEO/sitemap; not the entry point users hit from the navbar.
- `guia.html` — "¿Qué material necesito?" guide with project-type filters
- `ubicaciones.html` — branch locations with embedded Google Maps iframes
- `contacto.html` — contact info and form
- `gracias.html` — post-form thank-you (`<meta name="robots" content="noindex">`)

`sitemap.xml` and `robots.txt` are hand-maintained — update `sitemap.xml` when adding a new page.

### Shared chrome (no server-side includes)

Every page **copy-pastes** the same `<header class="navbar">` and `<footer>` blocks. There is no template engine. When you change anything in the navbar or footer (link, phone number, logo, CTA), you must edit *every* HTML file. The phone link is `tel:9512283263`.

A WhatsApp floating button (`.whatsapp-float`, link `https://wa.me/5219512283263`) appears on most pages — copy from an existing page when adding to a new one.

### Phone numbers — fijo vs WhatsApp

These are NOT interchangeable, despite past code that mixed them. Always label which is which when adding new UI:

- **Matriz teléfono fijo**: `951 517 3157`, `951 533 6831`
- **Matriz WhatsApp**: `951 533 6045`, `951 549 4636`
- **Viguera WhatsApp**: `951 416 0571`, `951 228 3259`. Tel. fijo: `951 229 1055`. Email: `ramar.viguera@gmail.com`
- **La Unión WhatsApp** (ambos): `951 272 1019`, `951 228 3269`. Email: `ramar.union@gmail.com`
- **Navbar/floating WhatsApp button**: `5219512283263` (this is a separate aggregated number)

Use `<i class="fa-brands fa-whatsapp" style="color:#25D366">` for WhatsApp and `<i class="fa-solid fa-phone">` for landline so the user can tell them apart visually.

### Styling

`styles.css` is the single stylesheet for every page. CSS custom properties at the top of `:root` — use them for new colors/fonts:

- `--color-blue: #1C2B54` (primary brand)
- `--color-yellow: #F08018` (accent)
- `--color-red: #DD3B2E` (secondary accent)
- `--font-heading: 'Oswald'`, `--font-body: 'Inter'`

Mobile breakpoint is `@media (max-width: 900px)` — that's where the hamburger activates. Match it in any new layout code.

Fonts (Oswald + Inter) and Font Awesome 6.4.0 are loaded from CDN via `<link>` in each page's `<head>` — no local installs.

### JS

`main.js` (only ~86 lines) handles two global behaviors used across all pages:
1. Mobile hamburger menu toggle.
2. Scroll fade-in: any element with `class="fade-in"` animates in via `IntersectionObserver`. There is an 800 ms `setTimeout` fallback that forces `.visible` on all `.fade-in` elements in case the observer fires late — keep this when refactoring.

`catalogo.html` has its own large inline `<script>` (see below) that is independent of `main.js`.

## Catalog architecture (`catalogo.html`)

This is the most complex file in the repo (~1,900 lines after Nayvi's 2026-06 product cleanup; was ~2,600 before) and the only place that needs explaining beyond the file name.

**Two-level UI inside one page:**
1. Category menu (`#cat-menu`) — 8 cards, one per category.
2. Product grid (`#cat-products`) — appears after a category is selected, with a back button, search box, and grid of cards.

Categories (use these exact `cat:` keys): `estructural`, `comercial`, `especializado`, `pintura`, `herramienta`, `consumibles`, `herrajes`, `cerraduras`. Display labels live in `CAT_NAMES` and `CAT_LABELS_FULL` near the bottom of the inline script.

**Single source of truth for products** — the `PRODUCTS` array (around line 873). Currently **75 products** total (down from 157 after Nayvi Padilla's review removed everything RAMAR doesn't actually sell — don't re-add deleted SKUs without confirmation). Per-category counts: 19 comercial · 18 cerraduras · 8 estructural · 8 herrajes · 7 herramienta · 5 consumibles · 5 especializado · 5 pintura. Each entry has roughly:
```js
{ id, cat, provider, name, tagline, svg, svgNote, specs:[{i,l,v}], page, wa, photo, photoPos? }
```
- `id` is used by the modal and by `TABLE_HTML` lookups.
- `wa` is the URL-encoded product name appended to the WhatsApp deep link (`https://wa.me/5219512283263?text=Hola%2C%20quiero%20cotizar%3A%20${p.wa}`).
- `photo` is an external product image URL (Serviacero, Ternium, Lámitec, etc. — **not** Pexels). If absent or it errors, the inline `svg` is shown and there's an `onerror` fallback to `assets/images/placeholder-industrial.jpg`.
- `photoPos` (optional) sets `object-position` on the `<img>` for fine-tuning crop.

**Detail tables** — `TABLE_HTML` (around line 1690) maps product `id` → an HTML table string shown inside the modal. Currently has 20 entries; not every product has a table; `openModal` injects it conditionally. When you delete a product from `PRODUCTS`, also delete its matching `TABLE_HTML[id]` entry to keep the file clean.

**Routing** — `location.hash` is the deep link mechanism: `catalogo.html#estructural` opens that category on load (handled by the IIFE near the bottom of the script). When adding a new category key, also update the `validCats` whitelist in that IIFE and the per-category counter loop just below it.

**When adding a product:**
1. Add an entry to `PRODUCTS` with the right `cat`. Set `provider` if it's from one of the supported brands, otherwise omit.
2. Optionally add a `TABLE_HTML[id]` entry if you have detailed measurements.
3. The category counter, search, modal, and grid all auto-update — no other code changes needed.

**Brand logos** live in `assets/images/brands/` (e.g. `prolamsa.svg`, `ternium.svg`, `fortacero.png`, `pintumex.png`, `tyasa.svg`, `truper.svg`, `dewalt.png`, `makita.png`). When adding a new provider, drop the logo here and reference it from the relevant section.

### Catalog content rules (RAMAR-specific reality)

Nayvi Padilla (redes) reviewed the catalog in 2026-06 and the surviving products reflect what RAMAR **actually stocks in Oaxaca**. Don't let LLM "knowledge" of common steel products override these — RAMAR's reality differs from generic distributor catalogs:

- **PTR**: don't reintroduce "Serie R" code naming for rectangular — customers ask by calibre, not by code. PTR Cuadrado: cal. 11 is the main one; cal. 12, 14 and 16 only in select sizes. PTR Rectangular: only cal. 11, 14 and 16.
- **HSS**: only square 4"–12" (no rectangular, no >12"). Espesores in **fraction of inch**, never in mm. No kg/m column.
- **Vigas**: peraltes 6, 8, 10, 12, 14 only (no 4").
- **Rejilla electroforjada**: only one medida (1/8"×1", panel 1×6 m, 140 kg).
- **Lámina HR is named "Lámina Negra"** in the catalog. Don't use "fría" / "HR" / "CR" naming — those terms aren't used at counter.
- **Cold Rolled (`lamina-fria` id)** is a *redirect product* — tagline tells customer to consult Aceros RAMAR directly, doesn't pretend to stock it.
- **Pintro**: solo color rojo. **Galvateja**: solo cal. 26 (Plus es la térmica).
- **Pinturas vinílicas**: solo OMAR, SUPERVIN, VINET, KOLORTEX, CH14. ESMAFLEX is rezago — don't add it to esmaltes list.
- **Primario anticorrosivo**: solo Rojo Óxido.
- **Tubería cédula**: solo Ced. 30 y 40 (no Ced. 80). Pared cambia según medida, no según cédula.
- **Lámitec**: solo `lamitec-elegance` (Estampado Portones, 10 pzas en stock) y `lamitec-perfotec` (Duela Perforada España/Marruecos). El resto ya no se maneja — no los regreses.
- **Cerraduras Phillips**: solo los modelos que sobrevivieron al review (715 AS/CL/IF/LL, 620, 625 DC, AS 625, 775, 800/CH/MAX, 850, 875, X-900/MAX). Todo lo de mueble y aluminio se eliminó por baja rotación.
- **Bisagras PHV**: solo pulidas, no 7/8". **Jaladeras**: solo Estriada y Trenzada en aluminio (atornilladas, no soldables).
- **Lanzas decorativas**: lista correcta es Forjada, Romana CH y G, Barroco, Azteca, Samurai, Árabe, Contemporáneo (con/sin protección), Flor de Liz (con/sin protección), Galo, Gótico, Puflé 107 y 105. **No alfanje** (no se maneja).
- **Soldadoras**: NO MIG/TIG AXTech, NO Lincoln. Marcas que sí: AXT, WF, Línea VOLT (bivoltaje). Microalambre solo de 5 kg y 1 kg.
- **Herramienta**: Oakland es marca propia que sí se maneja. Rotomartillo concreto = SDS Oakland 800W MR-3100 (modelo específico). Compresores Goni Mod. 977 y 940 con accesorios incluidos.
- **Herramienta manual Truper**: NO diablos, NO paletas, NO cinceles, NO crowbar. Sí carretilla 4.5 ft³ neumática Truper 11740 (única).
- **Tips técnicos**: evitar lenguaje muy técnico (grados ASTM, presiones hidráulicas específicas, fórmulas de SAE). El maestro especialista los maneja en sucursal; el sitio se enfoca en el cliente.

## Legacy catalog sub-pages

`catalogo-comercial.html` / `catalogo-estructural.html` / `catalogo-especializado.html` / `catalogo-pintura.html` use a different, older pattern: each product is a `.product-block` with an `accent-*` modifier, containing a `.pv-wrap` row (`.pv-svg` inline drawing + `.pv-photo` `<img>`) and a `.product-grid-3` (Medidas / Usos comunes / Recomendación RAMAR). These pages still resolve and are linked from the sitemap, but new products should be added to the `PRODUCTS` array in `catalogo.html`, not here. Only edit these if the user explicitly asks for the static-page format.

## Patterns to follow

- **Adding a page**: copy the closest existing page, update content, manually add a nav link to *every* page's header, and add an entry to `sitemap.xml`.
- **Scroll animations**: add `class="fade-in"` to any element that should animate in on scroll — the `IntersectionObserver` in `main.js` handles it automatically.
- **Google Maps embeds**: each branch in `ubicaciones.html` uses an `<iframe>` with a Google Maps `src`. Get the embed URL from Google Maps → Share → Embed a map.
- **WhatsApp deep links** for cotización buttons follow the format `https://wa.me/5219512283263?text=Hola%2C%20quiero%20cotizar%3A%20<URL-encoded product name>`. Always URL-encode the product name (e.g. `PTR%20Cuadrado%20Serie%20C`).

## Content rules

- Product listings live **only** in `catalogo.html` (and the legacy sub-pages). Never add products to `index.html` — the homepage links into the catalog instead.
- All copy is in Spanish (Mexico). Keep terminology consistent with the existing pages (e.g. *PTR*, *Polín C*, *Solera*, *Cal.* for calibre).
