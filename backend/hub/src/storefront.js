// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

// The shop page: what anyone sees opening the hub's address (decision 0009).
//
// The address is public, so three rules hold here:
// - Only the fields named in storefrontData_ can appear. Costs, stock, tax
//   numbers, notes, staff and customers never get as far as the page.
// - Everything the owner typed is escaped.
// - A visit costs no quota. The finished page is cached, and a visit that
//   finds it reads no properties and no sheet. Taking orders isn't done here.
//
// Most shops have a few hundred products, so the page carries them all and
// filters on the phone, with no waiting and no data. A bigger catalogue would
// make every visit slow and costly on mobile data, so the page then carries the
// first 50, and shopProducts answers searches and "Show more" from the cache.

var STOREFRONT_SECONDS_ = 21600;
var STOREFRONT_ALL_IN_PAGE_ = 200; // up to here, the page holds every product, and search is instant
var STOREFRONT_PAGE_SIZE_ = 50; // above that, the page holds this many, and asks for more
var STOREFRONT_MAX_PRODUCTS_ = 5000;
var STOREFRONT_CHUNK_CHARS_ = 90000; // CacheService holds 100 KB in one value
var STOREFRONT_OFF_ = { title: 'Dura POS', off: true };

/** @param {any} value */
function escapeHtml_(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * A phone number in international digits, for Call and WhatsApp links. A sheet
 * stores 0771234567 as a number if it's typed plainly, which drops the 0.
 * @param {string} phone
 */
function internationalPhone_(phone) {
  var digits = phone.replace(/[^0-9]/g, '');
  if (/^0[0-9]{9}$/.test(digits)) return '263' + digits.slice(1);
  return /^7[0-9]{8}$/.test(digits) ? '263' + digits : digits;
}

/**
 * The page's content, by name. This list is the only way onto the page.
 * @param {any} services @param {any} master from readMasterData_
 */
function storefrontData_(services, master) {
  /** @type {Object<string, string>} */
  var settings = {};
  master.tables[TABLES_.settings].forEach(function (row) { settings[row.setting] = row.value; });
  if (settings[SETTINGS_.shopPage] === SHEET_WORDS_.off) return STOREFRONT_OFF_;
  var currency = services.store.get(STORE_KEYS_.pricingCurrency);
  var name = settings[SETTINGS_.businessName] || services.store.get(STORE_KEYS_.businessName);
  return {
    title: name,
    name: name,
    address: settings.Address || '',
    phone: settings.Phone || '',
    accepts: settings[SETTINGS_.acceptedCurrencies] || currency,
    currency: currency,
    products: master.tables[TABLES_.products]
      .filter(function (p) { return p.active !== SHEET_WORDS_.no; })
      .slice(0, STOREFRONT_MAX_PRODUCTS_)
      .map(function (p) {
        return { name: p.name, category: p.category || '', unit: p.unit || '', price: Number(p.price_pricing).toFixed(2) };
      }),
  };
}

/** @param {any} shop */
function storefrontActions_(shop) {
  var links = [];
  if (shop.phone) {
    var phone = internationalPhone_(shop.phone);
    links.push('<a class="action" href="tel:+' + phone + '">Call</a>');
    links.push('<a class="action" target="_blank" rel="noopener" href="https://wa.me/' + phone + '">WhatsApp</a>');
  }
  if (shop.address) {
    links.push('<a class="action" target="_blank" rel="noopener" href="' +
      escapeHtml_('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(shop.address)) + '">Directions</a>');
  }
  return links.length ? '<nav class="actions">' + links.join('') + '</nav>' : '';
}

/** @param {any} shop */
function storefrontList_(shop) {
  if (shop.products.length === 0) return '<p class="empty">Ask in the shop for today\'s products and prices.</p>';
  var paged = shop.products.length > STOREFRONT_ALL_IN_PAGE_;
  var shown = paged ? shop.products.slice(0, STOREFRONT_PAGE_SIZE_) : shop.products;
  var categories = shop.products.map(function (p) { return p.category; })
    .filter(function (c, i, all) { return c && all.indexOf(c) === i; }).sort();
  var chips = categories.length < 2 ? '' : '<div class="chips"><button class="chip on" data-cat="">All</button>' +
    categories.map(function (c) {
      return '<button class="chip" data-cat="' + escapeHtml_(c) + '">' + escapeHtml_(c) + '</button>';
    }).join('') + '</div>';
  var rows = shown.map(function (p) {
    return '<li data-name="' + escapeHtml_(p.name.toLowerCase()) + '" data-cat="' + escapeHtml_(p.category) + '">' +
      '<span class="what">' + escapeHtml_(p.name) + (p.unit ? '<small>' + escapeHtml_(p.unit) + '</small>' : '') + '</span>' +
      '<span class="price">' + escapeHtml_(shop.currency) + ' ' + escapeHtml_(p.price) + '</span></li>';
  }).join('');
  return '<input class="search" type="search" placeholder="Search ' + shop.products.length +
    ' products" aria-label="Search products">' + chips +
    '<ul class="list" data-paged="' + (paged ? '1' : '') + '" data-currency="' + escapeHtml_(shop.currency) + '">' + rows +
    '</ul><p class="empty" hidden>Nothing matches that.</p>' +
    (paged ? '<button class="more">Show more</button>' : '');
}

var STOREFRONT_CSS_ = [
  ':root{--green:#024d39;--gold:#e0ae4b;--paper:#fefef8;--ink:#14241f;--soft:#5d6b66;--line:#e6e8df}',
  '*{box-sizing:border-box}',
  'body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}',
  'main{max-width:560px;margin:0 auto;padding:0 16px 24px}',
  'header{background:var(--green);color:#fff;padding:28px 16px 64px;text-align:center}',
  '.monogram{width:64px;height:64px;margin:0 auto 12px;border-radius:50%;background:var(--gold);color:var(--green);',
  'display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:700}',
  'h1{margin:0;font-size:26px;line-height:1.2}',
  'header p{margin:6px 0 0;opacity:.85}',
  '.actions{display:flex;gap:8px;margin:-40px 0 20px}',
  '.action{flex:1;min-height:52px;display:flex;align-items:center;justify-content:center;background:#fff;color:var(--green);',
  'border:1px solid var(--line);border-radius:14px;font-weight:600;text-decoration:none;box-shadow:0 2px 8px rgba(2,77,57,.12)}',
  '.search{width:100%;height:48px;padding:0 14px;font:inherit;border:1px solid var(--line);border-radius:12px;background:#fff;color:inherit}',
  '.chips{display:flex;gap:8px;overflow-x:auto;padding:12px 0 2px}',
  '.chip{flex:none;min-height:40px;padding:0 14px;font:inherit;border:1px solid var(--line);border-radius:20px;background:#fff;color:var(--ink)}',
  '.chip.on{background:var(--green);border-color:var(--green);color:#fff}',
  '.list{list-style:none;margin:8px 0 0;padding:0}',
  '.list li{display:flex;justify-content:space-between;align-items:center;gap:16px;min-height:56px;padding:10px 2px;border-bottom:1px solid var(--line)}',
  '.what small{display:block;color:var(--soft)}',
  '.price{flex:none;font-weight:700;color:var(--green);font-variant-numeric:tabular-nums}',
  '.empty{color:var(--soft);text-align:center;padding:24px 0}',
  '.more{display:block;width:100%;min-height:48px;margin:16px 0 0;font:inherit;font-weight:600;color:var(--green);',
  'background:#fff;border:1px solid var(--line);border-radius:12px}',
  '.more[hidden]{display:none}',
  '.accepts{color:var(--soft);font-size:14px;margin:16px 0 0;text-align:center}',
  'footer{display:flex;align-items:center;justify-content:center;gap:6px;padding:20px 0 8px;font-size:13px;color:var(--soft)}',
  'footer img{height:22px}',
  'footer a{color:inherit}',
  'a:focus-visible,button:focus-visible,input:focus-visible{outline:3px solid var(--gold);outline-offset:2px}',
].join('');

// In a small shop this filters the rows in place. In a big one it asks the hub,
// a moment after typing stops. Answers are drawn with textContent, so nothing a
// shop typed can become markup.
var STOREFRONT_JS_ = [
  'var q=document.querySelector(".search"),list=document.querySelector(".list"),none=document.querySelector(".empty"),',
  'more=document.querySelector(".more"),cat="",page=0,ask=0,wait;',
  'function chips(fn){document.querySelectorAll(".chip").forEach(fn)}',
  'function inPage(){var t=q.value.toLowerCase(),n=0;list.querySelectorAll("li").forEach(function(r){',
  'var s=r.dataset.name.indexOf(t)>=0&&(!cat||r.dataset.cat===cat);r.style.display=s?"":"none";if(s)n++});none.hidden=n>0}',
  'function row(p){var li=document.createElement("li"),a=document.createElement("span"),b=document.createElement("span");',
  'a.className="what";a.textContent=p.name;if(p.unit){var u=document.createElement("small");u.textContent=p.unit;a.appendChild(u)}',
  'b.className="price";b.textContent=list.dataset.currency+" "+p.price;li.appendChild(a);li.appendChild(b);list.appendChild(li)}',
  'function fetchPage(next){var id=++ask;page=next;more.disabled=true;google.script.run.withSuccessHandler(function(r){',
  'if(id!==ask)return;if(next===0)list.textContent="";r.items.forEach(row);none.textContent="Nothing matches that.";',
  'none.hidden=next>0||r.items.length>0;more.hidden=!r.more;more.disabled=false}).withFailureHandler(function(){',
  'if(id!==ask)return;none.textContent="That didn\'t load. Try again.";none.hidden=false;more.disabled=false})',
  '.shopProducts(q.value,cat,next)}',
  'function change(){if(list.dataset.paged){clearTimeout(wait);wait=setTimeout(function(){fetchPage(0)},350)}else inPage()}',
  'if(q){q.addEventListener("input",change);chips(function(b){b.addEventListener("click",function(){',
  'cat=b.dataset.cat;chips(function(o){o.classList.toggle("on",o===b)});change()})});',
  'if(more)more.addEventListener("click",function(){fetchPage(page+1)})}',
].join('');

/** The whole page. @param {any} shop from storefrontData_ */
function storefrontHtml_(shop) {
  var head = '<!DOCTYPE html><html lang="en"><head><base target="_top"><style>' + STOREFRONT_CSS_ + '</style></head><body>';
  if (shop.off) {
    return head + '<main><p class="empty">This shop page is not available.</p></main></body></html>';
  }
  return head + '<header><div class="monogram" aria-hidden="true">' + escapeHtml_(shop.name.charAt(0).toUpperCase()) +
    '</div><h1>' + escapeHtml_(shop.name) + '</h1>' + (shop.address ? '<p>' + escapeHtml_(shop.address) + '</p>' : '') +
    '</header><main>' + (storefrontActions_(shop) || '<div style="height:20px"></div>') + storefrontList_(shop) +
    '<p class="accepts">Prices in ' + escapeHtml_(shop.currency) + '. We accept ' + escapeHtml_(shop.accepts) + '.</p>' +
    '<footer><img src="' + BRAND_MARK_ + '" alt=""><span>Runs on <a target="_blank" rel="noopener" ' +
    'href="https://github.com/DonnC/dura-pos">Dura POS</a>, free and open source</span></footer></main>' +
    '<script>' + STOREFRONT_JS_ + '</script></body></html>';
}

/** Rebuilds and caches the page. Failures leave the old page in place. @param {any} services @param {any} master */
function publishStorefront_(services, master) {
  var shop = storefrontData_(services, master);
  var page = { title: shop.title, html: storefrontHtml_(shop) };
  services.cache.put(CACHE_KEYS_.storefrontPage, JSON.stringify(page), STOREFRONT_SECONDS_);
  cacheProductList_(services.cache, shop.products || []);
  return page;
}

/** The whole list, in pieces a cache value can hold. @param {any} cache @param {any[]} products */
function cacheProductList_(cache, products) {
  var text = JSON.stringify(products);
  /** @type {Object<string, string>} */
  var values = {};
  var pieces = Math.ceil(text.length / STOREFRONT_CHUNK_CHARS_);
  for (var i = 0; i < pieces; i++) {
    values[CACHE_KEYS_.storefrontList + i] = text.slice(i * STOREFRONT_CHUNK_CHARS_, (i + 1) * STOREFRONT_CHUNK_CHARS_);
  }
  values[CACHE_KEYS_.storefrontList + 'pieces'] = String(pieces);
  cache.putAll(values, STOREFRONT_SECONDS_);
}

/** The cached list, or null if any piece has gone. @param {any} cache */
function readProductList_(cache) {
  var count = cache.get(CACHE_KEYS_.storefrontList + 'pieces');
  if (count === null) return null;
  var keys = [];
  for (var i = 0; i < Number(count); i++) keys.push(CACHE_KEYS_.storefrontList + i);
  var found = cache.getAll(keys);
  if (Object.keys(found).length !== keys.length) return null;
  return JSON.parse(keys.map(function (key) { return found[key]; }).join('') || '[]');
}

/**
 * One page of products, for the shop page's search and "Show more". The page
 * calls this with google.script.run, so it's public, and takes anything:
 * it returns only what the page already shows, and never touches a sheet
 * unless the cache has gone.
 * @param {any} query @param {any} category @param {any} page
 */
function shopProducts(query, category, page) {
  var cache = CacheService.getScriptCache();
  var products = readProductList_(cache);
  if (!products) {
    loadStorefront_(true);
    products = readProductList_(cache) || [];
  }
  var words = String(query || '').toLowerCase().slice(0, 60);
  var group = String(category || '');
  var first = Math.max(0, Math.floor(Number(page) || 0)) * STOREFRONT_PAGE_SIZE_;
  var matches = products.filter(function (p) {
    return p.name.toLowerCase().indexOf(words) >= 0 && (!group || p.category === group);
  });
  return { items: matches.slice(first, first + STOREFRONT_PAGE_SIZE_), more: matches.length > first + STOREFRONT_PAGE_SIZE_ };
}

/**
 * The page, from the cache when it can be. Never shows an error's text.
 * @param {boolean} [rebuild] ignore the cached page
 */
function loadStorefront_(rebuild) {
  var cached = rebuild ? null : CacheService.getScriptCache().get(CACHE_KEYS_.storefrontPage);
  if (cached) return JSON.parse(cached);
  try {
    var services = createServices_();
    if (!services.store.get(STORE_KEYS_.fileMyShop)) throw new Error('Not set up');
    return publishStorefront_(services, readMasterData_(services));
  } catch (error) {
    console.error('Shop page not built: ' + (error && error.name));
    return { title: STOREFRONT_OFF_.title, html: storefrontHtml_(STOREFRONT_OFF_) };
  }
}

/** The web app's GET: the shop page. */
function doGet() {
  var page = loadStorefront_();
  return HtmlService.createHtmlOutput(page.html).setTitle(page.title)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
