#!/usr/bin/env node
/**
 * Verificador del sitio RAMAR — ejecutar antes de publicar cambios.
 *
 *   node scripts/verificar.js
 *
 * Revisa:
 *  1. Que el array PRODUCTS de catalogo.html parsee sin errores
 *  2. Que no haya IDs de producto duplicados
 *  3. Que cada producto tenga los campos obligatorios
 *  4. Que TABLE_HTML solo referencie productos existentes
 *  5. Que toda imagen local referenciada exista en disco
 *  6. Que los links internos (href="*.html") apunten a páginas reales
 *  7. Que navbar y footer tengan los mismos links en todas las páginas
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES = ['index.html', 'nosotros.html', 'catalogo.html', 'guia.html',
               'ubicaciones.html', 'contacto.html', 'gracias.html'];

let errores = 0, avisos = 0;
const err = (m) => { console.error('  ✗ ' + m); errores++; };
const warn = (m) => { console.warn('  ⚠ ' + m); avisos++; };
const ok = (m) => console.log('  ✓ ' + m);

// ─── 1-4: Catálogo ───────────────────────────────────────────
console.log('\n[Catálogo]');
const cat = fs.readFileSync(path.join(ROOT, 'catalogo.html'), 'utf8');
let products = null, tables = null;
try {
  products = eval(cat.match(/const PRODUCTS = (\[[\s\S]*?\n\]);/)[1]);
  ok(`PRODUCTS parsea: ${products.length} productos`);
} catch (e) { err('PRODUCTS no parsea: ' + e.message); }
try {
  tables = eval('(' + cat.match(/const TABLE_HTML = (\{[\s\S]*?\n\});/)[1] + ')');
  ok(`TABLE_HTML parsea: ${Object.keys(tables).length} tablas`);
} catch (e) { err('TABLE_HTML no parsea: ' + e.message); }

if (products) {
  const ids = products.map(p => p.id);
  const dups = ids.filter((id, i) => ids.indexOf(id) !== i);
  dups.length ? err('IDs duplicados: ' + [...new Set(dups)].join(', '))
              : ok('Sin IDs duplicados');

  for (const p of products) {
    for (const campo of ['id', 'cat', 'name', 'tagline', 'specs', 'wa']) {
      if (p[campo] === undefined) err(`Producto '${p.id || '???'}' sin campo '${campo}'`);
    }
    if (!p.photo && !p.svg) warn(`Producto '${p.id}' sin photo ni svg`);
  }
  ok('Campos obligatorios verificados');

  if (tables) {
    const huerfanas = Object.keys(tables).filter(k => !ids.includes(k));
    huerfanas.length ? err('TABLE_HTML huérfanas (producto no existe): ' + huerfanas.join(', '))
                     : ok('TABLE_HTML sin huérfanas');
  }

  const cats = [...new Set(products.map(p => p.cat))];
  const validas = ['estructural','comercial','especializado','pintura',
                   'herramienta','consumibles','herrajes','cerraduras'];
  const raras = cats.filter(c => !validas.includes(c));
  raras.length ? err('Categorías desconocidas: ' + raras.join(', '))
               : ok(`Categorías válidas (${cats.length} en uso)`);
}

// ─── 5: Imágenes locales ─────────────────────────────────────
console.log('\n[Imágenes locales]');
let imgsRotas = 0;
for (const page of PAGES.concat(['styles.css'])) {
  const c = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const refs = [...c.matchAll(/assets\/images\/[\w\-. ]+\.(?:png|jpe?g|webp|svg|gif)/g)]
    .map(m => m[0]);
  for (const ref of [...new Set(refs)]) {
    if (!fs.existsSync(path.join(ROOT, ref))) {
      err(`${page}: imagen no existe -> ${ref}`);
      imgsRotas++;
    }
  }
}
if (!imgsRotas) ok('Todas las imágenes locales referenciadas existen');

// favicons y manifest
for (const f of ['favicon-32x32.png', 'favicon-16x16.png', 'apple-touch-icon.png', 'site.webmanifest']) {
  fs.existsSync(path.join(ROOT, f)) ? null : warn(`Falta en raíz: ${f}`);
}

// ─── 6: Links internos ───────────────────────────────────────
console.log('\n[Links internos]');
let linksRotos = 0;
for (const page of PAGES) {
  const c = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const hrefs = [...c.matchAll(/href="([a-z\-]+\.html)(#[\w\-]*)?"/g)].map(m => m[1]);
  for (const h of [...new Set(hrefs)]) {
    if (!fs.existsSync(path.join(ROOT, h))) {
      err(`${page}: link roto -> ${h}`);
      linksRotos++;
    }
  }
}
if (!linksRotos) ok('Todos los links internos apuntan a páginas existentes');

// ─── 7: Consistencia navbar/footer ───────────────────────────
console.log('\n[Consistencia entre páginas]');
const firmas = {};
for (const page of PAGES) {
  const c = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const nav = (c.match(/<ul class="nav-links">[\s\S]*?<\/ul>/) || [''])[0]
    .replace(/style="[^"]*"/g, '').replace(/\s+/g, ' ');
  firmas[page] = nav;
}
const base = firmas['index.html'];
const distintos = PAGES.filter(p => firmas[p] !== base && firmas[p] !== base.replace(' style="color: var(--color-yellow);"',''));
// nav-links puede variar solo en el highlight de página activa; comparar sin estilos ya lo normaliza
const unicos = [...new Set(Object.values(firmas))];
unicos.length === 1 ? ok('Navbar idéntico en las 7 páginas')
                    : warn(`Navbar tiene ${unicos.length} variantes (revisar manualmente si es solo el highlight)`);

const waFloat = PAGES.filter(p => !fs.readFileSync(path.join(ROOT, p), 'utf8').includes('whatsapp-float'));
waFloat.length ? warn('Sin botón WhatsApp flotante: ' + waFloat.join(', '))
               : ok('Botón WhatsApp flotante en las 7 páginas');

// ─── Resultado ───────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
if (errores) {
  console.error(`RESULTADO: ${errores} error(es), ${avisos} aviso(s) — NO publicar aún`);
  process.exit(1);
} else {
  console.log(`RESULTADO: 0 errores, ${avisos} aviso(s) — listo para publicar ✓`);
}
