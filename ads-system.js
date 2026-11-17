/* MangaAtlas Ads System — restored from the supplied MangaGoAtlas ZIP loader. */
(async function(){'use strict';
if(window.__mangaAtlasAdsSystemLoaded)return;window.__mangaAtlasAdsSystemLoaded=true;
if(location.pathname.indexOf('/admin')===0)return;
var cfg;try{var r=await fetch('/data/ads-config.json?v='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);cfg=await r.json()}catch(e){console.error('[Ads] config load failed',e);return}
var sections=Array.isArray(cfg&&cfg.sections)?cfg.sections.filter(function(s){return s&&s.enabled&&String(s.code||'').trim()}):[];
function makeSlot(code,id){var box=document.createElement('div');box.className='manga-atlas-ad-slot';box.dataset.maAdSection=id;box.style.cssText='width:100%;min-height:90px;margin:20px auto;padding:8px 0;display:flex;justify-content:center;align-items:center;clear:both;overflow:visible;position:relative;z-index:1;';var label=document.createElement('div');label.textContent='Advertisement';label.setAttribute('aria-label','Advertisement');label.style.cssText='position:absolute;top:0;left:0;font:10px Arial,sans-serif;color:#8b8b8b;line-height:12px;';box.appendChild(label);var content=document.createElement('div');content.style.cssText='width:100%;min-height:90px;display:flex;justify-content:center;align-items:center;overflow:visible;';box.appendChild(content);content.innerHTML=String(code||'');return box}
var activationQueue=Promise.resolve();
function activate(box){
activationQueue=activationQueue.then(function(){return new Promise(function(resolve){
var list=Array.prototype.slice.call(box.querySelectorAll('script'));
function next(i){if(i>=list.length){resolve();return}var old=list[i];if(!old.parentNode){next(i+1);return}
var s=document.createElement('script');Array.prototype.slice.call(old.attributes).forEach(function(a){s.setAttribute(a.name,a.value)});s.text=old.textContent||'';
if(s.src){s.async=false;var advanced=false;var timer=setTimeout(advance,8000);function advance(){if(advanced)return;advanced=true;clearTimeout(timer);s.onload=null;s.onerror=null;next(i+1)}s.onload=advance;s.onerror=advance;old.parentNode.replaceChild(s,old)}
else{old.parentNode.replaceChild(s,old);next(i+1)}}
next(0);
})}).catch(function(e){console.warn('[Ads] activation queue error',e)});
return activationQueue;
}
function root(){return document.querySelector('.reader')||document.querySelector('.pages')||document.querySelector('main')||document.querySelector('article')||document.body}
function place(s){var id=String(s.id||'');if(!id||document.querySelector('[data-ma-ad-section="'+CSS.escape(id)+'"]'))return;var r=root();if(!r)return;var p=String(s.placement||'start').toLowerCase(),box;
if(p==='between'){var pages=document.querySelector('.pages')||document.querySelector('.reader');var imgs=pages?Array.prototype.slice.call(pages.querySelectorAll('img.page')):[];var n=parseInt(s.afterImage!=null?s.afterImage:s.between,10);if(!Number.isFinite(n)||n<1)n=5;
if(imgs.length){var idx=Math.min(n,imgs.length)-1;box=makeSlot(s.code,id);imgs[idx].parentNode.insertBefore(box,imgs[idx].nextSibling);activate(box);return}
var list=document.querySelector('.home-list');var links=list?Array.prototype.slice.call(list.querySelectorAll(':scope > a')):[];if(links.length){var li=Math.min(n,links.length)-1;box=makeSlot(s.code,id);links[li].parentNode.insertBefore(box,links[li].nextSibling);activate(box)}return}
box=makeSlot(s.code,id);var reader=document.querySelector('.reader');
if(reader&&r===reader){if(p==='end'){var related=reader.querySelector('.related');if(related)reader.insertBefore(box,related);else reader.appendChild(box)}else{var copy=reader.querySelector('.chapter-copy');if(copy&&copy.nextSibling)reader.insertBefore(box,copy.nextSibling);else if(copy)reader.appendChild(box);else reader.insertBefore(box,reader.firstChild)}}
else if(p==='end'){if(r.parentNode)r.parentNode.insertBefore(box,r.nextSibling);else r.appendChild(box)}
else{if(r.parentNode)r.parentNode.insertBefore(box,r);else r.insertBefore(box,r.firstChild)}activate(box)}
function install(){sections.forEach(function(s){try{place(s)}catch(e){console.warn('[Ads] placement failed: '+s.id,e)}})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
var observer=new MutationObserver(install);observer.observe(document.body,{childList:true,subtree:true});var tries=0,timer=setInterval(function(){install();if(++tries>=50)clearInterval(timer)},300);
})();