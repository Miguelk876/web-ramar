/* ═══════════════════════════════════════════════════════════════════
   LISTA DE COTIZACIÓN Y SUCURSAL — compartido por catálogo y guía
   ═══════════════════════════════════════════════════════════════════
   Antes esto vivía solo dentro de catalogo.html. La guía calculaba los
   materiales de un portón y no había forma de pasarlos a la misma lista,
   así que el cliente terminaba dictando todo otra vez por WhatsApp.
   Aquí queda una sola implementación que las dos páginas usan.

   La lista acepta dos clases de renglón:
     · producto del catálogo  → lleva id y se le suben o bajan piezas
     · material de la guía    → lleva la medida ya calculada como texto
                                (32.5 m lin. · 6 tramos), sin piezas que subir
*/

/* ─── Sucursales ───────────────────────────────────────────────────
   Los números bajo "Celular" del directorio impreso son los que reciben
   WhatsApp. Matriz canaliza cuando el visitante no elige. */
const SUCURSALES_WA = [
  { id:'general',  nombre:'Cualquier sucursal (Matriz canaliza)', wa:'5219512283263' },
  { id:'matriz',   nombre:'Matriz La Ex-Garita',                  wa:'5219515336045' },
  { id:'aceros',   nombre:'Aceros Especializados',                wa:'5219512261469' },
  { id:'juquilita',nombre:'Juquilita',                            wa:'5219512261471' },
  { id:'sanisidro',nombre:'San Isidro',                           wa:'5219512283689' },
  { id:'viguera',  nombre:'Viguera',                              wa:'5219514160571' },
  { id:'union',    nombre:'La Unión',                             wa:'5219512721019' },
  { id:'solaga',   nombre:'Solaga',                               wa:'5219512283104' },
  { id:'tlacolula',nombre:'Tlacolula (próximamente)',             wa:'5219514760926' },
];

/* Vive en memoria, no en el navegador: el aviso de privacidad dice que de
   este sitio solo se guarda la lista de cotización y nada más. */
let sucursalElegida = 'general';

function waDeSucursal(){
  const s = SUCURSALES_WA.find(x => x.id === sucursalElegida) || SUCURSALES_WA[0];
  return s.wa;
}

function opcionesSucursalHTML(){
  return SUCURSALES_WA.map(x =>
    '<option value="' + x.id + '"' + (x.id === sucursalElegida ? ' selected' : '') + '>' + x.nombre + '</option>'
  ).join('');
}

/* Cualquier enlace con data-wa-base y el comodín WANUM se reapunta solo.
   Así la guía no tiene 14 números escritos a mano. */
function aplicarSucursalEnLinks(){
  const num = waDeSucursal();
  document.querySelectorAll('[data-wa-base]').forEach(a => {
    a.href = a.dataset.waBase.replace('WANUM', num);
  });
}

function cambiarSucursal(sel){
  sucursalElegida = sel.value;
  /* Los demás selectores de la página se ponen de acuerdo con este. */
  document.querySelectorAll('.sel-sucursal').forEach(s => { s.value = sel.value; });
  aplicarSucursalEnLinks();
  const btn = document.getElementById('pmodal-wa-btn');
  if (btn && btn.dataset.base) btn.href = btn.dataset.base.replace('WANUM', waDeSucursal());
}


/* ─── La lista ─────────────────────────────────────────────────────
   clave -> { id, nombre, detalle, cantidad, medida } */
const lista = new Map();
const CLAVE_LISTA = 'ramar-cotizacion';

/* sessionStorage, no localStorage: vive mientras la pestaña esté abierta y se
   borra sola al cerrarla. Solo nombres de material y cantidades, ningún dato
   personal. Va en try/catch porque en navegación privada el acceso falla. */
function guardarLista(){
  try {
    const plano = [...lista.values()].map(x => ({
      i: x.id, n: x.nombre, d: x.detalle || '', c: x.cantidad, m: x.medida || ''
    }));
    sessionStorage.setItem(CLAVE_LISTA, JSON.stringify(plano));
  } catch (e) { /* sin almacenamiento: la lista sigue viva en memoria */ }
}

