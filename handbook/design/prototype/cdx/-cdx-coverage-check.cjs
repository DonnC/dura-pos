// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {states,dialogs,familyRoutes}=require('./-cdx-coverage-cases.js');
const root=__dirname,url=pathToFileURL(path.join(root,'-cdx-counter.html')).href;
function params(c){
 const p=new URLSearchParams('fresh=1&seed=1&invoice=sample&kept=sample&measure=sample&returns=sample'+
  '&access=sample&reports=sample&recovery=ready&fiscal=unknown');
 p.set('screen',c.screen);p.set('catalog',c.id);
 for(const [k,v] of new URLSearchParams(c.query||''))p.set(k,v);
 if(c.fixture==='worker'||c.id==='ask-owner')p.set('role','worker');
 if(['refused','closing'].includes(c.fixture))p.set('fiscal',c.fixture);
 if(c.fixture==='pending-access')p.set('access','pending');
 if(c.fixture==='empty')p.delete('seed');
 if(c.outcome==='full-return')p.delete('returns');
 if(c.screen==='kept-keep')p.set('cash','500');
 if(['access-expired','access-removed','access-recovery','my-access','access-limited'].includes(c.screen)&&c.id.startsWith('base-')){
  p.set('role','worker');p.set('access',c.screen==='access-recovery'?'expired':c.screen.slice(7));
 }
 return p;
}
(async()=>{
 assert.equal(new Set([...states,...dialogs].map(c=>c.id)).size,states.length+dialogs.length,
  'Every state/dialog example needs a unique identifier');
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await b.newPage({viewport:{width:390,height:844}});p.setDefaultTimeout(15000);
  p.setDefaultNavigationTimeout(20000);
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{
   if(typeof showSheet!=='function')return;
   const original=showSheet;window.openedDesignSheets=[];
   showSheet=(...args)=>{openedDesignSheets.push(new Error().stack);return original(...args);};
   const originalResult=result;window.openedDesignResults=[];
   result=(...args)=>{openedDesignResults.push(new Error().stack);return originalResult(...args);};
  }));
  await p.goto(url+'?fresh=1');
  await p.goto(url+'?fresh=1&seed=1');
  await p.locator('[data-action="sale-options"]').click();await p.locator('[data-action="held"]:visible').click();
  await p.keyboard.press('Escape');
  assert(await p.locator('#app').evaluate(el=>el.contains(document.activeElement)),
   'Nested dialog must return keyboard focus to the app');
  if(process.argv.includes('--focus-only')){console.log('PASS: nested dialog focus return.');return;}
  const routes=await p.evaluate(()=>Object.keys(screens).sort());
  const mapped=Object.values(familyRoutes).flat().sort();assert.deepEqual(mapped,routes,'Every route needs exactly one family');
  const html=fs.readFileSync(path.join(root,'-cdx-counter.html'),'utf8');
  const preview=fs.readFileSync(path.join(root,'-cdx-preview.html'),'utf8');
  for(const [id,key] of [['recovery-case','recovery'],['fiscal-example','fiscal']]){
   const select=preview.match(new RegExp(`<select id="${id}"[^>]*>([\\s\\S]*?)</select>`));
   const values=[...select[1].matchAll(/value="([^"]+)"/g)].map(m=>m[1]);
   const covered=new Set(states.map(c=>new URLSearchParams(c.query).get(key)).filter(Boolean));
   assert(values.every(v=>covered.has(v)),`Every ${id} option needs an inventory example`);
  }
  const files=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
  const discover=name=>files.flatMap(file=>fs.readFileSync(path.join(root,file),'utf8').split('\n')
   .flatMap((line,n)=>new RegExp(`\\b${name}\\(`).test(line)&&!line.includes('function '+name+'(')?
     [{file,line:n+1,source:line.trim()}]:[]));
  const callsites=discover('showSheet'),resultCallsites=discover('result'),feedbackCallsites=discover('toast');
  const observedResults=new Set();
  const recordResults=async()=>{
   for(const stack of await p.evaluate(()=>openedDesignResults)){
    const m=stack.match(/(-cdx-[\w-]+\.js):(\d+):/);if(m)observedResults.add(`${m[1]}:${m[2]}`);
   }
  };
  const result={date:'2026-11-11',scope:'Current cdx prototype only; designed examples, not all possible data values',
   routes:[],
   stateExamples:[],dialogs:[],dialogCallsites:callsites,resultCallsites,feedbackCallsites};
  for(const route of routes){
   const c={id:'base-'+route,screen:route};await p.goto(url+'?'+params(c));
   assert.equal(await p.locator('body').getAttribute('data-catalog-ready'),c.id);
   assert.equal(await p.evaluate(()=>page),route,'Catalog must render the requested base screen: '+route);
   await recordResults();
   result.routes.push({route,family:Object.keys(familyRoutes).find(k=>familyRoutes[k].includes(route)),
    url:'-cdx-counter.html?'+params(c),title:await p.locator('h1').first().innerText(),verified:true});
  }
  for(const c of states){
   await p.goto(url+'?'+params(c));
   assert.equal(await p.locator('body').getAttribute('data-catalog-ready'),c.id,c.id);
   assert(await p.locator('h1').count(),c.id);
   await recordResults();
   if(c.outcome)assert((await p.evaluate(()=>openedDesignResults)).length,c.id+' must show its completion view');
   result.stateExamples.push({...c,url:'-cdx-counter.html?'+params(c),title:await p.locator('h1').first().innerText(),
    actualScreen:await p.evaluate(()=>page),verified:true});
  }
  for(const c of dialogs){
   await p.goto(url+'?'+params(c));const dialog=p.locator('#sheet');
   assert(await dialog.isVisible(),c.id);assert.match(await p.locator('#sheet-title').innerText(),new RegExp(c.title));
   assert(await dialog.evaluate(el=>el.contains(document.activeElement)),c.id+' focus enters dialog');
   const stacks=await p.evaluate(()=>openedDesignSheets);
   const match=stacks.at(-1)?.match(/(-cdx-[\w-]+\.js):(\d+):/);
   assert(match,c.id+' source callsite');assert.equal(match[1],c.file);
   result.dialogs.push({...c,url:'-cdx-counter.html?'+params(c),source:{file:match[1],line:Number(match[2])},verified:true});
   await p.keyboard.press('Escape');assert(!(await dialog.isVisible()),c.id+' Escape');
  }
  const covered=new Set(result.dialogs.map(c=>`${c.source.file}:${c.source.line}`));
  assert(callsites.every(c=>covered.has(`${c.file}:${c.line}`)),'Every showSheet callsite must be rendered');
  assert.deepEqual(resultCallsites.filter(c=>!observedResults.has(`${c.file}:${c.line}`)),[],
   'Every completion/result callsite must have a rendered example');
  let dialogLayouts=0;
  for(const [width,height,mode] of [[320,740,'light'],[390,844,'large'],[768,1024,'dark'],[1024,768,'light']]){
   await p.setViewportSize({width,height});
   for(const c of dialogs){
    const target=params(c);if(mode==='dark')target.set('theme','dark');if(mode==='large')target.set('text','large');
    await p.goto(url+'?'+target);
    assert(await p.locator('#sheet').isVisible(),c.id);
    assert(!(await p.locator('#sheet').evaluate(el=>el.scrollWidth>el.clientWidth+1)),`${c.id} dialog overflow ${width} ${mode}`);
    assert(await p.locator('#sheet').evaluate(el=>{
      const r=el.getBoundingClientRect();return r.top>=-1&&r.bottom<=innerHeight+1;
    }),`${c.id} fits viewport`);dialogLayouts++;
   }
  }
  result.dialogLayoutChecks=dialogLayouts;
  for(const c of states.filter(c=>c.family==='long-data')){
   for(const mode of ['light','dark','large']){
    await p.setViewportSize({width:320,height:740});const target=params(c);
    if(mode==='dark')target.set('theme','dark');if(mode==='large')target.set('text','large');
    await p.goto(url+'?'+target);
    assert(!(await p.evaluate(()=>[...document.querySelectorAll('main,#dock,.app')]
      .some(el=>el.scrollWidth>el.clientWidth+1))),`${c.id} ${mode} overflow`);
   }
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(root,'-cdx-state-dialog-inventory.json'),JSON.stringify(result,null,2)+'\n');
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rows=(list,key)=>list.map(c=>`<li><a data-example="${escape(c.id)}" href="${escape(c.url)}">${escape(c.id)}</a> · ${escape(c[key]||c.screen)}</li>`).join('\n');
  fs.writeFileSync(path.join(root,'-cdx-coverage.html'),`<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Dura design coverage</title>
<style>*{box-sizing:border-box}body{font:14px/1.6 Arial,sans-serif;color:#252525;background:#f4f0e8;margin:0;padding:24px}
a{color:#9d3523}li{padding:8px 0}h1{line-height:1.15;font-size:28px}a:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #c3452d}
summary{cursor:pointer;padding:12px 0}input,select{font:inherit;min-height:48px;width:100%;padding:10px;border:1px solid #d9d1c8;border-radius:10px}
.workspace{display:grid;grid-template-columns:300px minmax(0,1fr);gap:24px}#coverage-links{height:75vh;overflow:auto}ul{padding-left:20px}
.preview{min-width:0}.controls{display:flex;gap:16px;flex-wrap:wrap}label{display:block}#coverage-board{position:relative;overflow:hidden;width:100%}
iframe{position:absolute;left:50%;border:0;background:white}#coverage-current{font-size:20px}#coverage-size{color:#615b55}
@media(max-width:800px){body{padding:16px}.workspace{display:block}#coverage-links{height:300px}.preview{margin-top:24px}}</style>
<h1>Dura · Design coverage</h1><p>90 base screens · ${states.length} state examples · ${dialogs.length} dialog examples.
Fictional HTML design only. Figma is deferred until all design coverage is reviewed.</p>
<p>Select a screen or state below, then inspect it on a phone or tablet. No live account, payment, import or fiscal request runs.</p>
<p><a href="-cdx-preview.html">Open responsive preview</a> · <a href="-cdx-state-dialog-inventory.md">Read coverage policy and remaining checks</a></p>
<div class="workspace"><aside><label for="coverage-search">Find a screen, state or dialog</label><input id="coverage-search" type="search">
<div id="coverage-links">
<h2>Screen families</h2>${Object.entries(familyRoutes).map(([name,list])=>`<details><summary>${escape(name)} · ${list.length} screens</summary><ul>${list.map(route=>`<li><a href="${escape(result.routes.find(c=>c.route===route).url)}">${escape(route)}</a></li>`).join('')}</ul></details>`).join('')}
<details><summary>State examples · ${states.length}</summary><ul>${rows(result.stateExamples,'title')}</ul></details>
<details><summary>Dialogs and overlays · ${dialogs.length}</summary><ul>${rows(result.dialogs,'title')}</ul></details>
</div></aside><section class="preview"><div class="controls"><label>Device<select id="coverage-device"><option value="phone">Phone</option>
<option value="portrait">Tablet portrait</option><option value="landscape">Tablet landscape</option></select></label><label>Appearance<select id="coverage-appearance">
<option value="light">Light</option><option value="dark">Dark</option><option value="large">200% text</option></select></label></div>
<h2 id="coverage-current">Sell</h2><p id="coverage-size"></p><p><a id="coverage-open" target="_blank">Open this example on its own</a></p>
<div id="coverage-board"><iframe id="coverage-frame" title="Selected Dura design example"></iframe></div></section></div>
<script src="-cdx-coverage-browser.js"></script></html>\n`);
  await p.setViewportSize({width:1440,height:1100});
  await p.goto(pathToFileURL(path.join(root,'-cdx-coverage.html')).href);
  await p.locator('#coverage-search').fill('fiscal-unknown');
  await p.locator('[data-example="fiscal-unknown"]').click();
  await p.locator('#coverage-device').selectOption('landscape');
  const frame=p.frameLocator('#coverage-frame');await frame.locator('h1').filter({hasText:'Result not confirmed'}).waitFor();
  assert.equal(await frame.locator('body').evaluate(()=>innerWidth),1024);
  await p.screenshot({path:path.join(root,'-cdx-coverage-browser.png')});
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${routes.length} routes; ${states.length} states; ${dialogs.length} dialogs cover ${callsites.length} callsites; `+
   `${resultCallsites.length} completion callsites; ${feedbackCallsites.length} feedback sources; ${dialogLayouts} dialog layouts and live catalog.`);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
