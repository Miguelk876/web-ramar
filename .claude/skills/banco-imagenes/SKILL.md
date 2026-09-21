---
name: banco-imagenes
description: Procesar y publicar fotos propias de Construaceros RAMAR en el sitio — fotos de producto, de sucursal, de promoción o de fondo del hero. Úsala cuando el usuario mande fotos del almacén, de una sucursal o de una promoción y haya que recortarlas, bajarlas de peso, nombrarlas y colocarlas en la página. Incluye el recorte por destino, el límite de peso, la regla de no sobreescribir nombres por el caché de un año, y el pipeline de Chromium (no hay ImageMagick ni PIL en este entorno).
---

# Banco de imágenes RAMAR

Las fotos propias viven en `assets/images/` con el prefijo **`ramar-`**. Son
mejores que las hotlinkeadas de proveedor y **se prefieren siempre** que cubran
el producto: no se mueren cuando el proveedor reorganiza su sitio.

Hoy hay 4. El resto del catálogo hotlinkea ~85 fotos de servidores ajenos.

## Regla que rompe el sitio si se ignora

**Nunca sobreescribas un nombre de archivo ya publicado.**

`_headers` cachea todo lo de `assets/images/` **un año como `immutable`**. Si
reemplazas `ramar-polin-c-galvanizado.jpg` con otra foto bajo el mismo nombre, el
cliente que ya entró **sigue viendo la vieja hasta un año**. Publica con nombre
nuevo y actualiza la referencia.

## Antes de procesar: ¿a dónde va?

El recorte depende del destino. Pregunta si no está claro.

| Destino | Proporción | Lado largo | Dónde se referencia |
|---|---|---|---|
| Tarjeta de producto | **4:3** horizontal | 1200 px | campo `photo` en `PRODUCTS` (`catalogo.html`) |
| Promoción | **4:3** horizontal | 1200 px | campo `img` en `PROMOS` (`index.html`) |
| Fondo del hero | **16:9** horizontal | 1920 px | `background-image` en `index.html` |
| Sucursal | **4:3** horizontal | 1200 px | `ubicaciones.html` |

**Nunca dejes una foto vertical.** Llegan del celular en retrato a ~1.3 MB y en
una tarjeta horizontal se ven diminutas, con franjas a los lados. Recortar a
horizontal es el paso que más cambia el resultado — ya se falló antes por
saltárselo.

Elige el recorte **por foto**: el encuadre se decide viendo dónde está el
material, no aplicando el mismo corte a todas.

## Peso

- **Menos de 500 KB** por foto, sin excepción. El sitio se consume en celulares
  Android baratos, por link de WhatsApp.
- Calidad JPEG ~**0.84** da ese peso sin que se note.
- Referencia de lo que ya está publicado: 174 KB, 206 KB, 258 KB, 350 KB.
  Si tu resultado pasa de 500 KB, baja la calidad o el lado largo.

## Cómo se procesa aquí

**No hay ImageMagick, `cwebp` ni PIL en este entorno.** El redimensionado se
hace con el canvas de Chromium:

1. Sirve los originales por HTTP local: `python3 -m http.server 8099`
2. Abre Chromium con Playwright
   (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, `--no-sandbox`)
3. Carga cada original **por URL**, no como data URI
4. `drawImage` del recorte a un canvas del tamaño destino
5. Lee con `canvas.toDataURL('image/jpeg', 0.84)` y guarda el archivo

⚠️ **Cargar los originales como data URI base64 falla con `EncodingError`.**
Sírvelos por URL. Esto ya se intentó y no funciona.

## Nombrar

`ramar-<qué-es>.jpg` — minúsculas, sin acentos, con guiones.

Que el nombre diga qué se ve, no cuándo se tomó:

- ✅ `ramar-polin-c-galvanizado.jpg`, `ramar-bodega-perfiles.jpg`
- ✅ `ramar-sucursal-tlacolula-fachada.jpg`
- ❌ `IMG_2847.jpg`, `foto1.jpg`, `20260921_182743.jpg`

Si reemplazas una foto existente, agrega algo que distinga: `-v2`, `-nueva`, o
mejor, describe la diferencia (`-fachada`, `-patio`).

## Texto alternativo

Toda imagen lleva `alt` en español, describiendo lo que se ve — no el nombre del
archivo:

- ✅ `alt="Rollos de lámina galvanizada calibre 26 en bodega RAMAR"`
- ❌ `alt="ramar-lamina.jpg"`, `alt="imagen"`, `alt=""`

## Colocar la referencia

Según el destino:

- **Producto**: campo `photo` del producto en `PRODUCTS`. Si además quieres
  encuadre distinto, `photoPos` (`object-position`, ej. `'center 30%'`).
  El CSS ya fija `height: 188px` — no hace falta `width`/`height` en el HTML.
- **Promoción**: campo `img` de la entrada en `PROMOS`, más `alt`.
  `.promo-img` ya tiene `aspect-ratio: 4/3`.
- **Hero**: `background-image` en el slide correspondiente.
- **Sucursal**: en la tarjeta de esa sucursal en `ubicaciones.html`.

No agregues atributos `width`/`height` a los `<img>`: el CSS ya reserva la caja
de cada imagen y el CLS medido es 0.000. Ver la sección de performance en
`CLAUDE.md`.

## Antes de subir

```bash
node scripts/verificar.js
```

Valida que **toda imagen local referenciada exista en disco**. Es el que atrapa
el typo en la ruta. Código 1 → no subas.

Revisa también el peso a mano:

```bash
ls -l assets/images/ramar-* | awk '{printf "%s  %.0f KB\n", $9, $5/1024}'
```

## Qué decirle al usuario

- Si una foto **no sirve** para su destino (borrosa, muy oscura, el material no
  se distingue, o es vertical y recortarla dejaría fuera lo importante),
  **dilo** y pide otra. Publicar una foto mala es peor que no publicar.
- Si la foto trae **personas identificables**, avísale antes de publicar: el
  repositorio es público y el aviso de privacidad no cubre imagen de terceros.
- Si trae **nombres de familia** visibles (rótulos, documentos, placas), déjalos
  fuera y dile — ver la nota de privacidad en `CLAUDE.md`.

## Pendientes conocidos

- **8 fotos de fachada de sucursal**: no hay ninguna. Es el hueco más grande.
- **~85 fotos hotlinkeadas** de proveedores: migrarlas a fotos propias las hace
  inmunes a que el proveedor reorganice su sitio.
  Revisa cuáles están muertas con `node scripts/verificar-fotos.js --solo-muertas`.
- **Herrajes PHV**: `phv.com.mx` está bloqueado a `WebFetch` y hay sospecha de
  que bloquean el hotlinking. Necesita fotos propias.
