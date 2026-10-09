# Landing de Freedoo · test de avatares en Meta Ads

Landing de captación B2B de **Freedoo** (partner oficial de Odoo) para ingenierías, estudios de arquitectura, consultoras de negocio e IT y empresas industriales. El único objetivo es que el lead correcto rellene el formulario de cualificación; después, un asistente de IA le llama para agendar una reunión con el closer.

HTML, CSS y JavaScript vanilla, sin frameworks, sin paso de compilación y sin dependencias externas. Cada HTML es autocontenido (CSS y JS en línea) para poder pegarlo como código personalizado en GoHighLevel (GHL).

> ⚠️ **No publicar todavía.** Quedan datos pendientes, marcados en pantalla en amarillo con `[PENDIENTE: …]`. La lista completa está en la sección 3.

---

## 1. Archivos

```
index.html                   Landing completa (CSS y JS dentro)
aviso-legal.html             Borrador para revisión del abogado
politica-privacidad.html     Borrador para revisión del abogado
politica-cookies.html        Borrador para revisión del abogado
assets/logo.png              Logo del cliente recortado (sin márgenes transparentes), 840 × 111 px
assets/favicon.png           Símbolo «FR» del logo, 192 × 192 px
assets/hero-oficina.jpg      MARCADOR: fondo oscuro neutro (sustituir por la foto real)
assets/equipo.jpg            MARCADOR: imagen gris con el texto «MARCADOR» (sustituir por la foto real)
assets/fonts/                Montserrat 400, 600 y 800 (woff2, subconjunto latino) + licencia OFL
assets/originales/           Logo original tal y como lo entregó el cliente (1920 × 919 px)
pruebas/pruebas.js           Batería de pruebas automáticas (Playwright); no se publica
```

Los bloques marcados con `COMPARTIDO` (consentimiento y GTM, estilos base, banner de cookies, pie y lógica del banner) **deben ser idénticos en los 4 HTML**. Si se cambia uno, hay que copiarlo en los otros tres. La batería de pruebas lo comprueba.

## 2. Verla en local

```bash
npx http-server -p 8080 -c-1     # o: python3 -m http.server 8080
# abrir http://localhost:8080/index.html
```

- En `localhost`, al abrir el archivo directamente o con `?debug=1` en la URL, la página está en **modo desarrollo**: imprime en consola cada `dataLayer.push`.
- `enviarAlCRM` todavía **no envía nada**: hace `console.info` con los datos y devuelve una `Promise` resuelta.

Pruebas automáticas (requieren Node y Playwright con Chromium, y el servidor anterior en el puerto 8080):

```bash
node pruebas/pruebas.js          # deja capturas en pruebas/capturas/ (ignorado por git)
```

---

## 3. Pendientes `[PENDIENTE]` agrupados por responsable

Extraídos automáticamente de los archivos (`grep`). Entre paréntesis, dónde aparecen.

### 3.1 Cliente

| Pendiente | Dónde |
| --- | --- |
| Razón social | Pie (4 páginas), aviso legal (titular y objeto), privacidad (responsable) |
| Email de contacto | Pie (4 páginas), aviso legal |
| Teléfono | Pie (4 páginas), aviso legal |
| NIF | Aviso legal, privacidad |
| Domicilio social | Aviso legal, privacidad |
| Datos registrales: provincia, tomo, folio y hoja | Aviso legal |
| URL definitiva de la landing | Aviso legal |
| Email para cuestiones de privacidad y ejercicio de derechos | Privacidad (apartados 1 y 8) |
| Delegado de protección de datos (o eliminar la línea si no se ha designado) | Privacidad |
| Foto real de oficina o equipo para el hero → `assets/hero-oficina.jpg` | `index.html` (hero) |
| Foto real del equipo con nombre y cargo → `assets/equipo.jpg` | `index.html` (Quiénes somos) |
| Número desde el que llama el asistente de IA → constante `TELEFONO_ASISTENTE` | `index.html` |
| Si el asistente de IA genera transcripción o resumen que se guarde en el CRM | Privacidad (apartado 4) |
| Proveedor del asistente de IA de voz, de calendario y de email | Privacidad (tabla de proveedores) |
| Razón social y país de HighLevel (según su contrato) | Privacidad (tabla de proveedores) |
| Fecha de última actualización de cada página legal | Las 3 páginas legales |
| *(Opcional)* Versión del logo para fondos oscuros. Ahora el logo va sobre una placa blanca en el hero porque el eslogan «ARE YOU READY?» es negro. | — |

