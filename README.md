# Construaceros RAMAR — Sitio web

Sitio de marketing para **Construaceros RAMAR**, distribuidora de acero B2B con 26 años en Oaxaca, México.
8 sucursales propias activas + 4 distribuidores autorizados.

URL pública: https://construacerosramar.netlify.app

---

## Stack y filosofía

- **HTML5 + CSS3 + JavaScript vanilla**. Sin frameworks, sin build, sin npm.
- Servir el directorio raíz tal cual: cualquier servidor estático funciona.
- Despliegue automático: cada `git push` a `main` publica en Netlify y GitHub Pages.

### ¿Por qué sin build?
La empresa no tiene equipo de desarrollo. Cualquier persona con conocimiento básico de HTML puede editar textos, precios o productos sin instalar nada. Si vas a integrar algo y necesitas build, evalúa si vale la pena romper esa simplicidad.

---

## Arrancar local

```bash
# Opción 1: Node (si lo tienes instalado)
npx serve .

# Opción 2: Python 3
python -m http.server 8080

# Opción 3: VS Code → extensión "Live Server" → click derecho en index.html
```

Abre `http://localhost:3000` (npx serve) o `http://localhost:8080` (Python).

---

## Estructura

```
web-ramar/
├── index.html              # Home: hero carrusel, stats, tips rotativos, FB feed
├── nosotros.html           # Historia y valores
├── catalogo.html           # Catálogo único con filtros (NO crear sub-catálogos)
├── guia.html               # "¿Qué material necesito?" con filtros por proyecto
├── ubicaciones.html        # 8 sucursales con Google Maps embebidos
├── contacto.html           # Formulario y datos de contacto
├── gracias.html            # Confirmación post-formulario (noindex)
│
├── styles.css              # TODOS los estilos del sitio (~3700 líneas)
├── main.js                 # Hamburguesa móvil + IntersectionObserver fade-in
│
├── assets/images/
│   ├── logo-horizontal.png # Logo principal usado en navbar/hero/og:image
│   ├── logo.png            # Logo cube original (uso heredado)
│   ├── 20260430_*_iOS.webp # Fotos reales del almacén (optimizadas WebP, también son fotos de producto)
│   ├── hero_steel_*.webp   # Imagen hero (optimizada WebP)
│   ├── nylamid-*.jpg       # Fotos reales del inventario de nylamid
│   ├── tips/*.svg          # 10 ilustraciones SVG para sección "TIP RAMAR"
│   └── brands/*.png|svg    # Logos de proveedores (Ternium, PintuMex, etc.)
│
├── scripts/
│   └── verificar.js        # Verificador pre-publicación (node scripts/verificar.js)
│
├── favicon-*.png           # 6 tamaños (16, 32, 48, 180, 192, 512)
├── apple-touch-icon.png
├── android-chrome-*.png
├── site.webmanifest        # PWA manifest
│
├── robots.txt              # Reglas para crawlers
├── sitemap.xml             # Sitemap con URLs absolutas
├── _headers                # Headers de Netlify (CSP, HSTS, caché)
└── .well-known/
    └── security.txt        # Contacto de seguridad (RFC 9116)
```

---

## Convenciones

### CSS
- Variables de diseño en `:root` al inicio de `styles.css`:
  - `--color-blue: #1C2B54` (primario, navbar/headlines)
  - `--color-yellow: #F08018` (acento, CTAs)
  - `--color-red: #DD3B2E` (acento secundario)
  - `--font-heading: 'Oswald'`, `--font-body: 'Inter'`
- Breakpoints: `@media (max-width: 1100px | 900px | 768px | 600px | 480px)`. El hamburger menu activa a `900px`.
- Animaciones de scroll: agrega `class="fade-in"` y el `IntersectionObserver` en `main.js` la activa.

### HTML
- Cada página comparte navbar y footer copy-pasteado (no hay incluyes — si modificas uno, hazlo en las 7 páginas).
- Idioma: `<html lang="es">` siempre.
- Skip link `<a href="#main" class="skip-link">` como primer elemento del `<body>` (a11y).
- `<main id="main">` envolviendo el contenido principal de cada página.

### JavaScript
- Vanilla, sin dependencias externas.
- Funciones declaradas dentro de `(function () { ... })()` para no contaminar globals.
- Datos del catálogo viven en arrays JS dentro de `catalogo.html` mismo (no archivos separados).

---

## Cómo agregar un producto al catálogo

1. Abre `catalogo.html`, busca el array de productos (después de `const PRODUCTS = [`, ~línea 890).
2. Copia un objeto producto existente y modifica:
   ```js
   { id:'mi-producto',       // único, en minúsculas-con-guiones
     cat:'estructural',      // estructural | comercial | especializado | pintura | herramienta | consumibles | herrajes | cerraduras
     provider:'PROLAMSA',    // opcional: marca/proveedor (sale como badge)
     name:'Nombre del producto',
     tagline:'Descripción corta de una línea',
     svg:`<svg ... />`,      // ilustración SVG inline (opcional si hay foto)
     svgNote:'Nota debajo de la ilustración/foto',
     specs:[
       {i:'fa-list',     l:'Etiqueta', v:'Valor'},
       {i:'fa-ruler',    l:'Medidas',  v:'1/2", 3/4", 1"'},
     ],
     wa:'Texto%20URL-encoded%20para%20WhatsApp',   // lo que llega al WhatsApp al cotizar
     photo:'assets/images/mi-foto.webp' }          // foto local (mejor) o URL externa
   ```
