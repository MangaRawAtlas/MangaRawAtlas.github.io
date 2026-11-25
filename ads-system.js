/* MangaAtlas Ads System — isolated banner slots + single-load social-bar scripts. */
(function () {
  'use strict';
  if (window.__mangaAtlasAdsSystemLoaded) return;
  window.__mangaAtlasAdsSystemLoaded = true;
  if (location.pathname.indexOf('/admin') === 0) return;

  var socialLoaded = Object.create(null);
  var cfgUrl = '/data/ads-config.json?v=' + Date.now();

  function loadSocialScripts(code) {
    var doc = new DOMParser().parseFromString(String(code || ''), 'text/html');
    Array.prototype.forEach.call(doc.querySelectorAll('script[src]'), function (old) {
      var src = old.getAttribute('src');
      if (!src || socialLoaded[src]) return;
      socialLoaded[src] = true;
      var script = document.createElement('script');
      Array.prototype.slice.call(old.attributes).forEach(function (a) {
        script.setAttribute(a.name, a.value);
      });
      script.async = true;
      (document.body || document.head).appendChild(script);
    });
  }

  function makeBannerSlot(section) {
    var box = document.createElement('div');
    box.className = 'manga-atlas-ad-slot';
    box.dataset.maAdSection = String(section.id);
    box.style.cssText = 'width:100%;min-height:90px;margin:20px auto;padding:8px 0;display:flex;justify-content:center;align-items:center;clear:both;overflow:visible;position:relative;z-index:1;';
    var frame = document.createElement('iframe');
    frame.title = 'Advertisement';
    frame.loading = 'lazy';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.style.cssText = 'display:block;width:100%;max-width:100%;height:320px;border:0;overflow:hidden;background:transparent;';
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
    var safeCode = String(section.code || '').replace(/<\\/script/gi, '<\\\\/script');
    frame.srcdoc = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;width:100%;min-height:90px;overflow:hidden;background:transparent}body{display:flex;justify-content:center;align-items:flex-start}</style></head><body>' + safeCode + '</body></html>';
    box.appendChild(frame);
    return box;
  }

  function root() {
    return document.querySelector('.reader') || document.querySelector('.pages') || document.querySelector('main') || document.querySelector('article') || document.body;
  }

  function placeBanner(section) {
    var id = String(section.id || '');
    if (!id || document.querySelector('[data-ma-ad-section="' + CSS.escape(id) + '"]')) return;
    var r = root();
    if (!r) return;
    var p = String(section.placement || 'start').toLowerCase();
    var box = makeBannerSlot(section);

    if (p === 'between') {
      var pages = document.querySelector('.pages') || document.querySelector('.reader');
      var imgs = pages ? Array.prototype.slice.call(pages.querySelectorAll('img.page')) : [];
      var n = parseInt(section.afterImage != null ? section.afterImage : section.between, 10);
      if (!Number.isFinite(n) || n < 1) n = 1;
      if (imgs.length) {
        imgs[Math.min(n, imgs.length) - 1].parentNode.insertBefore(box, imgs[Math.min(n, imgs.length) - 1].nextSibling);
        return;
      }
      var list = document.querySelector('.home-list');
      var links = list ? Array.prototype.slice.call(list.querySelectorAll(':scope > a')) : [];
      if (links.length) links[Math.min(n, links.length) - 1].parentNode.insertBefore(box, links[Math.min(n, links.length) - 1].nextSibling);
      return;
    }

    var reader = document.querySelector('.reader');
    if (reader && r === reader) {
      if (p === 'end') {
        var related = reader.querySelector('.related');
        if (related) reader.insertBefore(box, related);
        else reader.appendChild(box);
      } else {
        var copy = reader.querySelector('.chapter-copy');
        if (copy && copy.nextSibling) reader.insertBefore(box, copy.nextSibling);
        else if (copy) reader.appendChild(box);
        else reader.insertBefore(box, reader.firstChild);
      }
    } else if (p === 'end') {
      if (r.parentNode) r.parentNode.insertBefore(box, r.nextSibling);
      else r.appendChild(box);
    } else {
      if (r.parentNode) r.parentNode.insertBefore(box, r);
      else r.insertBefore(box, r.firstChild);
    }
  }

  function install(sections) {
    sections.forEach(function (section) {
      try {
        var code = String(section.code || '');
        var scripts = Array.prototype.slice.call(new DOMParser().parseFromString(code, 'text/html').querySelectorAll('script[src]'));
        var socialOnly = scripts.length > 0 && scripts.every(function (s) { return /\\/14\\//.test(s.getAttribute('src') || ''); });
        if (socialOnly) {
          loadSocialScripts(code);
          return; // Social-bar scripts are global overlays, not inline banner slots.
        }
        placeBanner(section);
      } catch (e) {
        console.warn('[Ads] placement failed: ' + section.id, e);
      }
    });
  }

  fetch(cfgUrl, { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    })
    .then(function (cfg) {
      var sections = Array.isArray(cfg && cfg.sections) ? cfg.sections.filter(function (s) {
        return s && s.enabled && String(s.code || '').trim();
      }) : [];
      function run() { install(sections); }
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
      else run();
      var observer = new MutationObserver(run);
      observer.observe(document.body, { childList: true, subtree: true });
      var tries = 0;
      var timer = setInterval(function () {
        run();
        if (++tries >= 50) clearInterval(timer);
      }, 300);
    })
    .catch(function (error) { console.error('[Ads] config load failed', error); });
})();