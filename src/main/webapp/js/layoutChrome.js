// js/layoutChrome.js
// Versión unificada: define window.MosaicChrome y garantiza favicons/manifest.
// Funciona incluso si ya incluyes <link rel="icon"...> en el HTML: no duplica.

(function(){


  // 🔒 Evitar cargar layout en login.html
  const _path = window.location.pathname.toLowerCase();
  if (_path.endsWith("/login") || _path.endsWith("/login.html")) {
    console.log("⛔ layoutChrome: skip en login");
    return; // ⛔ Detiene completamente el layout en la página de login
  }

  // ------------------------------
  // Utilidades de <head>
  // ------------------------------
  function addHead(el){ document.head.appendChild(el); }
  function addHeadLink(attrs){
    const sel = 'link'
      + (attrs.rel ? `[rel="${attrs.rel}"]` : '')
      + (attrs.sizes ? `[sizes="${attrs.sizes}"]` : '')
      + (attrs.type ? `[type="${attrs.type}"]` : '')
      + (attrs.href ? `[href="${attrs.href}"]` : '');
    if (document.head.querySelector(sel)) return;
    const link = document.createElement('link');
    Object.keys(attrs).forEach(k => link.setAttribute(k, attrs[k]));
    addHead(link);
  }

  function joinUrl(base, suffix){
    const cleanBase = (base || '').replace(/\s+$/, '').replace(/\/+$/, '');
    const cleanSuffix = (suffix || '').replace(/^\/+/, '');
    return cleanSuffix ? `${cleanBase}/${cleanSuffix}` : cleanBase;
  }

  function resolveAppBase(raw){
   const source = (raw != null ? raw : window.APP_URL) || '/purchase';
       let base = ('' + source).replace(/\s+$/, '').replace(/\/+$/, '');

       if (typeof window !== 'undefined'
         && window.location
         && window.location.protocol === 'https:'
         && /^http:\/\//i.test(base)){
         base = 'https://' + base.slice('http://'.length);
       }
    return base;
  }

  function normaliseExistingLinks() {
    if (!(window.location && window.location.protocol === 'https:')) {
      return;
    }
    const linkSelectors = [
      'link[rel="icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="manifest"]'
    ];
    linkSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        const trimmed = ('' + href).trim();
        if (!trimmed) return;
        if (!/^https?:/i.test(trimmed)) return;

        try {
          const url = new URL(trimmed, window.location.href);
          if (url.protocol === 'http:' && url.hostname === window.location.hostname) {
            url.protocol = 'https:';
            link.setAttribute('href', url.toString());
          }
        } catch (err) {
          // Ignora URLs no válidas
        }
      });
    });
  }


  function ensureFavicons(appBase){
    normaliseExistingLinks();
    const faviconsBase = joinUrl(resolveAppBase(appBase), 'imgs');
    const v = 'v=7'; // cache-busting

    // Quita enlaces ambiguos/previos sin href
    document.querySelectorAll('link[rel="icon"]').forEach(l => {
      if (!l.getAttribute('href')) l.remove();
    });

    // 1) Prioriza PNG
    addHeadLink({ rel:'icon', href: `${faviconsBase}/favicon-32x32.png?${v}`, type:'image/png', sizes:'32x32' });
    addHeadLink({ rel:'icon', href: `${faviconsBase}/favicon-16x16.png?${v}`, type:'image/png', sizes:'16x16' });

    // 2) Luego SVG (si lo mantienes) y por ultimo ICO
    addHeadLink({ rel:'icon', href: `${faviconsBase}/favicon.svg?${v}`, type:'image/svg+xml' });
    addHeadLink({ rel:'icon', href: `${faviconsBase}/favicon.ico?${v}`, sizes:'any' });

    // iOS / manifest / theme-color (también versionados)
    addHeadLink({ rel:'apple-touch-icon', href: `${faviconsBase}/apple-touch-icon.png?${v}` });
    addHeadLink({ rel:'manifest', href: `${faviconsBase}/site.webmanifest?${v}` });

    if (!document.head.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#294586';
      document.head.appendChild(meta);
    }
  }

