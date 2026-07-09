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

## Architecture

7 HTML pages linked via plain `<a href="...">` navigation:

| Page | Purpose | Notes |
|------|---------|-------|
| `index.html` | Homepage | Hero carousel, stats bar, "Por qué RAMAR", 10 rotating tips, FB feed embed |
| `nosotros.html` | History and values | |
| `catalogo.html` | **Single unified catalog** | NEVER split into sub-pages. Products live in JS arrays inside the file. Filters by category. |
| `guia.html` | "¿Qué material necesito?" | Project-type filters |
| `ubicaciones.html` | 7 branches + Google Maps | Has full Schema.org JSON-LD with all branch addresses |
| `contacto.html` | Form + contact info | Posts to Formspree → redirects to `gracias.html` |
| `gracias.html` | Thank-you page | `<meta name="robots" content="noindex">` |

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
- **`assets/images/`** — local images. Product photos in catalog use Pexels CDN URLs with `loading="lazy"`.
- **`assets/images/tips/*.svg`** — 10 hand-crafted illustrations for the home tips section. `electrodos.svg` is animated (welding sparks pulse).
- **`_headers`** (Netlify) — CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, aggressive image cache.
- **`robots.txt` / `sitemap.xml`** — absolute URLs pointing to Netlify.
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
- Canonical URLs on all 7 pages → Netlify
- Open Graph + Twitter Card meta tags on all pages
- Schema.org JSON-LD: `Organization` (index.html), `LocalBusiness` × 7 (ubicaciones.html), `WebSite`
- Skip-to-content link on all pages
- `:focus-visible` global with brand color
- All `<img>` have `alt` attributes
- `_headers` enforces strict CSP, HSTS, no camera/mic/geo

## Mobile-first reality check

**The site is consumed primarily on cheap Android phones**: salespeople send WhatsApp links to leads. Test mentally on 360 px width before declaring any visual change done. Optimize image weight aggressively (target < 500 KB per photo). Tap targets ≥ 44 px.

## Content Rules

- The catalog (products) lives **ONLY** in `catalogo.html`. Never split into sub-pages, never add product listings to `index.html`. Sub-catalog files (`catalogo-comercial.html`, `catalogo-estructural.html`, `catalogo-especializado.html`, `catalogo-pintura.html`) were deleted on 2026-05-05 by user request — do not recreate them.

### Catalog content rules (RAMAR-specific reality)

Nayvi Padilla (redes) reviewed the catalog in 2026-06. The surviving 96 products reflect what RAMAR **actually stocks in Oaxaca** — don't let generic steel-industry knowledge override these:

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
- **Herramienta**: Oakland es marca de casa. Rotomartillo = SDS Oakland 800W MR-3100 c/maletín. Compresores Goni Mod. 977 y 940 con accesorios.
- **Truper manual**: NO diablos, paletas, cinceles ni crowbar. Carretilla única: 4.5 ft³ neumática Truper 11740.
- **Tips**: avoid over-technical language (ASTM grades, hydraulic pressures, SAE formulas) — el maestro especialista orienta en sucursal.

### Phone numbers — fijo vs WhatsApp (NOT interchangeable)

- Navbar + floating button: `951 228 3263` → WhatsApp `https://wa.me/5219512283263` (never `tel:`)
- Matriz fijo: `951 517 3157`, `951 533 6831` → `tel:` links, `fa-solid fa-phone` icon
- Matriz WhatsApp: `951 533 6045`, `951 549 4636` → `wa.me` links, `fa-brands fa-whatsapp` icon
- Viguera WhatsApp `951 416 0571`/`951 228 3259`, fijo `951 229 1055` · La Unión WhatsApp `951 272 1019`/`951 228 3269`

## Deployment

- **Netlify** (canonical): https://construacerosramar.netlify.app
- **GitHub Pages** (backup): https://miguelk876.github.io/web-ramar/

Both auto-deploy on `git push origin main`. Netlify reads `_headers` for security policies. GitHub Pages does not — security headers there will be defaults.

To force redeploy without changes: `git commit --allow-empty -m "chore: redeploy" && git push`.
