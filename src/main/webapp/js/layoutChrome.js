// js/layoutChrome.js
// Versión unificada y neutra para apps IMCD (Travel, Purchase, Budget, Presence)

(function () {

  // 🔒 Evitar cargar layout en login.html
  const _path = window.location.pathname.toLowerCase();
  if (_path.endsWith("/login") || _path.endsWith("/login.html")) {
    console.log("⛔ layoutChrome: skip en login");
    return;
  }

  // ------------------------------
  // Utilidades de <head>
  // ------------------------------
  function addHead(el) { document.head.appendChild(el); }

  function addHeadLink(attrs) {
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

  function joinUrl(base, suffix) {
    const cleanBase = (base || '').replace(/\s+$/, '').replace(/\/+$/, '');
    const cleanSuffix = (suffix || '').replace(/^\/+/, '');
    return cleanSuffix ? `${cleanBase}/${cleanSuffix}` : cleanBase;
  }

  // 🔧 AJUSTE 1: resolver base de la app de forma neutra
  function resolveAppBase(raw) {
    if (raw) {
      return ('' + raw).replace(/\s+$/, '').replace(/\/+$/, '');
    }

    if (window.APP_URL) {
      return ('' + window.APP_URL).replace(/\s+$/, '').replace(/\/+$/, '');
    }

    // Fallback: deducir contexto desde la URL
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      return '/' + parts[0];
    }

    return '';
  }

  function normaliseExistingLinks() {
    if (!(window.location && window.location.protocol === 'https:')) return;

    const linkSelectors = [
      'link[rel="icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="manifest"]'
    ];

    linkSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        try {
          const url = new URL(href, window.location.href);
          if (url.protocol === 'http:' && url.hostname === window.location.hostname) {
            url.protocol = 'https:';
            link.setAttribute('href', url.toString());
          }
        } catch (e) {}
      });
    });
  }

  function ensureFavicons(appBase) {
    normaliseExistingLinks();
    const faviconsBase = joinUrl(resolveAppBase(appBase), 'imgs');
    const v = 'v=7';

    document.querySelectorAll('link[rel="icon"]').forEach(l => {
      if (!l.getAttribute('href')) l.remove();
    });

    addHeadLink({ rel: 'icon', href: `${faviconsBase}/favicon-32x32.png?${v}`, type: 'image/png', sizes: '32x32' });
    addHeadLink({ rel: 'icon', href: `${faviconsBase}/favicon-16x16.png?${v}`, type: 'image/png', sizes: '16x16' });
    addHeadLink({ rel: 'icon', href: `${faviconsBase}/favicon.svg?${v}`, type: 'image/svg+xml' });
    addHeadLink({ rel: 'icon', href: `${faviconsBase}/favicon.ico?${v}`, sizes: 'any' });

    addHeadLink({ rel: 'apple-touch-icon', href: `${faviconsBase}/apple-touch-icon.png?${v}` });
    addHeadLink({ rel: 'manifest', href: `${faviconsBase}/site.webmanifest?${v}` });

    if (!document.head.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#294586';
      document.head.appendChild(meta);
    }
  }

  window.__ensureFavicons = ensureFavicons;

  // ---------------------------------------------------
  // Cargador de fragmentos
  // ---------------------------------------------------
  async function injectHtml(url, targetSelector) {
    if (!targetSelector) return;
    const target = document.querySelector(targetSelector);
    if (!target) return;

    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      target.innerHTML = await res.text();
    } catch (err) {
      console.error(`[MosaicChrome] Error cargando ${url}`, err);
    }
  }

  // ---------------------------------------------------
  // Sticky footer
  // ---------------------------------------------------
  function enableStickyFooter({ footerSel, contentSel } = {}) {
    const footer = document.querySelector(footerSel);
    const content = document.querySelector(contentSel);
    if (!footer || !content) return;

    function relayout() {
      const vh = window.innerHeight || document.documentElement.clientHeight || 0;
      const footerH = footer.getBoundingClientRect().height || 0;
      const headerH = content.previousElementSibling?.getBoundingClientRect().height || 0;
      content.style.minHeight = Math.max(0, vh - footerH - headerH) + 'px';
    }

    relayout();
    window.addEventListener('load', relayout);
    window.addEventListener('resize', relayout);

    const ro = new ResizeObserver(relayout);
    ro.observe(footer);
  }

