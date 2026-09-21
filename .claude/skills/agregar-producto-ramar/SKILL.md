---
name: agregar-producto-ramar
description: Agregar, editar o quitar un producto del catálogo de Construaceros RAMAR (catalogo.html). Úsala cuando el usuario pida meter un producto nuevo al catálogo, corregir medidas o calibres de uno existente, agregarle tabla de especificaciones o foto, o dar de baja un producto. Incluye las reglas de nomenclatura de RAMAR (calibres, fracciones de pulgada, marcas que sí y no se manejan) y el paso de verificación obligatorio antes de subir.
---

# Agregar un producto al catálogo RAMAR

Todo el catálogo vive en **un solo archivo**: `catalogo.html`. Nunca se parte en
sub-páginas ni se meten productos en `index.html`.

## Antes de escribir nada

1. **Busca si ya existe.** Mucho producto está en el catálogo con otro nombre
   comercial. Ejemplos reales de falsos negativos:
   - "Galvateja" = producto existente `lamina-teja`
   - "Tubos Negros" (plural) no aparece si buscas "tubo negro"
   - "Lámina Negra" = `lamina-hr`
   - "Canal Monten" = `polin-c`

   ```bash
   grep -in "palabra-clave" catalogo.html | head -20
   ```

   Busca por 2–3 sinónimos antes de concluir que falta. **Duplicar un producto es
   peor que no agregarlo.**

2. **Confirma que RAMAR lo vende.** Si no estás seguro, pregunta al usuario. No
   lo deduzcas del conocimiento general de la industria del acero — ver
   "Reglas de contenido" abajo.

## Estructura de un producto

Se agrega al arreglo `const PRODUCTS = [...]`, dentro del bloque de comentario de
su categoría (`/* ── COMERCIAL ─── */`, etc.), pegado a los productos hermanos.

```js
{ id:'tubo-galvanizado', cat:'comercial', provider:'PROLAMSA',
  name:'Tubo Galvanizado',
  tagline:'Una línea que diga para qué sirve, en lenguaje de cliente.',
  svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 190">…</svg>`,
  svgNote:'Medidas · Calibres · Largo · Acabados',
  specs:[
    {i:'fa-ruler',       l:'Medidas',   v:'…'},
    {i:'fa-layer-group', l:'Calibres',  v:'…'},
    {i:'fa-building',    l:'Usos',      v:'…'},
    {i:'fa-lightbulb',   l:'Tip',       v:'…'}
  ], wa:'Tubo%20Galvanizado', photo:'assets/images/ramar-tubo-galvanizado.jpg' },
```

### Campos

| Campo | Obligatorio | Regla |
|---|---|---|
| `id` | **sí** | kebab-case, sin acentos, único. Es el deep link `#p-<id>` — **no lo cambies** después de publicado o rompes los links que ya se compartieron por WhatsApp. |
| `cat` | **sí** | Solo una de: `estructural`, `comercial`, `especializado`, `pintura`, `herramienta`, `consumibles`, `herrajes`, `cerraduras`. Cualquier otra rompe `verificar.js`. |
| `name` | **sí** | Como lo pide el cliente en Oaxaca, no el nombre técnico. |
| `tagline` | **sí** | Una frase. Para qué sirve, no qué es. |
| `specs` | **sí** | 3–5 renglones `{i, l, v}`. `i` = icono Font Awesome 6.4 (`fa-ruler`, `fa-layer-group`, `fa-building`, `fa-lightbulb`, `fa-palette`, `fa-weight-hanging`, `fa-bolt`, `fa-circle-info`). Aquí es donde el buscador encuentra las medidas — **escribe las medidas reales**, no "varias medidas". |
| `wa` | **sí** | Nombre del producto **URL-encoded** (`%20` espacio, `%C3%A1` á, `%C3%B3` ó, `%2F` /). Es el texto que se prellena en WhatsApp. |
| `svg` o `photo` | al menos uno | Sin ninguno, `verificar.js` avisa. Con foto local, preferir la foto. |
| `provider` | no | Marca, solo si es relevante para el cliente (PROLAMSA, PintuMex, Truper, Oakland, PHV, Phillips…). Sale como badge en la tarjeta. |
| `svgNote` | no | Renglón chico bajo el dibujo: medidas · calibres · largo · acabados. |
| `photoPos` | no | `object-position` cuando la foto se ve descentrada (ej. `'center 30%'`). |

## Imágenes

Prioridad, de mejor a peor:

1. **Foto propia de RAMAR** en `assets/images/ramar-*.jpg` — siempre que exista una que cubra el producto.
2. **Dibujo SVG inline** — para perfiles y secciones. Colores de marca: relleno `#1C2B54`, cotas y texto `#F08018`, hueco `#EEF2FF`. Lleva `<text>` con el nombre abajo.
3. **Foto hotlinkeada del proveedor** — último recurso. Se mueren solas cuando el proveedor reorganiza su sitio.

Reglas duras:

- **Nunca sobreescribas un nombre de archivo de imagen.** `_headers` las cachea
  un año como `immutable`: el visitante que ya entró se queda con la vieja.
  Publica con nombre nuevo.
- Menos de **500 KB** por foto. El sitio se consume en celulares Android baratos.
- Landscape 4:3 para tarjeta de producto. Nunca vertical — se ve diminuta.
- No hay ImageMagick ni PIL en este entorno. Para recortar/reescalar: sirve los
  originales por el servidor HTTP local y procésalos con canvas en Chromium
  (cargarlos como data URI base64 falla con `EncodingError`).

## Tabla de especificaciones (opcional pero valiosa)