3. Si el producto tiene tabla de medidas detallada, agrégala en `TABLE_HTML` (más abajo en el mismo archivo) con el mismo `id`.
4. **Corre el verificador**: `node scripts/verificar.js` — te avisa si te faltó un campo, duplicaste un id o la foto no existe.
5. Guarda y haz push. El contador de la categoría, la búsqueda y el modal se actualizan solos.

### Preferir fotos locales
Sube la foto a `assets/images/` (idealmente `.webp`, máx ~300 KB) y referénciala como `assets/images/foto.webp`. Las URLs externas funcionan pero dependen de que el otro sitio no borre o bloquee la imagen — si eso pasa, se muestra la foto de respaldo automáticamente.

## Cómo agregar/modificar una sucursal

1. Abre `ubicaciones.html`.
2. Busca la JSON-LD al inicio (`<script type="application/ld+json">`) y agrega/modifica el bloque correspondiente.
3. Busca la sección `<div class="suc-card">` con la sucursal y duplica/edita el bloque visual.
4. Cada sucursal tiene su `<iframe>` con el embed de Google Maps. Para obtener uno nuevo:
   Google Maps → buscar la dirección → "Compartir" → "Insertar mapa" → copiar el `src` del iframe.

## Cómo cambiar teléfonos / correo

Aparecen en TODAS las páginas (navbar y footer copiados). Busca y reemplaza globalmente en los 7 HTML.

⚠️ **Fijo y WhatsApp NO son intercambiables** — usa el ícono y link correcto para cada uno:

| Número | Tipo | Link correcto | Ícono |
|---|---|---|---|
| `951 228 3263` (navbar + botón flotante) | WhatsApp | `https://wa.me/5219512283263` | `fa-brands fa-whatsapp` |
| `951 517 3157` · `951 533 6831` | Fijo Matriz | `tel:9515173157` | `fa-solid fa-phone` |
| `951 533 6045` · `951 549 4636` | WhatsApp Matriz | `https://wa.me/5219515336045` | `fa-brands fa-whatsapp` |
| Email | — | `mailto:ramar.matriz@gmail.com` | `fa-solid fa-envelope` |

Los links de WhatsApp llevan `target="_blank" rel="noopener"` para abrir la app.

Después de cambiar, corre `node scripts/verificar.js` para confirmar que navbar/footer siguen consistentes.

---

## Despliegue

- **Netlify** (URL principal): https://construacerosramar.netlify.app
- **GitHub Pages** (respaldo): https://miguelk876.github.io/web-ramar/

Ambos despliegan automáticamente al pushear a `main`. Netlify lee `_headers` para aplicar CSP/HSTS y caché.

Para forzar redeploy sin cambios:
```bash
git commit --allow-empty -m "chore: trigger redeploy" && git push
```

---

## SEO y standards

El sitio cumple con:

- ✅ HTML5 semántico válido (`<header> <nav> <main> <section> <article> <footer>`)
- ✅ Meta tags completos (description, og:*, twitter:card, canonical)
- ✅ Schema.org JSON-LD: Organization (index.html), LocalBusiness para 7 sucursales (ubicaciones.html), WebSite
- ✅ robots.txt + sitemap.xml con URLs absolutas
- ✅ PWA: site.webmanifest + favicons en 6 tamaños
- ✅ Accesibilidad: lang="es", skip link, alt en todas las imágenes, focus-visible
- ✅ Seguridad (Netlify _headers): CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy
- ✅ security.txt en `.well-known/`
- ✅ Performance: imágenes comprimidas (-86%, 48 MB → 6.7 MB), `loading="lazy"`, preconnect a Google Fonts

---

## Para integrar algo nuevo (un programador)

Lee primero `CLAUDE.md` (instrucciones para asistentes IA con contexto exhaustivo del proyecto).

Tres reglas cortas:
1. **Mobile-first siempre**: las vendedoras envían el link por WhatsApp y la mayoría lo abre en celulares Android baratos. Probar en pantalla 360 px antes de declarar listo.
2. **Catálogo en una sola página** (`catalogo.html`). NO crear sub-catálogos. Si necesitas organización, usar filtros JS dentro del mismo archivo.
3. **Sin build, sin npm, sin frameworks**. Si propones agregar uno, justifícalo bien — la simplicidad actual permite que cualquier persona sin experiencia edite el sitio.

---

## Licencia

Privado — propiedad de Construaceros RAMAR S.A. de C.V.
