// Pruebas end-to-end de la landing de Freedoo (Playwright + Chromium).
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = "http://localhost:8080/";
const OUT = path.join(__dirname, "capturas");
const RAIZ = path.join(__dirname, "..");
fs.mkdirSync(OUT, { recursive: true });

const resultados = [];
function ok(nombre, cond, detalle = "") {
  resultados.push({ nombre, ok: !!cond, detalle });
  console.log(`${cond ? "PASA" : "FALLA"} · ${nombre}${detalle ? " — " + detalle : ""}`);
}

const DOMINIOS_TERCEROS = /(google|googletagmanager|google-analytics|doubleclick|gstatic|facebook|fbcdn|meta\.com|connect\.facebook|clarity\.ms|microsoft|bing\.com)/i;
const PII = { nombre: "Zacarías Prueba", empresa: "Empresa Ficticia SL", email: "zacarias@ejemplo-ficticio.es", tel: "612345678", libre: "Texto libre de prueba XYZ" };

async function nuevaPagina(browser, opts = {}) {
  const context = await browser.newContext({ viewport: opts.viewport || { width: 1440, height: 900 }, reducedMotion: opts.reducedMotion || "no-preference", acceptDownloads: true });
  const page = await context.newPage();
  const errores = [];
  const peticionesTerceros = [];
  page.on("console", (m) => { if (m.type() === "error") errores.push(m.text()); });
  page.on("pageerror", (e) => errores.push("pageerror: " + e.message));
  page.on("request", (r) => { if (DOMINIOS_TERCEROS.test(new URL(r.url()).hostname)) peticionesTerceros.push(r.url()); });
  if (opts.route) await opts.route(page);
  return { context, page, errores, peticionesTerceros };
}

async function rellenarPaso1(page, scope) {
  const s = scope;
  await page.locator(`${s} input[name="sector"][value="ingenieria"]`).check();
  await page.locator(`${s} input[name="cargo"][value="gerencia"]`).check();
  await page.locator(`${s} input[name="tamano_empresa"][value="10_50"]`).check();
  await page.locator(`${s} input[name="gestion_actual"][value="excel"]`).check();
  await page.locator(`${s} input[name="gestion_actual"][value="programas_sin_conectar"]`).check();
  await page.locator(`${s} input[name="decisor"][value="yo"]`).check();
  await page.locator(`${s} input[name="plazo_inicio"][value="este_trimestre"]`).check();
  await page.locator(`${s} input[name="necesita_conectores"][value="no"]`).check();
  await page.locator(`${s} input[name="inversion_primer_ano"][value="10000_20000"]`).check();
  await page.locator(`${s} input[name="acepta_datos_depurados"]`).check();
}
async function rellenarPaso2(page, scope) {
  const s = scope;
  await page.locator(`${s} input[name="nombre"]`).fill(PII.nombre);
  await page.locator(`${s} input[name="empresa"]`).fill(PII.empresa);
  await page.locator(`${s} input[name="email"]`).fill(PII.email);
  await page.locator(`${s} input[name="telefono_numero"]`).fill("612 345 678");
  await page.locator(`${s} textarea[name="que_resolver"]`).fill(PII.libre);
  await page.locator(`${s} input[name="acepta_privacidad"]`).check();
  await page.locator(`${s} input[name="acepta_llamada_ia"]`).check();
  await page.locator(`${s} input[name="acepta_comunicaciones"]`).check();
}
const dl = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.dataLayer.map((x) => (x && x.length !== undefined && !Array.isArray(x) && typeof x === "object" && x[0] !== undefined) ? Array.prototype.slice.call(x) : x))));
const eventos = async (page, nombre) => (await dl(page)).filter((e) => e && e.event === nombre);