Si tienes medidas, calibres y pesos reales, agrégale entrada en `const TABLE_HTML = {…}`
con la misma clave que el `id`:

```js
'tubo-galvanizado':`<div class="specs-table-wrapper"><table class="specs-table"><thead><tr><th>Medida</th><th>Pared</th><th>kg/m</th></tr></thead><tbody><tr><td><strong>1"</strong></td><td>3.38 mm</td><td>2.5</td></tr></tbody></table></div>`,
```

- La clave **tiene que** existir en `PRODUCTS` o `verificar.js` la marca huérfana.
- Todo en una sola línea de template literal, como las demás.
- Nota aclaratoria al final con `<p style="font-size:.82rem;color:#64748b;margin-top:.5rem;"><i class="fa-solid fa-circle-info"></i> …</p>` cuando aplique (sobre pedido, sin corte a medida, confirmar existencia).
- **No inventes pesos ni espesores.** Si no los tienes confirmados, deja el
  producto sin tabla y dilo al usuario. 73 de 96 productos siguen sin tabla — eso
  está bien, es mejor que una tabla falsa.

## Reglas de contenido — la realidad de RAMAR

Revisadas con la encargada de redes. **Estas reglas mandan sobre el conocimiento
general de la industria del acero.**

**Nomenclatura**

- **Calibres, no códigos.** Nunca "Serie C" / "Serie R" en PTR — el cliente pregunta por calibre.
- **HSS**: espesores en **fracción de pulgada**, jamás en mm, y sin columna kg/m.
- **Tubería cédula**: se maneja en **mm**. Solo Ced. 30 y 40.
- **Lámina HR se llama "Lámina Negra"** (el `id` sigue siendo `lamina-hr`). Nada de "HR", "CR", "fría", A-36 ni A572. No se dobla ni se corta.
- **Lozacero**, no "Losacero" ni "FortaDeck".
- **Canal Monten** = Polín C.

**Lo que NO se maneja** (no lo reintroduzcas con ningún nombre)

- **Impermeabilizantes** — RAMAR no los vende. Ni IMPERFIBRA ni AQUAMAR.
- **ESMAFLEX** — es rezago.
- **Soldadoras** AXTech MIG/TIG ni Lincoln.
- **Cerraduras** de mueble ni de aluminio.
- **Lanzas**: no hay alfanje.
- **Truper manual**: no diablos, paletas, cinceles ni crowbar.
- **Bisagras PHV** de 7/8".

**Restricciones de medida/calibre que suelen fallar**

- PTR Cuadrado: cal. 11 principal; 12, 14, 16 solo en medidas selectas. Todos 6 m.
- PTR Rectangular: solo cal. 11, 14, 16.
- PTR Regiopytsa: rectangular cal. 18, 20, 22.
- HSS: solo cuadrado 4"–12".
- Vigas IPR: peraltes 6, 8, 10, 12, 14 (no 4").
- Rejilla electroforjada: una sola medida, 1/8"×1", panel 1×6 m, 140 kg.
- Lámina Negra: cal. 14–26. Galvanizada: G-45 (no G-60). Pintro: solo rojo. Galvateja: solo cal. 26 (Plus = térmica). Lozacero: solo cal. 22.
- Tablero portones: solo modelo 170, anchos 2–10", sin corte a medida.
- Pintura es **PintuMex y nada más que pintura**. Vinílicas: SUPERVIN, OMAR, VINET, KOLORTEX, CH14. Primario: solo Rojo Óxido.
- Nylamid: barras hasta 8" Ø, placas ½/¾/1" de 60×60 cm, solo blanco normal.
- Acero maquinaria: 1018 redondo/hexagonal/cuadrado; 1045 y 4140 solo redondo; hexagonal hasta 1½".
- Bronce: solo redondos 9¾"–10". Latón: redondos + cuadrado ¾, sin solera.
- Varilla: **sobre pedido en todas las medidas.**
- Cold Rolled (`lamina-fria`): producto de redirección — consultar Aceros RAMAR.

**Tono**

- Sin lenguaje sobre-técnico en los tips (grados ASTM, presiones hidráulicas, fórmulas SAE). El maestro especialista orienta en sucursal.
- Nunca mencionar mínimos de compra.

## Antes de subir — obligatorio

```bash
node scripts/verificar.js
```

Valida que `PRODUCTS` y `TABLE_HTML` parseen, que no haya ids duplicados ni
tablas huérfanas, que estén los campos obligatorios, que la categoría sea válida,
y que toda imagen local referenciada exista en disco.

**Si sale código 1, no subas.** Arregla y vuelve a correrlo.

Opcional, si tocaste fotos hotlinkeadas (hace ~88 peticiones a servidores de terceros):

```bash
node scripts/verificar-fotos.js --solo-muertas
```

Si sale código 2 es que **la red está bloqueada**, no que los proveedores se
cayeron — no edites el catálogo con base en esa corrida.

## Commit

Rama de trabajo, commit descriptivo, y `git push -u origin <rama>`. No abras
Pull Request a menos que el usuario lo pida.

## Cosas que rompen si no las cuidas

- Cambiar un `id` ya publicado → mata los links `#p-<id>` compartidos por WhatsApp.
- Sobreescribir un nombre de imagen → el cliente ve la vieja hasta un año.
- Categoría inventada → `verificar.js` falla.
- Clave en `TABLE_HTML` sin producto → `verificar.js` falla.
- `wa` sin URL-encode → el mensaje de WhatsApp sale cortado.
- Agregar un tercero nuevo a la página (embed, formulario, tracker) → hay que
  actualizar `aviso-privacidad.html` **en el mismo commit**.
