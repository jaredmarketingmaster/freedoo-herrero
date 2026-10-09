# Resumen del trabajo realizado · Landing de Freedoo

Fecha: 2026-10-09 · Rama: `claude/freedoo-landing-meta-ads-a2mvp9` · PR: [jaredmarketingmaster/freedoo-herrero#1](https://github.com/jaredmarketingmaster/freedoo-herrero/pull/1)

## 1. Objetivo

Landing de captación B2B para **Freedoo** (partner oficial de Odoo), dirigida a ingenierías, estudios de arquitectura, consultoras de negocio e IT y empresas industriales. Sirve para un test de avatares en Meta Ads. Su único fin es que el lead correcto rellene un formulario de cualificación; después un asistente de IA le llama para agendar una reunión. Más adelante se migrará a GoHighLevel (GHL), por eso es HTML, CSS y JavaScript vanilla, sin dependencias.

## 2. Qué se ha entregado

| Archivo | Contenido |
| --- | --- |
| `index.html` | Landing completa: hero con palabra rotativa, 8 secciones con el copy literal del brief, pop-up y formulario incrustado, botón sticky y pie con ola |
| `aviso-legal.html`, `politica-privacidad.html`, `politica-cookies.html` | Borradores para revisión del abogado, con el mismo banner de cookies y pie |
| `assets/` | Logo del cliente recortado, favicon, Montserrat en local (400/600/800, licencia OFL), marcadores de imagen para hero y equipo, logo original |
| `README.md` | Pendientes por responsable, constantes, eventos, tabla de slugs, migración a GHL, decisiones |
| `pruebas/pruebas.js` | 176 comprobaciones automáticas con Playwright |
| `.nojekyll`, `.gitignore` | Para GitHub Pages y para ignorar las capturas de prueba |

## 3. Cómo funciona

- **Formulario:** un único componente en dos pasos, clonado en el pop-up (`popup`) y en la sección de cierre (`inline`). Misma lógica, validaciones y eventos. Al enviar en uno, ambos muestran la página de gracias.
- **`encaja`:** `no` si `sector = otro` o `necesita_conectores = si`. Es solo un dato para el CRM; el usuario ve lo mismo.
- **`enviarAlCRM(datos)`:** de momento solo simula el envío (`console.info`). Es la única función a cambiar en la migración (`// TODO GHL`).
- **Medición:** eventos en `window.dataLayer` para GTM (`cta_click`, `form_open`, `form_start`, `form_step_complete`, `form_error`, `generate_lead`, `faq_open`, `consent_update`). Nunca llevan nombre, email, teléfono, empresa ni texto libre.
- **Cookies:** consentimiento de Google denegado por defecto. GTM solo se carga tras aceptar y con un ID real. Sin consentimiento no hay peticiones a Google, Meta ni Microsoft.
- **Constantes:** `GTM_ID = "GTM-XXXXXXX"` (GTM no se carga) y `TELEFONO_ASISTENTE = ""` (sin número ni botón de contacto en la página de gracias).

## 4. Verificación

176 de 176 pruebas superadas en Chromium, a 360, 390, 768, 1024 y 1440 px: sin scroll horizontal ni errores de consola, palabra rotativa cada ~2 s, foco atrapado en el pop-up, validaciones, sincronización de ambos formularios, ausencia de datos personales en el `dataLayer`, cero peticiones a terceros sin consentimiento y botones de cookies de igual tamaño. No se ha probado en Safari/iOS, Firefox, lectores de pantalla ni dentro de GHL.

## 5. Decisiones que se apartan del brief

1. **Montserrat en local**, no desde Google Fonts: cargarla desde Google incumpliría la exigencia de cero peticiones a Google sin consentimiento.
2. **Palabra rotativa en `#E0CAF9`** (no `#C9A3F2`): garantiza contraste ≥ 4,5:1 (4,67:1 en el peor caso) con la capa negra al 65 %.
3. **Logo sobre placa blanca** en el hero: el eslogan es negro y no se leería sobre fondo oscuro.
4. **El violeta real del logo es `#762DDC`**; el brief usa `#8130D4` (estimado). Conviene que el cliente confirme cuál usar.
5. **Textos redactados por mí** (no venían en el brief): banner y panel de cookies, mensajes de validación y algunos títulos. El del banner queda en la lista del abogado.
6. **Sin botón de pausa** en la palabra rotativa (el brief pide bucle infinito); la norma WCAG 2.2.2 lo recomienda.

## 6. Pendientes

- **Cliente:** razón social, NIF, domicilio, datos registrales, email, teléfono, URL, foto de oficina y de equipo, número del asistente de IA, proveedores (voz, calendario, email) y fechas de las páginas legales.
- **Abogado:** mantener o eliminar la casilla de medición en Meta, bases legales, encargado o corresponsable de Meta, transferencias internacionales, plazo de conservación y validar los textos de consentimiento, legales y del banner.
- **Migración a GHL:** conectar `enviarAlCRM`, poner el ID de GTM y configurar GA4, Clarity y Pixel dentro de GTM, verificar que GHL envía el mismo `event_id` a Meta y hacer un escaneo de cookies.

El detalle completo está en `README.md`.

## 7. Estado de publicación

- **Commits:** 2 en la rama (landing + `.nojekyll`), subidos. El PR #1 está abierto y sin conflictos con `main`.
- **GitHub Pages:** está activado, pero aún no se ha publicado nada. Para verla, en *Settings → Pages* hay que elegir la rama `claude/freedoo-landing-meta-ads-a2mvp9`, carpeta `/ (root)`. La URL sería `https://jaredmarketingmaster.github.io/freedoo-herrero/`. No he podido comprobarla porque este entorno bloquea `github.io`.
- **Avisos antes de compartir el enlace:** cualquiera con el enlace la verá, con los `[PENDIENTE]` visibles. El formulario no envía nada y no se mide nada hasta configurar GTM.
- **Descripción del PR:** se generó automáticamente y contiene cuatro imprecisiones (campos condicionales que no existen, «9 preguntas de selección múltiple», datos del CRM «depurados» y el log de `enviarAlCRM` solo en desarrollo). Está pendiente de corregir si lo confirmas.