function resolvePantallaDelegation() {
    const fromBody = document.body?.dataset?.pantalla;
    if (fromBody) return fromBody;

    return 'index';
}




function initDelegationHeaderAfterLoad() {

  if (typeof loadDropDown !== 'function') {
    console.warn('[DELEGATION] loadDropDown no disponible');
    return;
  }

  const select = document.getElementById('select-delegation');
  if (!select) {
    console.warn('[DELEGATION] select-delegation no encontrado');
    return;
  }

  const usuarioActivo = JSON.parse(localStorage.getItem(APP_NAME + "usuario"));
  const usuarioOriginal = JSON.parse(localStorage.getItem(APP_NAME + "usuarioOriginal"));

  if (!usuarioActivo) {
    console.warn('[DELEGATION] usuarioActivo no disponible');
    return;
  }

  const currentUserEl = document.getElementById('currentUser');
  if (currentUserEl) {
    currentUserEl.textContent = usuarioActivo.UbT_LocalADUuser || '';
  }

  if (usuarioOriginal &&
      usuarioOriginal.UbT_LocalADUuser !== usuarioActivo.UbT_LocalADUuser) {

    document.getElementById('select-delegation')?.style.setProperty('display', 'none');
    document.getElementById('divLabelDelegation')?.style.setProperty('display', 'none');
    document.getElementById('buttonChangeDelegation')?.style.setProperty('display', 'none');
    document.getElementById('rollBackOriginal')?.style.setProperty('display', 'inline-block');

  } else {
    document.getElementById('rollBackOriginal')?.style.setProperty('display', 'none');
  }

const pantallaDelegation = resolvePantallaDelegation();

loadDropDown(
  $('#select-delegation'),
  "delegation/usersList"
    + "?userActive=" + encodeURIComponent(usuarioActivo.UbT_LocalADUuser)
    + "&pantalla=" + pantallaDelegation
    + "&BU_AGRUPADA=" + encodeURIComponent(usuarioActivo.bu_agrupada || ''),
  "localAdUser",
  "localAdUser"
);



  console.log('[DELEGATION] Combo de delegación inicializado');
}

  // ---------------------------------------------------
  // API pública
  // ---------------------------------------------------
  const MosaicChrome = {
    async loadChrome(opts = {}) {
      const chromeBase = resolveAppBase(opts.appUrl);

      ensureFavicons(opts.appUrl);

      const headerUrl  = opts.headerUrl  || `${chromeBase}/components/header.html`;
      const sidebarUrl = opts.sidebarUrl || `${chromeBase}/components/menu.html`;
      const footerUrl  = opts.footerUrl  || `${chromeBase}/components/footer.html`;

      const tasks = [];
      if (opts.headerSel)  tasks.push(injectHtml(headerUrl,  opts.headerSel));
      if (opts.sidebarSel) tasks.push(injectHtml(sidebarUrl, opts.sidebarSel));
      if (opts.footerSel)  tasks.push(injectHtml(footerUrl,  opts.footerSel));

      await Promise.all(tasks);

      // 🔧 AJUSTE 2: señal explícita de layout listo
      window.__layoutChromeReady = true;

        /* 🔴 INICIALIZAR DELEGACIÓN CUANDO EL HEADER YA EXISTE */
        try {
          initDelegationHeaderAfterLoad();
        } catch (e) {
          console.error('[DELEGATION] Error inicializando delegación', e);
        }

      if (typeof opts.onReady === 'function') {
        try { opts.onReady(); } catch (e) {
          console.error('[MosaicChrome] onReady error', e);
        }
      }
    },

    enableStickyFooter
  };

  if (!window.MosaicChrome) {
    window.MosaicChrome = MosaicChrome;
  } else {
    window.MosaicChrome.enableStickyFooter = enableStickyFooter;
  }

  ensureFavicons();
  console.log("✅ layoutChrome inicializado correctamente");

})();

// 🔧 AJUSTE 3: código Travel-only aislado
(function () {
  if (!window.location.pathname.startsWith('/travel')) return;

  window.previewEmail = async function (type, idTravel) {
    const url = `/travel/email/preview?type=${type}&idTravel=${idTravel}`;
    const res = await fetch(url, { method: "POST" });
    return res.json();
  };
})();