### 3.2 Abogado

| Pendiente | Dónde |
| --- | --- |
| Mantener o eliminar la casilla `acepta_medicion_publicitaria` (datos cifrados a Meta) | Formulario, paso 2 |
| Confirmar la base legal de la medición en Meta | Privacidad (tabla de finalidades) |
| Meta: ¿encargado o corresponsable? | Privacidad (tabla de proveedores) |
| Verificar en cada proveedor contrato de encargado y garantías (columna de la tabla) | Privacidad |
| Transferencias internacionales: Marco de Privacidad de Datos UE-EE. UU. o cláusulas contractuales tipo, y su vigencia | Privacidad (apartado 7) |
| Plazo de conservación si el lead no contrata | Privacidad (apartado 5) |
| Validar los textos de las 4 casillas de consentimiento (borrador) | Formulario, paso 2 |
| Validar los 3 textos legales completos (borrador) | Páginas legales |
| Validar el texto del banner y del panel de cookies (**no venía en el brief**; lo he redactado yo, ver sección 9) | Banner de cookies |

### 3.3 Migración a GHL

| Pendiente | Dónde |
| --- | --- |
| Conectar `enviarAlCRM(datos)` con GHL (`// TODO GHL`) | `index.html` |
| ID del contenedor de GTM → constante `GTM_ID` (ahora `"GTM-XXXXXXX"`; mientras sea el marcador, GTM **no** se carga) | Los 4 HTML |
| IDs dentro de GTM: GA4, Microsoft Clarity y Pixel de Meta | Contenedor de GTM |
| Verificar que GHL envía el mismo `event_id` a Meta en la API de conversiones (deduplicación) | GHL / Meta |
| Cookies técnicas de GHL y sus duraciones | Política de cookies |
| Escaneo de cookies con la página ya publicada en GHL (las duraciones marcadas `[VERIFICAR]` son las que publica cada proveedor) | Política de cookies |

---

## 4. Constantes de configuración

| Constante | Archivo(s) | Valor actual | Efecto |
| --- | --- | --- | --- |
| `GTM_ID` | Los 4 HTML (bloque compartido del `<head>`) | `"GTM-XXXXXXX"` | Con el marcador, GTM no se carga. Cambiarlo en los 4 archivos. |
| `TELEFONO_ASISTENTE` | `index.html` | `""` | Vacío: la página de gracias no muestra número ni botón. Con valor (p. ej. `"+34 600 000 000"`): muestra «desde el +34 600 000 000» y el botón «Guardar el número en mis contactos», que descarga `freedoo-asistente.vcf` con el nombre «Freedoo — Asistente». |

Variables CSS en `:root` (bloque compartido). Los valores de marca son **estimados** (análisis visual de freedoo.es), como indicaba el brief:

| Variable | Valor | Nota |
| --- | --- | --- |
| `--violeta` | `#8130D4` | Estimado. **El violeta real del logo entregado es `#762DDC`** (medido en los píxeles del PNG). Recomiendo confirmar con el cliente cuál usar. |
| `--violeta-oscuro` | `#6A22B3` | Hover de botones |
| `--violeta-suave` | `#F3EAFC` | Fondos de realce |
| `--gris-fondo` | `#F8F9FA` | Secciones alternas |
| `--gris-oscuro` | `#343A40` | Franja final del pie |
| `--texto` | `#212529` | |
| `--radio` | `6px` | |
| `--violeta-claro` | `#E0CAF9` | Palabra rotativa del hero (ver 9.2) |

Contrastes calculados con la fórmula WCAG 2.x: violeta sobre blanco **6,35:1**; blanco sobre botón violeta **6,35:1**; blanco sobre hover **8,43:1**; violeta sobre violeta suave **5,44:1**; blanco sobre gris oscuro **11,51:1**; texto sobre gris de fondo **14,63:1**. Todos superan el 4,5:1 de AA.

