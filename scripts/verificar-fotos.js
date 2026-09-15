#!/usr/bin/env node
/**
 * Verificador de fotos externas — RAMAR
 *
 *   node scripts/verificar-fotos.js
 *   node scripts/verificar-fotos.js --solo-muertas
 *   node scripts/verificar-fotos.js --csv > reporte.csv
 *
 * ¿Para qué sirve?
 *
 * El catálogo no guarda las fotos de producto: las carga en vivo desde los
 * servidores de los proveedores (Serviacero, Phillips, PHV, Fortacero,
 * Pintumex, Truper, Makita, Lámitec…). Eso significa que la foto no vive en
 * nuestro sitio, vive en el suyo. El día que un proveedor reacomoda su
 * página o le cambia el nombre a un archivo, la foto desaparece del catálogo
 * sin avisarle a nadie: al cliente le aparece el dibujo SVG de respaldo o el
 * placeholder, y nosotros no nos enteramos.
 *
 * verificar.js no detecta esto porque solo revisa las imágenes locales.
 * Este script recorre cada URL externa y dice cuáles ya están muertas.
 *
 * Se corre a mano cada tanto (no en cada push: son ~80 peticiones a
 * servidores ajenos y tardan). Requiere salida a internet.
 *
 * Cómo leer el resultado:
 *   OK        la foto responde bien
 *   MUERTA    404, 403, 410 — hay que reemplazarla
 *   REDIRIGE  responde pero en otra dirección; conviene actualizar la URL
 *   LENTA     tardó más de 5 s; el cliente probablemente no la ve cargar
 *   ERROR     no se pudo conectar (dominio caído, DNS, certificado)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOLO_MUERTAS = process.argv.includes('--solo-muertas');
const CSV = process.argv.includes('--csv');
const TIMEOUT_MS = 15000;
const LENTA_MS = 5000;
const CONCURRENCIA = 6;

/** Saca las URLs externas de imagen de todos los HTML del proyecto. */
function recolectar() {
  const encontradas = new Map(); // url -> [{archivo, contexto}]
  const htmls = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));

  for (const archivo of htmls) {
    const texto = fs.readFileSync(path.join(ROOT, archivo), 'utf8');

    // photo: 'https://…' dentro del array PRODUCTS, y src="https://…" en <img>
    const patrones = [
      /photo:\s*['"](https?:\/\/[^'"]+)['"]/g,
      /<img[^>]+src=["'](https?:\/\/[^"']+)["']/g,
    ];

    for (const re of patrones) {
      let m;
      while ((m = re.exec(texto)) !== null) {
        const url = m[1];
        // El iframe de Facebook y los CDN de fuentes/iconos no son fotos de producto.
        if (/facebook\.com\/plugins|fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/.test(url)) continue;

        // Intentar identificar de qué producto es, para poder arreglarlo rápido.
        let contexto = '';
        const antes = texto.slice(Math.max(0, m.index - 400), m.index);
        const id = [...antes.matchAll(/id:\s*['"]([^'"]+)['"]/g)].pop();
        if (id) contexto = id[1];

        if (!encontradas.has(url)) encontradas.set(url, []);
        encontradas.get(url).push({ archivo, contexto });
      }
    }
  }
  return encontradas;
}

/** Revisa una URL. Primero HEAD; si el servidor no lo soporta, GET parcial. */
async function revisar(url) {
  const t0 = Date.now();
  const intento = async (method) => {
    const ctrl = new AbortController();
    const reloj = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      return await fetch(url, {
        method,
        redirect: 'manual',
        signal: ctrl.signal,
        headers: {
          // Sin User-Agent de navegador, varios proveedores contestan 403.
          'User-Agent': 'Mozilla/5.0 (verificador-fotos RAMAR)',
          Accept: 'image/*,*/*',
        },
      });
    } finally {
      clearTimeout(reloj);
    }
  };

  try {
    let res = await intento('HEAD');
    if (res.status === 405 || res.status === 501) res = await intento('GET');

    const ms = Date.now() - t0;
    const destino = res.headers.get('location');

    if (res.status >= 300 && res.status < 400 && destino)
      return { estado: 'REDIRIGE', codigo: res.status, ms, nota: destino.slice(0, 110) };
    if (res.status === 404 || res.status === 403 || res.status === 410)
      return { estado: 'MUERTA', codigo: res.status, ms, nota: '' };
    if (!res.ok)
      return { estado: 'MUERTA', codigo: res.status, ms, nota: res.statusText || '' };

    const tipo = res.headers.get('content-type') || '';
    if (tipo && !/image|octet-stream/i.test(tipo))
      return { estado: 'MUERTA', codigo: res.status, ms, nota: `devuelve ${tipo}, no una imagen` };

    if (ms > LENTA_MS) return { estado: 'LENTA', codigo: res.status, ms, nota: '' };
    return { estado: 'OK', codigo: res.status, ms, nota: '' };
  } catch (e) {
    const ms = Date.now() - t0;
    const nota = e.name === 'AbortError' ? `sin respuesta en ${TIMEOUT_MS / 1000}s` : String(e.message || e).slice(0, 110);
    return { estado: 'ERROR', codigo: 0, ms, nota };
  }
}