function recuperarLista(){
  try {
    const crudo = sessionStorage.getItem(CLAVE_LISTA);
    if (!crudo) return;
    JSON.parse(crudo).forEach(x => {
      /* Formato viejo [id, cantidad]: se traduce con el catálogo si está.
         PRODUCTS y CAT_NAMES se declaran con const en catalogo.html, así que
         son globales de script pero NO cuelgan de window: por eso se
         consultan con typeof y no como window.PRODUCTS. */
      if (Array.isArray(x)) {
        const id = x[0], cantidad = x[1];
        const catalogo = (typeof PRODUCTS !== 'undefined') ? PRODUCTS : [];
        const nombres  = (typeof CAT_NAMES !== 'undefined') ? CAT_NAMES : {};
        const p = catalogo.find(q => q.id === id);
        if (p && cantidad > 0) {
          lista.set(id, { id: id, nombre: p.name,
                          detalle: nombres[p.cat] || '',
                          cantidad: cantidad, medida: '' });
        }
        return;
      }
      if (x && x.i && x.c > 0) {
        lista.set(x.i, { id: x.i, nombre: x.n, detalle: x.d, cantidad: x.c, medida: x.m });
      }
    });
  } catch (e) { /* dato corrupto o sin acceso: se arranca con lista vacía */ }
}

function actualizarBurbuja(){
  const n = [...lista.values()].reduce((a,x) => a + x.cantidad, 0);
  const b = document.getElementById('cot-burbuja');
  const c = document.getElementById('cot-cuenta');
  if (!b) return;
  c.textContent = n;
  b.hidden = n === 0;
}

/* Alta genérica. Un material de la guía trae la medida ya calculada: si se
   vuelve a agregar, se reemplaza por la nueva en vez de contarse dos veces. */
function agregarItem(datos){
  if (!datos || !datos.id || !datos.nombre) return false;
  const anterior = lista.get(datos.id);
  if (datos.medida) {
    lista.set(datos.id, { id: datos.id, nombre: datos.nombre,
                          detalle: datos.detalle || '', cantidad: 1, medida: datos.medida });
  } else {
    lista.set(datos.id, { id: datos.id, nombre: datos.nombre,
                          detalle: datos.detalle || '',
                          cantidad: anterior ? anterior.cantidad + 1 : 1, medida: '' });
  }
  guardarLista();
  actualizarBurbuja();
  pintarLista();
  return true;
}

function quitarDeLista(id){ lista.delete(id); guardarLista(); actualizarBurbuja(); pintarLista(); }

function cambiarCantidad(id, delta){
  const item = lista.get(id);
  if (!item) return;
  const nueva = item.cantidad + delta;
  if (nueva <= 0) { quitarDeLista(id); return; }
  lista.set(id, Object.assign({}, item, { cantidad: nueva }));
  guardarLista();
  actualizarBurbuja();
  pintarLista();
}