---

## 5. Formulario

Un único componente (`<template id="tpl-formulario">`) clonado en dos instancias: el **pop-up** (`form_location = "popup"`) y la **sección de cierre** (`form_location = "inline"`). Misma lógica, campos, validaciones y eventos. Los `id` se sufijan con `-popup` / `-inline` para que no se repitan.

### 5.1 Campos y slugs

Los valores se guardan como *slug*. Tabla de equivalencias:

| Campo (`name`) | Opción visible → valor |
| --- | --- |
| `sector` | Ingeniería → `ingenieria` · Arquitectura → `arquitectura` · Consultoría de negocio o IT → `consultoria` · Industria o metalmecánica → `industria` · Otro → `otro` |
| `cargo` | Gerencia o dirección → `gerencia` · Responsable de IT → `responsable_it` · Administración o contabilidad → `administracion` · Otro → `otro` |
| `tamano_empresa` | 1–9 → `1_9` · 10–50 → `10_50` · 51–250 → `51_250` · Más de 250 → `mas_250` |
| `gestion_actual` (varias) | Excel → `excel` · Notas a mano → `notas_a_mano` · Varios programas sin conectar → `programas_sin_conectar` · Ya tenemos un ERP → `erp` · Ya usamos Odoo → `odoo` |
| `decisor` | Yo → `yo` · Yo, con socios o dirección → `yo_con_socios` · Otra persona → `otra_persona` |
| `plazo_inicio` | Este trimestre → `este_trimestre` · En 3–6 meses → `3_6_meses` · Más adelante → `mas_adelante` · Solo me estoy informando → `solo_informandome` |
| `necesita_conectores` | Sí → `si` · No → `no` · No lo sé → `no_lo_se` |
| `inversion_primer_ano` | Menos de 10.000 € → `menos_10000` · 10.000–20.000 € → `10000_20000` · Más de 20.000 € → `mas_20000` · Aún no lo hemos definido → `sin_definir` |
| Casillas (`acepta_*`) | marcada → `si` · sin marcar → `no` |
| `encaja` | `no` si `sector = otro` o `necesita_conectores = si`; en otro caso `si`. Solo para el CRM: el usuario ve lo mismo. |

### 5.2 Objeto `datos` que recibe `enviarAlCRM`

```js
{
  sector, cargo, tamano_empresa,
  gestion_actual: ["excel", "programas_sin_conectar"],   // lista de slugs
  decisor, plazo_inicio, necesita_conectores, inversion_primer_ano,
  acepta_datos_depurados: "si",
  nombre, empresa, email,
  telefono: "+34612345678",          // E.164: prefijo + número sin espacios
  telefono_prefijo: "+34", telefono_numero: "612345678",
  que_resolver,                       // texto libre, máx. 500 caracteres
  acepta_privacidad: "si", acepta_llamada_ia: "si",
  acepta_comunicaciones: "si" | "no", acepta_medicion_publicitaria: "si" | "no",
  utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid,
  event_id,                           // UUID v4 generado al enviar
  encaja, landing_url, timestamp,     // timestamp en ISO 8601
  form_location: "popup" | "inline"
}
```

Los mismos valores quedan en los campos ocultos del `<form>` (`utm_*`, `fbclid`, `event_id`, `encaja`, `landing_url`, `timestamp`, `telefono` y `form_location`).

- **UTM y `fbclid`**: se leen de la URL al cargar y se guardan en `sessionStorage` (`freedoo_tracking`), así no se pierden si el usuario visita las páginas legales y vuelve. Si llega una URL con parámetros nuevos, sustituyen a los anteriores. `landing_url` es la URL de llegada con sus parámetros.
- **Teléfono**: con +34 se exigen 9 dígitos (se aceptan espacios, puntos y guiones, y se quita un «+34» o «0034» si el usuario lo escribe). Con otros prefijos, entre 6 y 14 dígitos.
- **Validación**: al pulsar «Continuar»/«Enviar» y al salir de un campo ya tocado. Mensajes junto al campo con `aria-invalid` y `aria-describedby`; foco al primer campo con error. Cuando un campo tiene error, se revalida mientras el usuario lo corrige.
- **Envío**: botón desactivado mientras envía (anti doble clic). Si `enviarAlCRM` falla, se muestra «No hemos podido enviar el formulario. Inténtalo de nuevo en unos segundos.» y no se pierde nada. El `event_id` se conserva en los reintentos.
- **Gracias**: sustituye al formulario en el mismo contenedor y pasa a **ambas** instancias. Se guarda en `sessionStorage` (`freedoo_lead_enviado`, solo el nombre) para no duplicar envíos si recarga.