/** Corre las revisiones de a pocas a la vez, para no atosigar a los proveedores. */
async function enLotes(items, n, fn) {
  const salida = [];
  let i = 0;
  const obreros = Array.from({ length: n }, async () => {
    while (i < items.length) {
      const mio = i++;
      salida[mio] = await fn(items[mio], mio);
    }
  });
  await Promise.all(obreros);
  return salida;
}

(async () => {
  if (typeof fetch !== 'function') {
    console.error('Se necesita Node 18 o más nuevo (usa fetch nativo). Versión actual: ' + process.version);
    process.exit(2);
  }

  const encontradas = recolectar();
  const urls = [...encontradas.keys()];

  if (!urls.length) {
    console.log('No se encontraron fotos externas. Nada que revisar.');
    process.exit(0);
  }

  if (!CSV) {
    console.log('\n══════════════════════════════════════════════════');
    console.log('  VERIFICADOR DE FOTOS EXTERNAS — RAMAR');
    console.log('══════════════════════════════════════════════════');
    console.log(`  ${urls.length} direcciones por revisar. Esto tarda un rato.\n`);
  }

  const resultados = await enLotes(urls, CONCURRENCIA, async (url) => ({
    url,
    usos: encontradas.get(url),
    ...(await revisar(url)),
  }));

  // Agrupar por dominio: así se ve de un jalón qué proveedor se cayó.
  const porDominio = new Map();
  for (const r of resultados) {
    let d;
    try { d = new URL(r.url).hostname; } catch { d = '(url inválida)'; }
    if (!porDominio.has(d)) porDominio.set(d, []);
    porDominio.get(d).push(r);
  }

  const problemas = resultados.filter((r) => r.estado !== 'OK');
  const muertas = resultados.filter((r) => r.estado === 'MUERTA' || r.estado === 'ERROR');

  if (CSV) {
    console.log('estado,codigo,ms,dominio,producto,archivo,url,nota');
    for (const r of resultados) {
      if (SOLO_MUERTAS && r.estado === 'OK') continue;
      const u = r.usos[0] || {};
      let d = ''; try { d = new URL(r.url).hostname; } catch {}
      const q = (s) => `"${String(s == null ? '' : s).replace(/"/g, '""')}"`;
      console.log([r.estado, r.codigo, r.ms, d, u.contexto || '', u.archivo || '', r.url, r.nota].map(q).join(','));
    }
    process.exit(muertas.length ? 1 : 0);
  }

  const icono = { OK: '✓', MUERTA: '✗', ERROR: '✗', REDIRIGE: '→', LENTA: '⚠' };

  for (const [dominio, lista] of [...porDominio.entries()].sort()) {
    const malas = lista.filter((r) => r.estado !== 'OK');
    if (SOLO_MUERTAS && !malas.length) continue;

    console.log(`\n[${dominio}]  ${lista.length} foto(s), ${malas.length} con problema`);
    for (const r of lista) {
      if (SOLO_MUERTAS && r.estado === 'OK') continue;
      const prods = [...new Set(r.usos.map((u) => u.contexto).filter(Boolean))];
      const quien = prods.length ? `  ← ${prods.join(', ')}` : '';
      console.log(`  ${icono[r.estado]} ${r.estado.padEnd(8)} ${String(r.codigo || '').padStart(3)}  ${r.ms}ms${quien}`);
      console.log(`      ${r.url}`);
      if (r.nota) console.log(`      ${r.nota}`);
    }
  }

  console.log('\n──────────────────────────────────────────────────');
  console.log(`  Revisadas: ${resultados.length}`);
  console.log(`  Bien:      ${resultados.length - problemas.length}`);
  console.log(`  Muertas:   ${resultados.filter((r) => r.estado === 'MUERTA').length}`);
  console.log(`  Error:     ${resultados.filter((r) => r.estado === 'ERROR').length}`);
  console.log(`  Redirigen: ${resultados.filter((r) => r.estado === 'REDIRIGE').length}`);
  console.log(`  Lentas:    ${resultados.filter((r) => r.estado === 'LENTA').length}`);

  // Si TODO sale mal con el mismo código, el problema es la red de quien
  // corre el script (proxy, firewall, sin internet), no los proveedores.
  const codigos = new Set(problemas.map((r) => r.codigo));
  if (problemas.length === resultados.length && codigos.size === 1) {
    console.log('\n  ⚠ OJO: las ' + resultados.length + ' direcciones fallaron con el mismo');
    console.log('    código (' + [...codigos][0] + '). Eso casi siempre significa que la falla');
    console.log('    es de tu conexión — un proxy, un firewall o falta de internet —');
    console.log('    y no de los proveedores. Vuelve a correrlo desde una red abierta');
    console.log('    antes de cambiar nada en el catálogo.');
    console.log('──────────────────────────────────────────────────\n');
    process.exit(2);
  }

  if (muertas.length) {
    console.log('\n  Hay fotos muertas. Para cada una, las salidas son:');
    console.log('   · Pedirle al proveedor su paquete oficial de fotos y guardarlas');
    console.log('     en assets/images/ (deja de depender de su servidor).');
    console.log('   · Tomar la foto en bodega con el celular.');
    console.log('   · Quitar el campo photo del producto: el catálogo ya cae solo');
    console.log('     al dibujo SVG, que se ve bien.');
  } else {
    console.log('\n  Todas las fotos externas responden. ✓');
  }
  console.log('──────────────────────────────────────────────────\n');

  process.exit(muertas.length ? 1 : 0);
})();
