/* MangaAtlas Ads System v7 — ZIP-reference sequential script execution. */
(function () {
  'use strict';
  if (window.__mangaAtlasAdsSystemLoaded) return;
  window.__mangaAtlasAdsSystemLoaded = true;
  if (/(^|\\/)admin(?:\\/|$)/i.test(location.pathname)) return;

  var currentScript = document.currentScript;
  var configUrl = currentScript && currentScript.src
    ? new URL('data/ads-config.json', currentScript.src).href
    : new URL('/data/ads-config.json', location.origin).href;

  fetch(configUrl + (configUrl.indexOf('?') < 0 ? '?' : '&') + 'v=' + Date.now(), { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) throw new Error('Ads config HTTP ' + response.status);
      return response.json();
    })
    .then(start)
    .catch(function (error) {
      console.warn('[MangaAtlas Ads] Could not load configuration:', error);
    });

  function start(config) {
    var sections = Array.isArray(config && config.sections)
      ? config.sections.filter(function (section) {
          return section && section.enabled && String(section.code || '').trim();
        })
      : [];

    if (!sections.length) {
      console.info('[MangaAtlas Ads] No enabled ad sections with code.');
      return;
    }

    var activationQueue = [];
    var activating = false;

    function root() {
      return document.querySelector('.reader') ||
        document.querySelector('.pages') ||
        document.querySelector('main') ||
        document.querySelector('article') ||
        document.body;
    }

    function exists(id) {
      return !!document.querySelector('[data-ma-ad-section="' + String(id).replace(/"/g, '\\"') + '"]');
    }

    function makeSlot(section) {
      var slot = document.createElement('div');
      slot.className = 'manga-atlas-ad-slot';
      slot.dataset.maAdSection = String(section.id);
      slot.style.cssText = [
        'box-sizing:border-box',
        'width:100%',
        'max-width:100%',
        'min-height:90px',
        'margin:18px auto',
        'padding:8px 0',
        'display:flex',
        'flex-wrap:wrap',
        'justify-content:center',
        'align-items:center',
        'gap:12px',
        'clear:both',
        'overflow:visible',
        'position:relative',
        'z-index:1'
      ].join(';');

      var content = document.createElement('div');
      content.className = 'manga-atlas-ad-content';
      content.style.cssText = 'box-sizing:border-box;width:100%;max-width:100%;min-height:90px;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;overflow:visible;';
      content.innerHTML = String(section.code || '');
      slot.appendChild(content);
      return slot;
    }

    // Execute each provider script in source order, just like the supplied
    // MangaGoAtlas ZIP. Waiting for external scripts prevents atOptions from
    // being overwritten by the next banner before invoke.js reads it.
    function activate(slot, finishedCallback) {
      var scripts = Array.prototype.slice.call(slot.querySelectorAll('script'));
      var completed = false;

      function finish() {
        if (completed) return;
        completed = true;
        if (typeof finishedCallback === 'function') finishedCallback();
      }

      function runNext(index) {
        if (index >= scripts.length) {
          finish();
          return;
        }

        var oldScript = scripts[index];
        if (!oldScript || !oldScript.parentNode) {
          runNext(index + 1);
          return;
        }

        var parent = oldScript.parentNode;
        var script = document.createElement('script');
        Array.prototype.slice.call(oldScript.attributes).forEach(function (attribute) {
          script.setAttribute(attribute.name, attribute.value);
        });

        var source = oldScript.getAttribute('src');
        if (source) {
          var settled = false;
          var timeout = setTimeout(function () {
            if (settled) return;
            settled = true;
            console.warn('[MangaAtlas Ads] Provider script timed out:', script.src);
            runNext(index + 1);
          }, 12000);

          function settle() {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            script.onload = null;
            script.onerror = null;
            runNext(index + 1);
          }

          script.async = false;
          script.onload = settle;
          script.onerror = function () {
            console.warn('[MangaAtlas Ads] Provider script failed:', script.src);
            settle();
          };
          script.src = source;
          parent.replaceChild(script, oldScript);
        } else {
          script.text = oldScript.textContent || '';
          parent.replaceChild(script, oldScript);
          runNext(index + 1);
        }
      }

      runNext(0);
    }

    function queue(slot) {
      activationQueue.push(slot);
      pump();
    }

    function pump() {
      if (activating || !activationQueue.length) return;
      activating = true;
      var slot = activationQueue.shift();
      try {
        activate(slot, function () {
          activating = false;
          pump();
        });
      } catch (error) {
        console.warn('[MangaAtlas Ads] Script activation failed:', error);
        activating = false;
        pump();
      }
    }

    function place(section) {
      var id = String(section.id || '');
      if (!id || exists(id)) return;

      var target = root();
      if (!target) return;

      var placement = String(section.placement || 'between').toLowerCase();
      var slot = makeSlot(section);
      var reader = document.querySelector('.reader');

      if (placement === 'start') {
        if (reader) {
          var chapterCopy = reader.querySelector('.chapter-copy');
          if (chapterCopy && chapterCopy.parentNode) {
            chapterCopy.parentNode.insertBefore(slot, chapterCopy);
          } else {
            reader.insertBefore(slot, reader.firstChild);
          }
        } else if (target.parentNode) {
          target.parentNode.insertBefore(slot, target);
        } else {
          target.insertBefore(slot, target.firstChild);
        }
      } else if (placement === 'end') {
        if (reader) {
          var related = reader.querySelector('.related');
          if (related) reader.insertBefore(slot, related);
          else reader.appendChild(slot);
        } else if (target.parentNode) {
          target.parentNode.insertBefore(slot, target.nextSibling);
        } else {
          target.appendChild(slot);
        }
      } else {
        var pages = document.querySelector('.pages') || reader;
        var imageNumber = parseInt(
          section.afterImage != null ? section.afterImage : section.between,
          10
        );
        if (!Number.isFinite(imageNumber) || imageNumber < 1) imageNumber = 2;

        var pageImages = pages
          ? Array.prototype.slice.call(pages.querySelectorAll('img.page'))
          : [];

        if (pageImages.length) {
          var imageIndex = Math.min(imageNumber, pageImages.length) - 1;
          var image = pageImages[imageIndex];
          if (image.parentNode) image.parentNode.insertBefore(slot, image.nextSibling);
        } else {
          var homeList = document.querySelector('.home-list');
          var links = homeList
            ? Array.prototype.slice.call(homeList.querySelectorAll(':scope > a'))
            : [];
          if (links.length) {
            var linkIndex = Math.min(imageNumber, links.length) - 1;
            links[linkIndex].parentNode.insertBefore(slot, links[linkIndex].nextSibling);
          } else {
            target.appendChild(slot);
          }
        }
      }

      queue(slot);
    }

    function install() {
      sections.forEach(function (section) {
        try {
          place(section);
        } catch (error) {
          console.warn('[MangaAtlas Ads] Placement failed for ' + section.id + ':', error);
        }
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', install, { once: true });
    } else {
      install();
    }

    if (document.body) {
      var pageObserver = new MutationObserver(install);
      pageObserver.observe(document.body, { childList: true, subtree: true });
    }
  }
})();