---

## 6. Medición: eventos del `dataLayer`

GTM gestionará GA4, Clarity y el Pixel de Meta. La página solo publica eventos en `window.dataLayer`. **Nunca** se envían nombre, email, teléfono, empresa ni el texto libre: además de no incluirlos, la función `freedooPush` elimina esas claves si alguien las añade por error.

| `event` | Cuándo | Parámetros |
| --- | --- | --- |
| `cta_click` | Clic en cualquier «Comprobar si encajamos» | `cta_location`: `hero` · `como_trabajamos` · `inversion` · `sticky` |
| `form_open` | Se abre el pop-up | `form_location: "popup"` |
| `form_start` | Primera interacción con un formulario (una vez por instancia y sesión) | `form_location` |
| `form_step_complete` | Paso 1 válido (una vez por instancia y carga de página, para no inflar el embudo si vuelve atrás) | `form_location`, `step: 1`, `sector`, `cargo`, `tamano_empresa`, `decisor`, `plazo_inicio`, `necesita_conectores`, `inversion_primer_ano`, `encaja` |
| `form_error` | Error de validación al pulsar «Continuar» o «Enviar» | `form_location`, `step`, `field` (primer campo con error) |
| `generate_lead` | Envío completado con éxito | `form_location`, `event_id`, `sector`, `cargo`, `tamano_empresa`, `decisor`, `plazo_inicio`, `necesita_conectores`, `inversion_primer_ano`, `encaja`, `acepta_comunicaciones`, `acepta_medicion_publicitaria`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` |
| `faq_open` | Se abre una pregunta frecuente | `faq_question` (texto de la pregunta) |
| `consent_update` | El usuario guarda su elección de cookies | `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization` (`granted` / `denied`) |

El `event_id` de `generate_lead` es el mismo que va al CRM, para que la conversión que GHL envíe por API a Meta se pueda deduplicar con la del navegador. `[PENDIENTE: verificar en la migración que GHL envía ese event_id a Meta]`.

### 6.1 Consentimiento de cookies

1. Lo primero del `<head>` fija el modo de consentimiento de Google en **denegado** (`ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`, `wait_for_update: 500`) y `ads_data_redaction: true`.
2. **GTM solo se carga si el usuario acepta al menos una categoría** (analíticas o publicitarias) y si `GTM_ID` no es el marcador. Sin consentimiento no hay **ninguna** petición a Google, Meta ni Microsoft (comprobado en las pruebas). Por eso no se incluye el `<noscript>` de GTM: cargaría GTM sin consentimiento.
3. Banner propio con «Aceptar todas», «Rechazar todas» y «Configurar», con el mismo tamaño, color y peso. El panel tiene Técnicas (siempre activas), Analíticas (GA4 y Clarity → `analytics_storage`) y Publicitarias (Pixel de Meta → `ad_storage`, `ad_user_data`, `ad_personalization`).
4. Al guardar: `gtag('consent', 'update', …)` + evento `consent_update`. La elección se guarda en `localStorage` (`freedoo_consent`, con fecha) y se vuelve a preguntar a los 12 meses.
5. «Configurar cookies» del pie reabre el panel en las 4 páginas.
6. Si el usuario **retira** un consentimiento que ya había dado, se borran las cookies de esa categoría (`_ga*`, `_gid`, `_gat*`, `_clck`, `_clsk` / `_fbp`, `_fbc`, `_gcl_*`) y, si GTM ya estaba cargado, se recarga la página para detener las etiquetas.

**Configuración necesaria dentro de GTM** (no la puede hacer la página):

- GA4: las etiquetas de Google respetan `analytics_storage` por sí solas.
- Microsoft Clarity: en la configuración de consentimiento de la etiqueta, exigir `analytics_storage`.
- Pixel de Meta: exigir `ad_storage` (y `ad_user_data`).
- Activadores de tipo «Evento personalizado» con los nombres de la tabla anterior, y variables de capa de datos para sus parámetros.

---

## 7. Migración a GHL

- **Conservar el comportamiento**: si el formulario nativo de GHL sustituye al de esta página, hay que mantener dos pasos, pop-up más incrustado, gracias en el mismo lugar, campos ocultos y eventos del `dataLayer`.
- **`iframe`**: si el formulario de GHL se inserta dentro de un `iframe`, los eventos de su interior no llegan al `dataLayer` de la página. Verificarlo en la migración y, si ocurre, comunicarlos con `postMessage` o mantener este formulario propio enviando los datos a GHL desde `enviarAlCRM`.
- **Nombres de campo**: todos los `name` están en *snake_case* para mapearlos a campos personalizados de GHL (tabla 5.1).
- **`enviarAlCRM(datos)`**: es la única función que hay que cambiar para enviar los datos. Debe devolver una `Promise` que se resuelva solo si GHL ha recibido el lead. Una opción es un disparador de webhook entrante en un workflow de GHL que reciba el JSON por `fetch`; verificar en la cuenta qué opción está disponible. Si la URL del webhook queda visible en el código, conviene añadir alguna protección contra spam.
- **`<head>`**: el bloque `COMPARTIDO: consentimiento y GTM` tiene que ir **lo primero** del `<head>`, antes de cualquier otra etiqueta de seguimiento. Si GHL añade su propio banner de cookies o sus propios píxeles, desactivarlos para no duplicar ni cargar nada antes del consentimiento.
- **Recursos**: subir `assets/` a la biblioteca de medios de GHL y cambiar las rutas relativas (`assets/…`) por las URL definitivas, también en `@font-face` y en los `<link rel="preload">`. Si las fuentes se sirven desde otro dominio, ese servidor debe enviar la cabecera CORS `Access-Control-Allow-Origin`; si no, el navegador no las usa y se verá la fuente del sistema. Verificarlo tras la subida.
- **Enlaces**: cambiar `index.html`, `aviso-legal.html`, `politica-privacidad.html` y `politica-cookies.html` por las URL de GHL (pie, cabecera de las páginas legales, casilla de privacidad del formulario y enlaces internos de los textos legales).
- **Indexación**: las 4 páginas llevan `<meta name="robots" content="noindex, follow">` porque es una landing de pauta. Si se quiere indexar, quitarlo.
- **Después de publicar**: escaneo de cookies para completar la política de cookies, y comprobar en la pestaña Red que, sin consentimiento, no sale ninguna petición a Google, Meta ni Microsoft (GHL puede añadir scripts propios).

---

## 8. Comprobación final (sección 9 del brief)

Ejecutada con `pruebas/pruebas.js` en Chromium (Playwright): **176 de 176 comprobaciones superadas**, con capturas a 360, 390, 768, 1024 y 1440 px. Sin scroll horizontal y sin errores en consola en ninguna de las 4 páginas y en ninguno de los 5 anchos.

| # | Comprobación | Resultado |
| --- | --- | --- |
| 1 | Palabra rotativa cada 2 s, en bucle, en violeta, sin mover el resto | ✅ Orden correcto en bucle; el código usa un intervalo fijo de 2.000 ms y la prueba midió entre 1.964 y 2.070 ms (muestrea cada ~100 ms, de ahí la variación); el titular y el resto del antetítulo no se mueven ni un píxel a 360 y 1440 px; también con movimiento reducido (solo fundido). En escritorio, «Para» y la palabra comparten línea base. |
| 2 | Sticky visible en toda la página, abre el pop-up, se oculta con él abierto, no tapa el pie en móvil | ✅ |
| 3 | Pop-up atrapa el foco, Esc lo cierra, conserva respuestas | ✅ 60 tabulaciones (Tab y Mayús+Tab) sin salir; Esc, X y fondo cierran; foco inicial en el primer campo y vuelta al botón que lo abrió |
| 4 | Pop-up e incrustado se comportan igual | ✅ Mismas validaciones, pasos, mensajes y eventos en ambos |
| 5 | Tras enviar en uno, el otro también muestra gracias | ✅ En los dos sentidos, y también tras recargar |
| 6 | Sin número de asistente, sin número ni botón | ✅ Y con número: texto y descarga `.vcf` correctos |
| 7 | Ningún evento del `dataLayer` contiene datos personales | ✅ Se buscaron nombre, email, teléfono (con y sin prefijo), empresa y texto libre de prueba en todo el `dataLayer`: 0 coincidencias |
| 8 | Sin consentimiento, ninguna petición a Google, Meta ni Microsoft | ✅ Comprobado también con un ID de GTM de prueba: 0 peticiones antes de elegir y tras «Rechazar todas»; GTM solo se pide tras aceptar |
| 9 | «Rechazar todas» igual que «Aceptar todas» | ✅ Mismo ancho, alto, color, peso y tamaño de letra (360 y 1440 px) |
| 10 | Enlaces legales y «Configurar cookies» desde todas las páginas | ✅ 12 enlaces y el panel en las 4 páginas |
| 11 | No aparece el email erróneo (con tres «e») | ✅ 0 apariciones en todo el repositorio |
| 12 | `[PENDIENTE]` agrupados por responsable | ✅ Sección 3 |

**Lo que no he podido probar aquí**: Safari/iOS y Firefox reales (solo Chromium), lectores de pantalla reales, y el comportamiento dentro de GHL. Conviene revisarlo en la migración.

---

## 9. Decisiones tomadas y diferencias con el brief

1. **Montserrat servida en local, no desde Google Fonts.** El brief pide Google Fonts, pero también que sin consentimiento no haya **ninguna** petición a Google (puntos 6.3.6 y 9.8). Cargarla desde `fonts.googleapis.com` incumpliría lo segundo. Es la misma fuente (paquete `@fontsource/montserrat` 5.3.0, licencia SIL OFL 1.1, incluida), con `font-display: swap` y los pesos 400, 600 y 800.
2. **Color de la palabra rotativa `#E0CAF9` y capa negra al 65 %.** Con el ejemplo del brief (`#C9A3F2`) el contraste baja a 3,34:1 si la foto real tiene zonas blancas bajo la capa del 65 % (y a 2,26:1 con la capa del 55 %). Con `#E0CAF9` el peor caso posible, blanco puro bajo la capa, da **4,67:1**, así que cumple AA con cualquier foto. Va subrayada en `--violeta`.
3. **Logo sobre placa blanca en el hero.** El eslogan del logo es negro y no se leería sobre el fondo oscuro. No he creado una versión en blanco del logo para no alterar la marca sin aprobación.
4. **Textos que no venían en el brief** y he tenido que redactar (funcionales, sin marketing): banner y panel de cookies, mensajes de validación, títulos «Preguntas frecuentes» y «Configurar cookies», «Siempre activas», «Guardar selección», el contador «0/500» y el texto alternativo «Equipo de Freedoo». El pop-up usa como título «¿Vemos si encajamos?», copiado de la sección de cierre. El banner de cookies está en la lista del abogado.
5. **Mientras el banner de cookies está abierto**, se reserva al final de la página un espacio igual a su altura. Sin esto, en móvil el banner tapaba los enlaces legales del pie (lo detectaron las pruebas).
6. **Campo de teléfono**: un selector de prefijo (`telefono_prefijo`, +34 por defecto, 18 países) y el número (`telefono_numero`). El campo oculto `telefono` lleva el número completo en formato E.164.
7. **`form_step_complete`** se envía una vez por instancia y carga de página.
8. **Accesibilidad de la palabra rotativa**: el elemento animado lleva `aria-hidden="true"` y hay un texto oculto con la frase completa, como pide el brief. Aviso: el criterio WCAG 2.2.2 (nivel A) pide poder pausar el contenido que se mueve o actualiza solo durante más de 5 s. El brief pide bucle infinito, así que no he añadido botón de pausa; si se quiere cumplir ese criterio, hay que añadirlo o parar la rotación tras unas vueltas.
9. **Páginas legales**: también con `noindex, follow`. En móvil, la tabla de cookies (5 columnas) se desplaza en horizontal dentro de su caja; la página nunca.