if (typeof ensureFavicons === "function") {
  ensureFavicons();
  // Forzar refresco visual de favicon
  const link = document.querySelector('link[rel="icon"]');
  if (link) {
    const href = link.href.split("?")[0];
    link.href = href + "?v=" + new Date().getTime(); // rompe cache
  }
  console.log("✅ Favicons aplicados y refrescados visualmente");
}


  // Exponer también por compatibilidad con lo que ya tenías
  window.__ensureFavicons = ensureFavicons;

  // ---------------------------------------------------
  // Cargador de fragmentos (header/sidebar/footer)
  // ---------------------------------------------------
  async function injectHtml(url, targetSelector){
    if (!targetSelector) return;
    const target = document.querySelector(targetSelector);
    if (!target) return;
    try{
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      target.innerHTML = html;
    }catch(err){
      console.error(`[MosaicChrome] Error al cargar "${url}":`, err);
    }
  }

  // ---------------------------------------------------
  // Sticky footer: asegura que el contenido empuje al pie
  // ---------------------------------------------------
  function enableStickyFooter({ footerSel, contentSel } = {}){
    const footer = footerSel ? document.querySelector(footerSel) : null;
    const content = contentSel ? document.querySelector(contentSel) : null;
    if (!footer || !content) return;

    function relayout(){
      // Viewport real
      const vh = window.innerHeight || document.documentElement.clientHeight || 0;
      const footerH = footer.getBoundingClientRect().height || 0;

      // Si hay header fijo por encima del content, cuéntalo
      // (buscamos el hermano previo con altura visible)
      let headerH = 0;
      const prev = content.previousElementSibling;
      if (prev){
        const r = prev.getBoundingClientRect();
        headerH = Math.max(0, r.height || 0);
      }

      // El content debe ocupar al menos el alto de la ventana menos header y footer
      const min = Math.max(0, vh - footerH - headerH);
      content.style.minHeight = `${min}px`;
    }

    // Ajustes iniciales y en cambios de tamaño/contenido
    // Ajustes iniciales y en cambios de tamaño/contenido
    relayout();
    window.addEventListener('load', relayout);
    window.addEventListener('resize', relayout);
    // Mutations (por si el footer cambia de alto)
    const ro = new ResizeObserver(relayout);
    ro.observe(footer);
  }

  // ---------------------------------------------------
  // API pública
  // ---------------------------------------------------
  const MosaicChrome = {
    /**
     * Carga header, sidebar y footer. Opciones:
     * {
     *   appUrl, headerSel, sidebarSel, footerSel,
     *   headerUrl, sidebarUrl, footerUrl,
     *   onReady: fn
     * }
     */
    async loadChrome(opts = {}){
      const chromeBase = resolveAppBase(opts.appUrl);
      // Favicons/manifest garantizados
      ensureFavicons(opts.appUrl);

      const headerFragmentUrl  = opts.headerUrl  || `${chromeBase}/components/header.html`;
      const sidebarFragmentUrl = opts.sidebarUrl || `${chromeBase}/components/menu.html`;
      const footerFragmentUrl  = opts.footerUrl  || `${chromeBase}/components/footer.html`;

      const tasks = [];
      if (opts.headerSel)  tasks.push(injectHtml(headerFragmentUrl,  opts.headerSel));
      if (opts.sidebarSel) tasks.push(injectHtml(sidebarFragmentUrl, opts.sidebarSel));
      if (opts.footerSel)  tasks.push(injectHtml(footerFragmentUrl,  opts.footerSel));

      await Promise.all(tasks).catch(()=>{ /* errores ya se loguean en injectHtml */ });

      try{
        if (typeof opts.onReady === 'function') {
          opts.onReady();
        }
      }catch(e){
        console.error('[MosaicChrome] onReady lanzó una excepción:', e);
      }
    },

    enableStickyFooter
  };

  // Evita sobreescribir si ya existía por otra lib
  if (!window.MosaicChrome){
    window.MosaicChrome = MosaicChrome;
  } else {
    // Aun asi, añade/actualiza estas utilidades
    window.MosaicChrome.enableStickyFooter = enableStickyFooter;
  }

  // Garantiza favicons siempre, incluso en primera carga
  if (typeof ensureFavicons === "function") {
    ensureFavicons();
    console.log("✅ Favicons aplicados por layoutChrome.js (forzado en primera carga)");
  }
})();


window.previewEmail = async function(type, idTravel) {
    const url = `/travel/email/preview?type=${type}&idTravel=${idTravel}`;

    const res = await fetch(url, { method: "POST" });
    const json = await res.json();

    console.log("===== EMAIL PREVIEW =====");
    console.log("TO:", json.to);
    console.log("CC:", json.cc);
    console.log("BCC:", json.bcc);
    console.log("SUBJECT:", json.subject);
    console.log("-----------------------------------");
    console.log(json.body);
    console.log("===================================");

    return json; // por si quieres seguir trabajándolo
};
