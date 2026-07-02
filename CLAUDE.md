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

## Deployment

- **Netlify** (canonical): https://construacerosramar.netlify.app
- **GitHub Pages** (backup): https://miguelk876.github.io/web-ramar/

Both auto-deploy on `git push origin main`. Netlify reads `_headers` for security policies. GitHub Pages does not — security headers there will be defaults.

To force redeploy without changes: `git commit --allow-empty -m "chore: redeploy" && git push`.