function escaparTexto(t){
  return String(t).replace(/[&<>"']/g, function(c){
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}

function pintarLista(){
  const cont = document.getElementById('cot-items');
  const pie  = document.getElementById('cot-pie');
  if (!cont) return;
  if (!lista.size) {
    cont.innerHTML = '<p class="cot-vacia">Tu lista está vacía.<br>Abre un producto del catálogo, o saca tus medidas en la guía, y pícale a <strong>«Agregar a mi cotización»</strong>.</p>';
    if (pie) pie.hidden = true;
    return;
  }
  if (pie) pie.hidden = false;
  cont.innerHTML = [...lista.values()].map(function(it){
    const n = escaparTexto(it.nombre);
    /* Con medida el renglón ya trae su cantidad calculada: no lleva ± */
    const ctl = it.medida
      ? '<button type="button" class="cot-item-x" aria-label="Quitar ' + n + ' de la lista" onclick="quitarDeLista(\'' + it.id + '\')"><i class="fa-solid fa-trash-can"></i></button>'
      : '<button type="button" aria-label="Quitar uno de ' + n + '" onclick="cambiarCantidad(\'' + it.id + '\', -1)">−</button>' +
        '<span class="cot-item-num">' + it.cantidad + '</span>' +
        '<button type="button" aria-label="Agregar uno de ' + n + '" onclick="cambiarCantidad(\'' + it.id + '\', 1)">+</button>' +
        '<button type="button" class="cot-item-x" aria-label="Quitar ' + n + ' de la lista" onclick="quitarDeLista(\'' + it.id + '\')"><i class="fa-solid fa-trash-can"></i></button>';
    return '<div class="cot-item">' +
      '<div class="cot-item-txt">' +
        '<p class="cot-item-nombre">' + n + '</p>' +
        (it.medida  ? '<span class="cot-item-medida">' + escaparTexto(it.medida) + '</span>' : '') +
        (it.detalle ? '<span class="cot-item-cat">' + escaparTexto(it.detalle) + '</span>' : '') +
      '</div>' +
      '<div class="cot-item-ctl">' + ctl + '</div>' +
    '</div>';
  }).join('');
}

function abrirLista(){
  pintarLista();
  const p = document.getElementById('cot-panel');
  if (p) p.classList.add('open');
  bloquearFondo();
}
function cerrarLista(){
  const p = document.getElementById('cot-panel');
  if (p) p.classList.remove('open');
  soltarFondo();
}

/* El fondo se bloquea mientras hay algo encima y se suelta solo cuando ya no
   queda nada abierto. La ficha de producto existe únicamente en el catálogo,
   por eso la consulta va protegida. */
function bloquearFondo(){ document.body.style.overflow = 'hidden'; }
function soltarFondo(){
  const ficha = document.getElementById('pmodal-overlay');
  const panel = document.getElementById('cot-panel');
  const algoAbierto = (ficha && ficha.classList.contains('open')) ||
                      (panel && panel.classList.contains('open'));
  if (!algoAbierto) document.body.style.overflow = '';
}

/* Un solo mensaje de WhatsApp con toda la lista. */
function enviarLista(){
  if (!lista.size) return;
  const lineas = [...lista.values()].map(function(it, i){
    if (it.medida) return (i+1) + '. ' + it.nombre + ' — ' + it.medida;
    return (i+1) + '. ' + it.nombre + (it.cantidad > 1 ? ' — ' + it.cantidad + ' pz' : '');
  });
  const campo = document.getElementById('cot-nota');
  const nota = campo ? campo.value.trim() : '';
  const texto = 'Hola, quiero cotizar lo siguiente:\n\n' + lineas.join('\n')
              + (nota ? '\n\nMedidas y detalles:\n' + nota : '')
              + '\n\n(Enviado desde construacerosramar.mx)';
  window.open('https://wa.me/' + waDeSucursal() + '?text=' + encodeURIComponent(texto),
              '_blank', 'noopener');
}

/* ─── Burbuja y panel ──────────────────────────────────────────────
   Se arman desde aquí para no repetir el mismo bloque de HTML en cada
   página que quiera la lista. */
(function montarPanel(){
  function montar(){
    if (document.getElementById('cot-panel')) return;   // ya estaba en la página
    const html =
    '<button type="button" id="cot-burbuja" class="cot-burbuja" onclick="abrirLista()" hidden' +
    '        aria-label="Ver mi lista de cotización">' +
    '    <i class="fa-solid fa-clipboard-list"></i>' +
    '    <span class="cot-burbuja-txt">Mi cotización</span>' +
    '    <span id="cot-cuenta" class="cot-cuenta">0</span>' +
    '</button>' +
    '<div id="cot-panel" class="cot-panel" role="dialog" aria-modal="true" aria-labelledby="cot-titulo">' +
    '    <div class="cot-fondo" onclick="cerrarLista()"></div>' +
    '    <div class="cot-caja">' +
    '        <div class="cot-cabeza">' +
    '            <h2 id="cot-titulo"><i class="fa-solid fa-clipboard-list"></i> Mi cotización</h2>' +
    '            <button type="button" class="cot-cerrar" onclick="cerrarLista()" aria-label="Cerrar">&times;</button>' +
    '        </div>' +
    '        <div id="cot-items" class="cot-items"></div>' +
    '        <div id="cot-pie" class="cot-pie" hidden>' +
    '            <label for="cot-sucursal-sel"><i class="fa-solid fa-store"></i> ¿A qué sucursal le mandas la lista?</label>' +
    '            <select id="cot-sucursal-sel" class="sel-sucursal" onchange="cambiarSucursal(this)">' + opcionesSucursalHTML() + '</select>' +
    '            <label for="cot-nota">Medidas, calibres o detalles (opcional)</label>' +
    '            <textarea id="cot-nota" rows="3" placeholder="Ej. PTR cal. 11 de 2x2, 6 tramos. Lámina cal. 26 en 3 m."></textarea>' +
    '            <p class="cot-aviso">Los precios se cotizan al momento. Te respondemos por WhatsApp con el precio del día.</p>' +
    '            <button type="button" class="cot-enviar" onclick="enviarLista()">' +
    '                <i class="fa-brands fa-whatsapp"></i> Enviar mi lista por WhatsApp' +
    '            </button>' +
    '        </div>' +
    '    </div>' +
    '</div>';
    const envoltura = document.createElement('div');
    envoltura.innerHTML = html;
    while (envoltura.firstElementChild) document.body.appendChild(envoltura.firstElementChild);
    /* La lista se recupera aquí y no en cada página: así la burbuja aparece
       con lo que el visitante ya traía del catálogo o de la guía. */
    recuperarLista();
    actualizarBurbuja();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})();
