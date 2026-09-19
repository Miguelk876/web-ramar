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
- **`_headers`** (Netlify) — CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, cache policy. HTML, `styles.css` and `main.js` all revalidate on every request, so a deploy reaches visitors immediately. Images under `assets/images/` are cached for a year as `immutable`: **to replace an image, give it a new filename** and update the references — overwriting the same filename leaves returning visitors on the old one for up to a year.
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

`aviso-privacidad.html` describes the **real** data flows of this site, not boilerplate: the contact form is processed by FormSubmit and lands in Gmail; Google Maps, the Meta page plugin, Google Fonts and Cloudflare are embedded and see the visitor's IP; the site is hosted on Netlify.

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

## Quote list (`catalogo.html`)

`lista` is a `Map` of product id → `{producto, cantidad}`, mirrored into `sessionStorage` under `ramar-cotizacion` as `[[id, cantidad], …]`. `enviarLista()` builds one WhatsApp message with every line. The target number comes from `waDeSucursal()`.

**`SUCURSALES_WA` only lists branches whose WhatsApp number is confirmed** — Matriz, Viguera, La Unión, San Isidro, plus the aggregated number. Aceros, Juquilita and Solaga are deliberately absent: their numbers are registered as `tel:` and nobody has confirmed whether they receive WhatsApp. Don't add them by guessing.

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

- **Netlify** (canonical): https://construacerosramar.mx — custom domain, registered at Akky, nameservers delegated to Netlify DNS. The `construacerosramar.netlify.app` subdomain still resolves but is no longer the canonical URL; don't reintroduce it in `canonical`, `og:url`, `sitemap.xml` or `robots.txt`.
- **GitHub Pages** (backup): https://miguelk876.github.io/web-ramar/

Both auto-deploy on `git push origin main`. Netlify reads `_headers` for security policies. GitHub Pages does not — security headers there will be defaults.

To force redeploy without changes: `git commit --allow-empty -m "chore: redeploy" && git push`.
