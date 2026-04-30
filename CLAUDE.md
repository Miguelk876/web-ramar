# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static marketing website for **Construaceros RAMAR**, a B2B steel/construction materials distributor based in Oaxaca, Mexico. The site is entirely vanilla HTML5, CSS3, and JavaScript — no build system, no package manager, no frameworks.

## Development

**To preview locally**, serve the root directory with any static file server:
```bash
npx serve .
# or
python -m http.server 8080
```

There are no build, lint, or test commands — files are served as-is.

## Architecture

10 HTML pages linked with standard `<a href="...">` navigation (no SPA router):

- `index.html` — homepage with hero section
- `nosotros.html` — company history and values
- `catalogo.html` — catalog hub linking to 4 sub-pages
- `catalogo-comercial.html`, `catalogo-estructural.html`, `catalogo-especializado.html`, `catalogo-pintura.html` — product detail pages
- `guia.html` — "¿Qué material necesito?" guide with project-type filters
- `ubicaciones.html` — 8 branch locations with embedded Google Maps
- `contacto.html` — contact info and social links
- `gracias.html` — thank-you page after contact form submission (`<meta name="robots" content="noindex">`)

All pages share:
- A copy-pasted `<header class="navbar">` block (no server-side includes or components). The navbar contains: logo, nav links (Inicio / Nosotros / Catálogo / Guía / Ubicaciones), a phone link (`tel:9512283263`), a "Contacto" CTA button, and a hamburger for mobile.
- A copy-pasted `<footer>` block
- A single `<link rel="stylesheet" href="styles.css">` and `<script src="main.js">` at the bottom

**`styles.css`** — all styles for every page. CSS custom properties are declared at the top (`:root`); use them for any new values:
- `--color-blue: #1C2B54` (primary brand)
- `--color-yellow: #F08018` (accent)
- `--color-red: #DD3B2E` (secondary accent)
- `--font-heading: 'Oswald'`, `--font-body: 'Inter'`

**`main.js`** — two behaviors: mobile hamburger menu toggle and scroll fade-in via `IntersectionObserver`. Includes an 800 ms fallback that forces `.visible` on all `.fade-in` elements in case the observer fires late.

**`assets/images/`** — local images (logo, hero, brand logos). Product photos in catalog pages are sourced from Pexels via external URLs with `loading="lazy"`.

## Key Patterns

- **Adding a page**: copy the closest existing page, update content, add a nav link to *every* page's header manually (there's no shared include).
- **Product block** (catalog detail pages): each product uses `.product-block` with an `accent-*` modifier. Inside: a `.pv-wrap` row with `.pv-svg` (inline SVG technical drawing) and `.pv-photo` (Pexels `<img>`), then a `.product-grid-3` with three `.product-col` columns (Medidas / Usos comunes / Recomendación RAMAR).
- **Responsive breakpoint**: `@media (max-width: 900px)` is where the hamburger menu activates; match this in any new layout code.
- **Scroll animations**: add `class="fade-in"` to any element that should animate in on scroll — the `IntersectionObserver` in `main.js` handles it automatically.
- **Google Maps embeds**: each branch in `ubicaciones.html` uses an `<iframe>` with a Google Maps `src`. Get the embed URL from Google Maps → Share → Embed a map.
- **External dependencies** (CDN only, no local installs): Google Fonts (Oswald + Inter) and Font Awesome 6.4.0 for icons — both loaded via `<link>` in each page's `<head>`.

## Content Rules

- The catalog (products) lives only in `catalogo.html` and its sub-pages — never add product listings to `index.html`.