(async () => {
  const browser = await chromium.launch();

  /* 1. Carga, consola, scroll horizontal y capturas en 5 anchos */
  for (const w of [360, 390, 768, 1024, 1440]) {
    const { context, page, errores, peticionesTerceros } = await nuevaPagina(browser, { viewport: { width: w, height: w < 768 ? 800 : 900 } });
    await page.goto(BASE + "index.html", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(`[${w}px] sin scroll horizontal`, desborde <= 0, `scrollWidth - clientWidth = ${desborde}`);
    const fuente = await page.evaluate(() => document.fonts.check('800 16px "Montserrat"'));
    ok(`[${w}px] Montserrat cargada en local`, fuente);
    const geo = await page.evaluate(() => {
      const rng = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getClientRects()[0]; };
      const altos = [...document.querySelectorAll("[data-abrir-form]")].map((b) => Math.round(b.getBoundingClientRect().height));
      return { para: rng(document.querySelector(".antetitulo__para")).bottom, palabra: rng(document.querySelector(".rotador__palabra.is-activa")).bottom, altos };
    });
    if (w >= 768) ok(`[${w}px] «Para» y la palabra rotativa en la misma línea base`, Math.abs(geo.para - geo.palabra) < 0.5, `${geo.para} vs ${geo.palabra}`);
    ok(`[${w}px] todos los botones «Comprobar si encajamos» en una sola línea`, geo.altos.every((h) => h < 70), geo.altos.join(","));
    await page.screenshot({ path: path.join(OUT, `landing-${w}.png`), fullPage: true });
    // Con el banner cerrado (rechazo) para ver la página limpia
    await page.click('#cookies [data-cookies="rechazar"]');
    await page.screenshot({ path: path.join(OUT, `landing-${w}-sin-banner.png`), fullPage: false });
    ok(`[${w}px] sin errores en consola`, errores.length === 0, errores.join(" | "));
    ok(`[${w}px] sin peticiones a Google/Meta/Microsoft`, peticionesTerceros.length === 0, peticionesTerceros.join(", "));
    for (const legal of ["aviso-legal.html", "politica-privacidad.html", "politica-cookies.html"]) {
      await page.goto(BASE + legal, { waitUntil: "networkidle" });
      const d = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(`[${w}px] ${legal} sin scroll horizontal`, d <= 0, `desborde ${d}`);
      if (w === 360 || w === 1440) await page.screenshot({ path: path.join(OUT, `${legal.replace(".html", "")}-${w}.png`), fullPage: true });
    }
    ok(`[${w}px] páginas legales sin errores ni terceros`, errores.length === 0 && peticionesTerceros.length === 0, errores.concat(peticionesTerceros).join(" | "));
    await context.close();
  }

  /* 2. Palabra rotativa: orden, cadencia 2 s, color y sin saltos de maquetación */
  for (const [w, rm] of [[360, "no-preference"], [1440, "no-preference"], [390, "reduce"]]) {
    const { context, page } = await nuevaPagina(browser, { viewport: { width: w, height: 800 }, reducedMotion: rm });
    await page.goto(BASE + "index.html", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const muestras = [];
    const t0 = Date.now();
    while (Date.now() - t0 < 9000) {
      const m = await page.evaluate(() => {
        const act = document.querySelector(".rotador__palabra.is-activa");
        const h1 = document.querySelector(".hero__titulo").getBoundingClientRect();
        const resto = document.querySelector(".antetitulo__resto").getBoundingClientRect();
        const cs = getComputedStyle(act);
        return { palabra: act.textContent, h1Top: h1.top, h1Left: h1.left, restoTop: resto.top, restoLeft: resto.left, color: cs.color, transform: cs.transform };
      });
      muestras.push({ t: Date.now() - t0, ...m });
      await page.waitForTimeout(100);
    }
    const cambios = [];
    for (let i = 1; i < muestras.length; i++) if (muestras[i].palabra !== muestras[i - 1].palabra) cambios.push({ t: muestras[i].t, palabra: muestras[i].palabra });
    const orden = ["ingenierías", "estudios de arquitectura", "consultoras de negocio e IT", "empresas industriales"];
    const secuencia = [muestras[0].palabra, ...cambios.map((c) => c.palabra)];
    const ordenOk = secuencia.every((p, i) => p === orden[i % 4]);
    const intervalos = cambios.slice(1).map((c, i) => c.t - cambios[i].t);
    const intervalosOk = intervalos.length >= 2 && intervalos.every((d) => Math.abs(d - 2000) <= 250);
    const h1Estable = new Set(muestras.map((m) => Math.round(m.h1Top) + "," + Math.round(m.h1Left))).size === 1;
    const restoEstable = new Set(muestras.map((m) => Math.round(m.restoTop) + "," + Math.round(m.restoLeft))).size === 1;
    ok(`[${w}px, movimiento=${rm}] palabra rotativa en orden y en bucle`, ordenOk && secuencia.length >= 5, secuencia.join(" → "));
    ok(`[${w}px, movimiento=${rm}] cambia cada ~2 s`, intervalosOk, `intervalos (ms): ${intervalos.join(", ")}`);
    ok(`[${w}px, movimiento=${rm}] el resto del texto no se mueve`, h1Estable && restoEstable);
    ok(`[${w}px, movimiento=${rm}] color de la palabra violeta claro #E0CAF9`, muestras[0].color === "rgb(224, 202, 249)", muestras[0].color);
    if (rm === "reduce") ok(`[${w}px] con movimiento reducido no hay deslizamiento`, muestras.every((m) => m.transform === "none"), muestras[0].transform);
    await context.close();
  }

  /* 3. Sticky, pop-up, foco, Esc, conservación de respuestas, eventos */
  {
    const { context, page, errores } = await nuevaPagina(browser, { viewport: { width: 390, height: 800 } });
    await page.goto(BASE + "index.html", { waitUntil: "networkidle" });
    await page.click('#cookies [data-cookies="rechazar"]');
    const alturas = await page.evaluate(() => document.documentElement.scrollHeight);
    let visibleSiempre = true;
    for (const y of [0, alturas * 0.25, alturas * 0.5, alturas * 0.75, alturas]) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      const v = await page.evaluate(() => { const r = document.querySelector(".sticky").getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight + 1 && getComputedStyle(document.querySelector(".sticky")).display !== "none"; });
      visibleSiempre = visibleSiempre && v;
    }
    ok("[390px] sticky visible en cualquier posición de scroll", visibleSiempre);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const tapa = await page.evaluate(() => {
      const s = document.querySelector(".sticky").getBoundingClientRect();
      const f = document.querySelector(".pie__franja p").getBoundingClientRect();
      return { stickyTop: s.top, franjaTextoBottom: f.bottom };
    });
    ok("[390px] el sticky no tapa el pie al final de la página", tapa.franjaTextoBottom <= tapa.stickyTop, JSON.stringify(tapa));
    await page.screenshot({ path: path.join(OUT, "movil-final-pagina-sticky.png") });

    await page.click(".sticky [data-abrir-form]");
    await page.waitForTimeout(300);
    const abierto = await page.evaluate(() => !document.getElementById("modal-form").hidden);
    const stickyOculto = await page.evaluate(() => getComputedStyle(document.querySelector(".sticky")).display === "none");
    const foco = await page.evaluate(() => ({ name: document.activeElement.name, value: document.activeElement.value }));
    const scrollBloqueado = await page.evaluate(() => getComputedStyle(document.body).overflow === "hidden");
    ok("sticky abre el pop-up", abierto);
    ok("sticky oculto con el pop-up abierto", stickyOculto);
    ok("foco inicial en el primer campo del pop-up", foco.name === "sector" && foco.value === "ingenieria", JSON.stringify(foco));
    ok("scroll del body bloqueado con el pop-up abierto", scrollBloqueado);
    const dlEv = await dl(page);
    ok("cta_click (sticky) + form_open en el dataLayer", dlEv.some((e) => e.event === "cta_click" && e.cta_location === "sticky") && dlEv.some((e) => e.event === "form_open" && e.form_location === "popup"));
    // Pop-up a pantalla completa en móvil
    const panel = await page.evaluate(() => { const r = document.querySelector(".modal__panel").getBoundingClientRect(); return { w: r.width, h: r.height, iw: innerWidth, ih: innerHeight }; });
    ok("[390px] pop-up a pantalla completa", Math.round(panel.w) === panel.iw && Math.round(panel.h) === panel.ih, JSON.stringify(panel));
    await page.screenshot({ path: path.join(OUT, "movil-popup-paso1.png") });

    // Foco atrapado: 60 tabulaciones sin salir del panel
    let fuera = 0;
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press(i % 7 === 6 ? "Shift+Tab" : "Tab");
      const dentro = await page.evaluate(() => document.querySelector(".modal__panel").contains(document.activeElement));
      if (!dentro) fuera++;
    }
    ok("foco atrapado dentro del pop-up (Tab y Shift+Tab)", fuera === 0, `salidas: ${fuera}`);

    // Responder parcialmente, cerrar con Esc y reabrir
    await page.locator('[data-form-host="popup"] input[name="sector"][value="arquitectura"]').check();
    await page.locator('[data-form-host="popup"] input[name="cargo"][value="responsable_it"]').check();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(150);
    const cerrado = await page.evaluate(() => document.getElementById("modal-form").hidden);
    const stickyVuelve = await page.evaluate(() => getComputedStyle(document.querySelector(".sticky")).display !== "none");
    const focoVuelve = await page.evaluate(() => document.activeElement.matches(".sticky [data-abrir-form]"));
    ok("Esc cierra el pop-up", cerrado);
    ok("el sticky vuelve al cerrar el pop-up y recibe el foco", stickyVuelve && focoVuelve);
    await page.click(".sticky [data-abrir-form]");
    const conservado = await page.evaluate(() => ({
      s: document.querySelector('[data-form-host="popup"] input[name="sector"]:checked')?.value,
      c: document.querySelector('[data-form-host="popup"] input[name="cargo"]:checked')?.value,
    }));
    ok("al reabrir se conservan las respuestas", conservado.s === "arquitectura" && conservado.c === "responsable_it", JSON.stringify(conservado));
    // Cierre con la X y con el fondo
    await page.click(".modal__cerrar");
    ok("la X cierra el pop-up", await page.evaluate(() => document.getElementById("modal-form").hidden));
    await page.click(".sticky [data-abrir-form]");
    await context.close();
  }

  /* 3b. Escritorio: panel 560 px centrado, cierre con el fondo, botones CTA y FAQ */
  {
    const { context, page } = await nuevaPagina(browser, { viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + "index.html", { waitUntil: "networkidle" });
    await page.click('#cookies [data-cookies="rechazar"]');
    for (const loc of ["hero", "como_trabajamos", "inversion", "sticky"]) {
      await page.locator(`[data-cta="${loc}"]`).scrollIntoViewIfNeeded();
      await page.click(`[data-cta="${loc}"]`);
      await page.waitForTimeout(250);
      if (loc === "hero") {
        const r = await page.evaluate(() => { const b = document.querySelector(".modal__panel").getBoundingClientRect(); return { w: b.width, left: b.left, right: innerWidth - b.right - (innerWidth - document.documentElement.clientWidth) }; });
        ok("[1440px] pop-up de 560 px centrado", Math.round(r.w) === 560 && Math.abs(r.left - (1440 - 560) / 2) < 12, JSON.stringify(r));
        await page.screenshot({ path: path.join(OUT, "escritorio-popup-paso1.png") });
      }
      await page.mouse.click(30, 450); // fondo
      await page.waitForTimeout(150);
    }
    const ctas = (await eventos(page, "cta_click")).map((e) => e.cta_location);
    ok("cta_click con las 4 ubicaciones", ["hero", "como_trabajamos", "inversion", "sticky"].every((l) => ctas.includes(l)), ctas.join(", "));
    ok("clic en el fondo cierra el pop-up", await page.evaluate(() => document.getElementById("modal-form").hidden));
    await page.locator(".faq__item summary").nth(2).click();
    await page.waitForTimeout(200);
    const faq = await eventos(page, "faq_open");
    ok("faq_open con el texto de la pregunta", faq.length === 1 && faq[0].faq_question === "¿Por qué no usar ChatGPT u otra IA gratuita?", JSON.stringify(faq));
    await page.locator(".faq__item").nth(2).screenshot({ path: path.join(OUT, "faq-abierta.png") });
    await context.close();
  }

  /* 4-7. Validación, pasos, envío, gracias sincronizadas, campos ocultos y PII en el dataLayer */
  {
    const { context, page, errores } = await nuevaPagina(browser, { viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + "index.html?utm_source=meta&utm_medium=paid&utm_campaign=test_avatares&utm_content=ingenierias&utm_term=erp&fbclid=FBCLID123", { waitUntil: "networkidle" });
    await page.click('#cookies [data-cookies="rechazar"]');
    // Ir a una página legal y volver sin parámetros
    await page.goto(BASE + "aviso-legal.html", { waitUntil: "networkidle" });
    await page.click(".cabecera-legal a");
    await page.waitForLoadState("networkidle");
    ok("al volver desde la página legal la URL ya no tiene UTM", !page.url().includes("utm_"), page.url());
    await page.evaluate(() => { window.__envios = []; window.enviarAlCRM = (d) => { window.__envios.push(d); return Promise.resolve({ ok: true }); }; });

    for (const ubic of ["popup", "inline"]) {
      const S = `[data-form-host="${ubic}"]`;
      if (ubic === "popup") { await page.click('[data-cta="hero"]'); await page.waitForTimeout(250); }
      else await page.locator(S).scrollIntoViewIfNeeded();
      // Continuar sin rellenar
      await page.click(`${S} [data-continuar]`);
      await page.waitForTimeout(400);
      const err = await page.evaluate((S) => ({
        visibles: [...document.querySelectorAll(`${S} [data-paso="1"] .campo__error:not([hidden])`)].map((e) => e.id),
        foco: document.activeElement.name,
        invalid: document.querySelector(`${S} input[name="sector"]`).getAttribute("aria-invalid"),
        describedby: document.querySelector(`${S} input[name="sector"]`).getAttribute("aria-describedby"),
        texto: document.querySelector(`${S} [data-campo="sector"] .campo__error`).textContent,
      }), S);
      ok(`[${ubic}] Continuar vacío muestra 9 errores`, err.visibles.length === 9, err.visibles.join(","));
      ok(`[${ubic}] foco al primer campo con error y aria-invalid/aria-describedby`, err.foco === "sector" && err.invalid === "true" && err.describedby === `err-sector-${ubic}`, JSON.stringify(err));
      if (ubic === "inline") await page.locator(S).screenshot({ path: path.join(OUT, "form-errores-paso1.png") });
      const fe = (await eventos(page, "form_error")).filter((e) => e.form_location === ubic);
      ok(`[${ubic}] form_error con step 1 y field sector`, fe.length >= 1 && fe[0].step === 1 && fe[0].field === "sector", JSON.stringify(fe[0]));
      // Validación al salir de un campo tocado
      await rellenarPaso1(page, S);
      const errRestantes = await page.evaluate((S) => document.querySelectorAll(`${S} [data-paso="1"] .campo__error:not([hidden])`).length, S);
      ok(`[${ubic}] los errores desaparecen al corregir`, errRestantes === 0, String(errRestantes));
      await page.click(`${S} [data-continuar]`);
      await page.waitForTimeout(300);
      const paso2 = await page.evaluate((S) => ({ visible: !document.querySelector(`${S} [data-paso="2"]`).hidden, texto: document.querySelector(`${S} [data-paso-texto]`).textContent, foco: document.activeElement.name }), S);
      ok(`[${ubic}] pasa al paso 2 ("Paso 2 de 2") con foco en Nombre`, paso2.visible && paso2.texto.startsWith("Paso 2 de 2") && paso2.foco === "nombre", JSON.stringify(paso2));
      const sc = (await eventos(page, "form_step_complete")).filter((e) => e.form_location === ubic);
      ok(`[${ubic}] form_step_complete con los parámetros de cualificación`, sc.length === 1 && sc[0].step === 1 && sc[0].sector === "ingenieria" && sc[0].cargo === "gerencia" && sc[0].tamano_empresa === "10_50" && sc[0].decisor === "yo" && sc[0].plazo_inicio === "este_trimestre" && sc[0].necesita_conectores === "no" && sc[0].inversion_primer_ano === "10000_20000" && sc[0].encaja === "si", JSON.stringify(sc[0]));
      // Volver conserva el paso 1
      await page.click(`${S} [data-volver]`);
      const conserva = await page.evaluate((S) => document.querySelector(`${S} input[name="sector"]:checked`)?.value, S);
      ok(`[${ubic}] ← Volver conserva las respuestas del paso 1`, conserva === "ingenieria");
      await page.click(`${S} [data-continuar]`);
      // Errores del paso 2
      await page.click(`${S} [data-enviar]`);
      await page.waitForTimeout(300);
      const e2 = await page.evaluate((S) => [...document.querySelectorAll(`${S} [data-paso="2"] .campo__error:not([hidden])`)].map((e) => e.id.replace(/-(popup|inline)$/, "")), S);
      ok(`[${ubic}] Enviar vacío marca nombre, empresa, email, teléfono y 2 consentimientos`, JSON.stringify(e2) === JSON.stringify(["err-nombre", "err-empresa", "err-email", "err-telefono", "err-acepta_privacidad", "err-acepta_llamada_ia"]), e2.join(","));
      if (ubic === "inline") await page.locator(S).screenshot({ path: path.join(OUT, "form-errores-paso2.png") });
      // Teléfono con 8 dígitos y email mal formado
      await page.fill(`${S} input[name="telefono_numero"]`, "61234567");
      await page.fill(`${S} input[name="email"]`, "correo@malo");
      await page.locator(`${S} input[name="nombre"]`).focus();
      const msgs = await page.evaluate((S) => ({ tel: document.querySelector(`${S} [data-campo="telefono"] .campo__error`).textContent, email: document.querySelector(`${S} [data-campo="email"] .campo__error`).textContent }), S);
      ok(`[${ubic}] valida 9 dígitos para +34 y formato de email`, msgs.tel === "El número debe tener 9 dígitos." && msgs.email.startsWith("Revisa el email"), JSON.stringify(msgs));
      // Casillas nunca premarcadas
      const premarcadas = await page.evaluate((S) => [...document.querySelectorAll(`${S} input[type="checkbox"]`)].filter((c) => c.defaultChecked).length, S);
      ok(`[${ubic}] ninguna casilla viene premarcada`, premarcadas === 0);
      // Contador
      await rellenarPaso2(page, S);
      const cnt = await page.evaluate((S) => document.querySelector(`${S} [data-contador]`).textContent, S);
      ok(`[${ubic}] contador de caracteres del texto libre`, cnt === String(PII.libre.length), cnt);
      if (ubic === "popup") { await page.keyboard.press("Escape"); continue; } // el envío del pop-up se prueba abajo
      // Fallo del CRM
      await page.evaluate(() => { window.__enviarOk = window.enviarAlCRM; window.enviarAlCRM = () => new Promise((_, rej) => setTimeout(() => rej(new Error("simulado")), 300)); });
      await page.click(`${S} [data-enviar]`);
      const durante = await page.evaluate((S) => document.querySelector(`${S} [data-enviar]`).disabled, S);
      await page.click(`${S} [data-enviar]`, { force: true, noWaitAfter: true, timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(600);
      const tras = await page.evaluate((S) => ({ error: !document.querySelector(`${S} [data-error-envio]`).hidden, texto: document.querySelector(`${S} [data-error-envio]`).textContent, nombre: document.querySelector(`${S} input[name="nombre"]`).value, habilitado: !document.querySelector(`${S} [data-enviar]`).disabled }), S);
      ok(`[${ubic}] botón desactivado mientras envía (anti doble clic)`, durante === true);
      ok(`[${ubic}] si el CRM falla: mensaje de error y datos conservados`, tras.error && tras.texto === "No hemos podido enviar el formulario. Inténtalo de nuevo en unos segundos." && tras.nombre === PII.nombre && tras.habilitado, JSON.stringify(tras));
      ok(`[${ubic}] sin generate_lead si el envío falla`, (await eventos(page, "generate_lead")).length === 0);
      await page.locator(S).screenshot({ path: path.join(OUT, "form-error-envio.png") });
      // Reintento con éxito
      await page.evaluate(() => { window.enviarAlCRM = window.__enviarOk; });
      await page.click(`${S} [data-enviar]`);
      await page.waitForTimeout(400);
    }
    const envios = await page.evaluate(() => window.__envios);
    ok("enviarAlCRM recibe un único envío tras el reintento", envios.length === 1, String(envios.length));
    const d = envios[0] || {};
    ok("campos ocultos: UTM y fbclid recuperados de sessionStorage", d.utm_source === "meta" && d.utm_medium === "paid" && d.utm_campaign === "test_avatares" && d.utm_content === "ingenierias" && d.utm_term === "erp" && d.fbclid === "FBCLID123", JSON.stringify({ s: d.utm_source, f: d.fbclid }));
    ok("landing_url conserva la URL de llegada con parámetros", (d.landing_url || "").includes("utm_source=meta"), d.landing_url);
    ok("event_id es un UUID v4", /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(d.event_id || ""), d.event_id);
    ok("timestamp en ISO 8601", !isNaN(Date.parse(d.timestamp)) && /^\d{4}-\d{2}-\d{2}T/.test(d.timestamp || ""), d.timestamp);
    ok("teléfono normalizado a +34XXXXXXXXX", d.telefono === "+34612345678", d.telefono);
    ok("encaja = si para ingeniería sin conectores", d.encaja === "si");
    ok("gestion_actual como lista de slugs", JSON.stringify(d.gestion_actual) === JSON.stringify(["excel", "programas_sin_conectar"]), JSON.stringify(d.gestion_actual));
    const hidden = await page.evaluate(() => null);
    // Gracias en ambas instancias
    const gracias = await page.evaluate(() => ({
      inline: document.querySelector('[data-form-host="inline"] [data-gracias] h3')?.textContent,
      popup: document.querySelector('[data-form-host="popup"] [data-gracias] h3')?.textContent,
      formularios: document.querySelectorAll("[data-formulario]").length,
      foco: document.activeElement.matches('[data-form-host="inline"] [data-gracias]'),
      boton: document.querySelectorAll("[data-guardar-contacto]").length,
      texto: document.querySelector('[data-form-host="inline"] [data-gracias] p').textContent,
    }));
    ok("gracias en el mismo contenedor (incrustado) con el nombre", gracias.inline === `Gracias, ${PII.nombre}. Ten el móvil a mano.`, gracias.inline);
    ok("tras enviar en el incrustado, el pop-up también muestra gracias", gracias.popup === gracias.inline && gracias.formularios === 0);
    ok("foco en la página de gracias", gracias.foco);
    ok("sin TELEFONO_ASISTENTE: sin número ni botón de contacto", gracias.boton === 0 && gracias.texto === "En unos minutos te llamará el asistente de inteligencia artificial de Freedoo. Te hará un par de preguntas y te propondrá un hueco para reunirte con nuestro equipo.", gracias.texto);
    await page.locator('[data-form-host="inline"]').screenshot({ path: path.join(OUT, "gracias-incrustado.png") });
    const gl = await eventos(page, "generate_lead");
    ok("generate_lead con todos los parámetros", gl.length === 1 && gl[0].form_location === "inline" && gl[0].event_id === d.event_id && gl[0].encaja === "si" && gl[0].acepta_comunicaciones === "si" && gl[0].acepta_medicion_publicitaria === "no" && gl[0].utm_source === "meta" && gl[0].utm_term === "erp", JSON.stringify(gl[0]));
    // PII: ningún evento contiene datos personales
    const todoDL = JSON.stringify(await dl(page));
    const filtrados = Object.values(PII).concat(["+34612345678", "612 345 678"]).filter((v) => todoDL.includes(v));
    ok("ningún evento del dataLayer contiene nombre, email, teléfono, empresa ni texto libre", filtrados.length === 0, filtrados.join(", "));
    const claves = new Set((await dl(page)).filter((e) => e && e.event).flatMap((e) => Object.keys(e)));
    ok("ninguna clave PII en el dataLayer", !["nombre", "email", "telefono", "empresa", "que_resolver", "fbclid", "landing_url"].some((k) => claves.has(k)), [...claves].join(","));
    // Recarga: se mantiene la página de gracias (sessionStorage)
    await page.reload({ waitUntil: "networkidle" });
    const trasRecarga = await page.evaluate(() => document.querySelectorAll("[data-gracias]").length);
    ok("tras recargar, ambas instancias siguen mostrando gracias", trasRecarga === 2);
    ok("sin errores de consola en el flujo de envío", errores.length === 0, errores.join(" | "));
    await context.close();
  }

  /* 5b. Envío desde el pop-up y encaja = no */
  {
    const { context, page } = await nuevaPagina(browser, { viewport: { width: 390, height: 800 } });
    await page.goto(BASE + "index.html", { waitUntil: "networkidle" });
    await page.click('#cookies [data-cookies="rechazar"]');
    await page.evaluate(() => { window.__envios = []; window.enviarAlCRM = (d) => { window.__envios.push(d); return Promise.resolve(); }; });
    await page.click(".sticky [data-abrir-form]");
    const S = '[data-form-host="popup"]';
    await rellenarPaso1(page, S);
    await page.locator(`${S} input[name="sector"][value="otro"]`).check();
    await page.click(`${S} [data-continuar]`);
    await page.screenshot({ path: path.join(OUT, "movil-popup-paso2.png") });
    await rellenarPaso2(page, S);
    await page.click(`${S} [data-enviar]`);
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => ({ envio: window.__envios[0], popup: !!document.querySelector('[data-form-host="popup"] [data-gracias]'), inline: !!document.querySelector('[data-form-host="inline"] [data-gracias]'), foco: document.activeElement.matches('[data-form-host="popup"] [data-gracias]') }));
    ok("[pop-up] encaja = no si sector = Otro (dato solo para el CRM)", r.envio && r.envio.encaja === "no" && r.envio.form_location === "popup");
    ok("[pop-up] gracias en el pop-up y también en el incrustado", r.popup && r.inline && r.foco);
    await page.screenshot({ path: path.join(OUT, "movil-popup-gracias.png") });
    const gl = await eventos(page, "generate_lead");
    ok("[pop-up] generate_lead con form_location popup", gl.length === 1 && gl[0].form_location === "popup" && gl[0].encaja === "no");
    await context.close();
  }

  /* 6b. Con TELEFONO_ASISTENTE: número y descarga .vcf */
  {
    const { context, page } = await nuevaPagina(browser, {
      viewport: { width: 1440, height: 900 },
      route: (p) => p.route("**/index.html", async (route) => {
        const resp = await route.fetch();
        const body = (await resp.text()).replace('const TELEFONO_ASISTENTE = "";', 'const TELEFONO_ASISTENTE = "+34 600 000 000";');
        await route.fulfill({ response: resp, body });
      }),
    });
    await page.goto(BASE + "index.html", { waitUntil: "networkidle" });
    await page.click('#cookies [data-cookies="rechazar"]');
    const S = '[data-form-host="inline"]';
    await page.locator(S).scrollIntoViewIfNeeded();
    await rellenarPaso1(page, S);
    await page.click(`${S} [data-continuar]`);
    await rellenarPaso2(page, S);
    await page.click(`${S} [data-enviar]`);
    await page.waitForTimeout(400);
    const t = await page.evaluate(() => document.querySelector('[data-form-host="inline"] [data-gracias] p').textContent);
    ok("con número: texto «desde el +34 600 000 000»", t.includes("de Freedoo desde el +34 600 000 000. Te hará"), t);
    const [descarga] = await Promise.all([page.waitForEvent("download"), page.click(`${S} [data-guardar-contacto]`)]);
    const contenido = fs.readFileSync(await descarga.path(), "utf8");
    ok("botón «Guardar el número en mis contactos» descarga un .vcf", descarga.suggestedFilename().endsWith(".vcf") && contenido.includes("FN:Freedoo — Asistente") && contenido.includes("TEL;TYPE=CELL:+34600000000"), contenido.replace(/\r\n/g, " / "));
    await page.locator(S).screenshot({ path: path.join(OUT, "gracias-con-numero.png") });
    await context.close();
  }

  /* 8-10. Cookies: botones iguales, panel, consentimiento, GTM solo con consentimiento, caducidad, todas las páginas */
  for (const w of [360, 1440]) {
    const { context, page } = await nuevaPagina(browser, { viewport: { width: w, height: 800 } });
    await page.goto(BASE + "index.html", { waitUntil: "networkidle" });
    const cajas = await page.evaluate(() => [...document.querySelectorAll('#cookies [data-cookies-vista="resumen"] .cookies__btn')].map((b) => { const r = b.getBoundingClientRect(); const cs = getComputedStyle(b); return { t: b.textContent, w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, fw: cs.fontWeight, fs: cs.fontSize }; }));
    const iguales = cajas.length === 3 && cajas.every((c) => c.w === cajas[0].w && c.h === cajas[0].h && c.bg === cajas[0].bg && c.fw === cajas[0].fw && c.fs === cajas[0].fs);
    ok(`[${w}px] «Aceptar», «Rechazar» y «Configurar» con el mismo tamaño y peso`, iguales, JSON.stringify(cajas));
    const zs = await page.evaluate(() => ({ cookies: +getComputedStyle(document.getElementById("cookies")).zIndex, sticky: +getComputedStyle(document.querySelector(".sticky")).zIndex, modal: +getComputedStyle(document.getElementById("modal-form")).zIndex }));
    ok(`[${w}px] el banner queda por encima del sticky`, zs.cookies > zs.sticky && zs.cookies > zs.modal, JSON.stringify(zs));
    await page.screenshot({ path: path.join(OUT, `banner-cookies-${w}.png`) });
    await page.click('#cookies [data-cookies-vista="resumen"] [data-cookies="configurar"]');
    await page.screenshot({ path: path.join(OUT, `panel-cookies-${w}.png`) });
    const tecnicas = await page.evaluate(() => { const i = document.querySelector('#cookies .categoria input[disabled]'); return i.checked && i.disabled; });
    ok(`[${w}px] técnicas siempre activas y no desactivables`, tecnicas);
    await context.close();
  }
  {
    // GTM con un ID de prueba: ninguna petición antes del consentimiento ni tras rechazar; sí tras aceptar
    const conId = (p) => p.route(/\/(index|aviso-legal|politica-privacidad|politica-cookies)\.html/, async (route) => {
      const resp = await route.fetch();
      await route.fulfill({ response: resp, body: (await resp.text()).replace('const GTM_ID = "GTM-XXXXXXX";', 'const GTM_ID = "GTM-TEST123";') });
    }).then(() => p.route(/googletagmanager\.com/, (r) => r.abort()));
    let s = await nuevaPagina(browser, { route: conId });
    await s.page.goto(BASE + "index.html", { waitUntil: "networkidle" });
    await s.page.waitForTimeout(800);
    ok("[GTM real] sin consentimiento: 0 peticiones a terceros", s.peticionesTerceros.length === 0, s.peticionesTerceros.join(", "));
    const def = await dl(s.page);
    ok("consent default denegado antes que nada", Array.isArray(def[0]) && def[0][0] === "consent" && def[0][1] === "default" && def[0][2].ad_storage === "denied" && def[0][2].analytics_storage === "denied" && def[0][2].ad_user_data === "denied" && def[0][2].ad_personalization === "denied" && def[0][2].wait_for_update === 500, JSON.stringify(def[0]));
    await s.page.click('#cookies [data-cookies="rechazar"]');
    await s.page.waitForTimeout(800);
    ok("[GTM real] tras «Rechazar todas»: 0 peticiones a terceros", s.peticionesTerceros.length === 0);
    const cu = await eventos(s.page, "consent_update");
    ok("consent_update con los 4 estados denegados", cu.length === 1 && ["analytics_storage", "ad_storage", "ad_user_data", "ad_personalization"].every((k) => cu[0][k] === "denied"), JSON.stringify(cu[0]));
    const guardado = await s.page.evaluate(() => JSON.parse(localStorage.getItem("freedoo_consent")));
    ok("elección guardada en localStorage (freedoo_consent con fecha)", guardado && guardado.analytics === false && guardado.ads === false && !isNaN(Date.parse(guardado.fecha)));
    await s.page.reload({ waitUntil: "networkidle" });
    ok("tras recargar no vuelve a salir el banner", await s.page.evaluate(() => document.getElementById("cookies").hidden));
    // Configurar cookies desde el pie: solo analíticas
    await s.page.click("[data-abrir-cookies]");
    ok("«Configurar cookies» del pie reabre el panel", await s.page.evaluate(() => !document.getElementById("cookies").hidden && !document.querySelector('[data-cookies-vista="panel"]').hidden));
    await s.page.check("#consent-analytics");
    await s.page.click('#cookies [data-cookies-vista="panel"] [data-cookies="guardar"]');
    await s.page.waitForTimeout(800);
    ok("[GTM real] con analíticas aceptadas se carga GTM", s.peticionesTerceros.some((u) => u.includes("googletagmanager.com/gtm.js?id=GTM-TEST123")), s.peticionesTerceros.join(", "));
    const cu2 = (await eventos(s.page, "consent_update")).pop();
    ok("consent_update parcial: analytics granted, ads denied", cu2.analytics_storage === "granted" && cu2.ad_storage === "denied" && cu2.ad_user_data === "denied" && cu2.ad_personalization === "denied", JSON.stringify(cu2));
    await s.context.close();

    s = await nuevaPagina(browser, { route: conId });
    await s.page.goto(BASE + "politica-cookies.html", { waitUntil: "networkidle" });
    await s.page.click('#cookies [data-cookies="aceptar"]');
    await s.page.waitForTimeout(800);
    ok("[GTM real] «Aceptar todas» en una página legal carga GTM", s.peticionesTerceros.some((u) => u.includes("GTM-TEST123")));
    // Caducidad a los 12 meses
    await s.page.evaluate(() => { const f = new Date(); f.setMonth(f.getMonth() - 13); localStorage.setItem("freedoo_consent", JSON.stringify({ version: 1, fecha: f.toISOString(), analytics: true, ads: true })); });
    s.peticionesTerceros.length = 0;
    await s.page.goto(BASE + "index.html", { waitUntil: "networkidle" });
    await s.page.waitForTimeout(600);
    ok("consentimiento de hace 13 meses: vuelve a preguntar y no carga nada", await s.page.evaluate(() => !document.getElementById("cookies").hidden) && s.peticionesTerceros.length === 0, s.peticionesTerceros.join(", "));
    await s.context.close();
  }
  {
    // Enlaces legales y «Configurar cookies» desde todas las páginas
    const { context, page, errores } = await nuevaPagina(browser, { viewport: { width: 390, height: 800 } });
    for (const origen of ["index.html", "aviso-legal.html", "politica-privacidad.html", "politica-cookies.html"]) {
      await page.goto(BASE + origen, { waitUntil: "networkidle" });
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const accesible = await page.evaluate(() => {
        const b = document.getElementById("cookies").getBoundingClientRect();
        const enl = document.querySelector(".pie__enlaces").getBoundingClientRect();
        return { bannerVisible: !document.getElementById("cookies").hidden, bannerTop: Math.round(b.top), enlacesBottom: Math.round(enl.bottom) };
      });
      ok(`[390px] con el banner abierto, los enlaces del pie de ${origen} quedan por encima`, accesible.bannerVisible && accesible.enlacesBottom <= accesible.bannerTop, JSON.stringify(accesible));
      if (origen === "index.html") await page.screenshot({ path: path.join(OUT, "movil-final-con-banner.png") });
      for (const destino of ["aviso-legal.html", "politica-privacidad.html", "politica-cookies.html"]) {
        await page.goto(BASE + origen, { waitUntil: "networkidle" });
        const resp = await Promise.all([page.waitForNavigation(), page.click(`.pie a[href="${destino}"]`)]);
        ok(`enlace ${origen} → ${destino}`, page.url().endsWith(destino) && (await page.evaluate(() => document.querySelector("h1").textContent.length > 0)));
      }
      await page.goto(BASE + origen, { waitUntil: "networkidle" });
      await page.click('#cookies [data-cookies="rechazar"]').catch(() => {});
      await page.click("[data-abrir-cookies]");
      ok(`«Configurar cookies» funciona en ${origen}`, await page.evaluate(() => !document.querySelector('#cookies [data-cookies-vista="panel"]').hidden && !document.getElementById("cookies").hidden));
      const anio = await page.evaluate(() => document.querySelector("[data-anio]").textContent);
      ok(`año del pie calculado en ${origen}`, anio === String(new Date().getFullYear()), anio);
      await page.evaluate(() => localStorage.clear());
    }
    await page.goto(BASE + "politica-privacidad.html", { waitUntil: "networkidle" });
    const logo = await Promise.all([page.waitForNavigation(), page.click(".cabecera-legal a")]);
    ok("el logo de las páginas legales enlaza a index.html", page.url().endsWith("index.html"));
    ok("sin errores de consola navegando por todas las páginas", errores.length === 0, errores.join(" | "));
    await context.close();
  }

  await browser.close();

  /* Bloques COMPARTIDO idénticos en los 4 HTML; sin el email erróneo */
  const extraer = (txt) => {
    const re = /(<!--|\/\*) ===== COMPARTIDO: ([^=]+?) ===== (-->|\*\/)([\s\S]*?)(<!--|\/\*) ===== FIN COMPARTIDO/g;
    const out = {}; let m;
    while ((m = re.exec(txt))) out[m[2].trim()] = m[4];
    return out;
  };
  const archivos = ["index.html", "aviso-legal.html", "politica-privacidad.html", "politica-cookies.html"];
  const bloques = archivos.map((f) => extraer(fs.readFileSync(path.join(RAIZ, f), "utf8")));
  const nombres = Object.keys(bloques[0]);
  ok("index.html tiene los 5 bloques compartidos", nombres.length === 5, nombres.join(" | "));
  for (const n of nombres) ok(`bloque compartido «${n}» idéntico en los 4 archivos`, bloques.every((b) => b[n] === bloques[0][n]));
  const todos = fs.readdirSync(RAIZ).filter((f) => /\.(html|md)$/.test(f)).map((f) => fs.readFileSync(path.join(RAIZ, f), "utf8")).join("\n");
  ok("no aparece el email erróneo con tres «e» en ningún archivo", !todos.includes("info@free" + "eedoo.es"));

  const fallos = resultados.filter((r) => !r.ok);
  console.log(`\nRESUMEN: ${resultados.length - fallos.length}/${resultados.length} pruebas superadas`);
  if (fallos.length) { console.log("FALLOS:"); fallos.forEach((f) => console.log(" - " + f.nombre + " — " + f.detalle)); }
  fs.writeFileSync(path.join(OUT, "resultados.json"), JSON.stringify(resultados, null, 2));
  process.exit(fallos.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
