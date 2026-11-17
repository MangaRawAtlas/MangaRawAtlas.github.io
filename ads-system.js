/* MangaAtlas Ads System v6 — responsive placements, 3 ads per 2 chapter images, no total placement cap. */
(function () {
  'use strict';
  if (window.__mangaAtlasAdsSystemLoaded) return;
  window.__mangaAtlasAdsSystemLoaded = true;
  if (/(^|\/)admin(?:\/|$)/i.test(location.pathname)) return;
  var scriptUrl = document.currentScript && document.currentScript.src;
  var configUrl = scriptUrl ? new URL('data/ads-config.json', scriptUrl).href : new URL('data/ads-config.json', document.baseURI).href;
  fetch(configUrl + (configUrl.indexOf('?') < 0 ? '?' : '&') + 'v=' + Date.now(), {cache:'no-store'})
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(start).catch(function (e) { console.warn('MangaAtlas ads config unavailable', e); });

  function start(cfg) {
    var sections = Array.isArray(cfg.sections) ? cfg.sections.filter(function (s) { return s && s.enabled && String(s.code || '').trim(); }) : [];
    if (!sections.length) return;
    var activationQueue = [], pumping = false, providerQueue = Promise.resolve();
    function root() { return document.querySelector('.reader') || document.querySelector('.pages') || document.querySelector('main') || document.querySelector('article') || document.body; }
    function exists(id) { return !!document.querySelector('[data-ma-ad-section="' + String(id).replace(/"/g, '\\"') + '"]'); }
    function makeSlot(section) {
      var box = document.createElement('div');
      box.className = 'manga-atlas-ad-slot';
      box.dataset.maAdSection = section.id;
      box.style.cssText = 'box-sizing:border-box;width:100%;max-width:100%;min-height:90px;margin:18px auto;padding:8px 0;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:12px;clear:both;overflow:visible;position:relative;z-index:1;';
      var content = document.createElement('div');
      content.style.cssText = 'width:100%;max-width:100%;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;overflow:visible;';
      content.innerHTML = String(section.code || '');
      box.appendChild(content);
      return box;
    }
    function appendScript(oldScript, parent) {
      var s = document.createElement('script');
      Array.prototype.slice.call(oldScript.attributes).forEach(function (a) { if (a.name.toLowerCase() !== 'src') s.setAttribute(a.name,a.value); });
      if (oldScript.src) s.src = oldScript.src; else s.text = oldScript.textContent || '';
      parent.appendChild(s);
      return s;
    }
    function activate(box) {
      var list = Array.prototype.slice.call(box.querySelectorAll('script'));
      function next(i) {
        if (i >= list.length) return;
        var old = list[i], parent = old.parentNode, src = old.getAttribute('src') || '';
        var isOptions = !src && /\batOptions\s*=/.test(old.textContent || '');
        var following = list[i+1], followingSrc = following && (following.getAttribute('src') || '');
        // Isolate each atOptions banner: this prevents shared globals and
        // lets provider scripts use document.write inside their own document.
        if (isOptions && /bauval\.org\/22\//i.test(followingSrc)) {
          var code = old.textContent || '';
          var widthMatch = code.match(/\bwidth\s*:\s*(\d+)/i);
          var heightMatch = code.match(/\bheight\s*:\s*(\d+)/i);
          var width = widthMatch ? parseInt(widthMatch[1],10) : 728;
          var height = heightMatch ? parseInt(heightMatch[1],10) : 90;
          var frame = document.createElement('iframe');
          frame.title = 'Advertisement';
          frame.width = String(width);
          frame.height = String(height);
          frame.setAttribute('scrolling','no');
          frame.setAttribute('frameborder','0');
          frame.style.cssText = 'display:block;border:0;width:'+width+'px;max-width:100%;height:'+height+'px;margin:0 auto;background:transparent;';
          frame.srcdoc = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;overflow:hidden;"><script>'+code+'<\/script><script src="'+followingSrc.replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'"><\/script></body></html>';
          parent.insertBefore(frame,old);
          if (old.parentNode) old.parentNode.removeChild(old);
          if (following && following.parentNode) following.parentNode.removeChild(following);
          next(i+2);
          return;
        }
        // Native /14 scripts may use document.write. Run each in its own
        // iframe so it cannot overwrite the page or collide with other ad slots.
        if (!isOptions && /bauval\.org\/14\//i.test(src)) {
          var nativeFrame = document.createElement('iframe');
          nativeFrame.title = 'Advertisement';
          nativeFrame.setAttribute('scrolling','no');
          nativeFrame.setAttribute('frameborder','0');
          nativeFrame.style.cssText = 'display:block;width:100%;max-width:100%;height:280px;border:0;margin:0 auto;background:transparent;';
          nativeFrame.srcdoc = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;min-height:250px;overflow:hidden;"><script src="'+src.replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'"><\/script></body></html>';
          parent.insertBefore(nativeFrame,old);
          if (old.parentNode) old.parentNode.removeChild(old);
          next(i+1);
          return;
        }
        appendScript(old,parent);
        if (old.parentNode) old.parentNode.removeChild(old);
        next(i+1);
      }
      next(0);
    }
    function queue(box) { activationQueue.push(box); pump(); }
    function pump() {
      if (pumping || !activationQueue.length) return;
      pumping = true;
      var batch = activationQueue.splice(0,3);
      batch.forEach(function (box) { try { activate(box); } catch(e) { console.warn('Ad activation failed',e); } });
      setTimeout(function () { pumping = false; pump(); }, 250);
    }
    function place(section) {
      var id = String(section.id || '');
      if (!id || exists(id)) return;
      var target = root(), placement = String(section.placement || 'between').toLowerCase(), slot = makeSlot(section);
      if (placement === 'start') {
        var reader = document.querySelector('.reader');
        if (reader) { var copy = reader.querySelector('.chapter-copy'); if (copy && copy.parentNode) copy.parentNode.insertBefore(slot,copy); else reader.insertBefore(slot,reader.firstChild); }
        else target.parentNode ? target.parentNode.insertBefore(slot,target) : target.insertBefore(slot,target.firstChild);
      } else if (placement === 'end') {
        var readerEnd = document.querySelector('.reader');
        if (readerEnd) { var related = readerEnd.querySelector('.related'); if (related) readerEnd.insertBefore(slot,related); else readerEnd.appendChild(slot); }
        else target.parentNode ? target.parentNode.insertBefore(slot,target.nextSibling) : target.appendChild(slot);
      } else {
        var pages = document.querySelector('.pages') || document.querySelector('.reader');
        var n = parseInt(section.afterImage != null ? section.afterImage : section.between,10);
        if (!Number.isFinite(n) || n < 1) n = 2;
        var imgs = pages ? Array.prototype.slice.call(pages.querySelectorAll('img.page')) : [];
        if (imgs.length) {
          var index = Math.min(n,imgs.length)-1;
          if (imgs[index].parentNode) imgs[index].parentNode.insertBefore(slot,imgs[index].nextSibling);
        } else {
          var list = document.querySelector('.home-list');
          var items = list ? Array.prototype.slice.call(list.querySelectorAll(':scope > a')) : [];
          if (items.length) { var ix = Math.min(n,items.length)-1; items[ix].parentNode.insertBefore(slot,items[ix].nextSibling); }
          else if (target) target.appendChild(slot);
        }
      }
      queue(slot);
    }
    function install() { sections.forEach(function (s) { try { place(s); } catch(e) { console.warn('Ad placement failed',s.id,e); } }); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true}); else install();
    var observer = new MutationObserver(function () { install(); });
    if (document.body) observer.observe(document.body,{childList:true,subtree:true});
  }
})();