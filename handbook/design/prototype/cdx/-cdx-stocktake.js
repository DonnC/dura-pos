// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

if(q.get('take')==='large'&&q.get('fresh')==='1'){
  while(products().length<500){const n=products().length+1;
    products().push({id:'sample-'+n,name:['Rice','Beans','Soap','Biscuits','Tea'][n%5]+' · sample '+n,
      unit:'1 pack',stockUnit:'packs',stock:10+n%25,cents:100,cat:['Food','Household','Drinks'][n%3],barcode:'SKU-'+String(n).padStart(4,'0')});
  }
}
const takeScope=()=>JSON.stringify([s.shop,s.role,s.name,'Device 1']);
function stockTake(){
  if(s.stockTake?.scope!==takeScope())s.stockTake={scope:takeScope(),entries:{},reasonType:'other',reason:''};
  return s.stockTake;
}
const takeProducts=()=>products().filter(p=>p.stock!==null&&!p.oneOff);
const takeStale=(p,e)=>e&&(e.before!==p.stock||e.revision!==(s.stockRevisions?.[p.id]||0));
const takeRows=()=>takeProducts().filter(p=>stockTake().entries[p.id]?.value!=='')
  .filter(p=>stockTake().entries[p.id]).map(p=>({id:p.id,before:stockTake().entries[p.id].before,
    count:parseQuantity(stockTake().entries[p.id].value,p.scale||1)}));
let takeSearch='',takeCategory='all',takeFilter='all',takePage=0,takeReviewPage=0,takeReviewFilter='differences';
const takePageSize=20;
const takeReasons={damage:'Damaged / expired goods',missing:'Missing goods',found:'Goods found',
  correction:'Earlier entry was wrong',other:'Other'};
function takeMatches(){
  return takeProducts().filter(p=>{
    const e=stockTake().entries[p.id],counted=e&&e.value!=='';
    return (takeCategory==='all'||p.cat===takeCategory)&&
      [p.name,p.id,p.barcode||''].join(' ').toLowerCase().includes(takeSearch.toLowerCase())&&
      (takeFilter==='all'||takeFilter==='counted'&&counted||takeFilter==='uncounted'&&!counted||
        takeFilter==='recount'&&(takeStale(p,e)||counted&&parseQuantity(e.value,p.scale||1)===null));
  });
}
function takeStatus(){
  const rows=takeRows(),stale=rows.filter(r=>takeStale(products().find(p=>p.id===r.id),stockTake().entries[r.id]));
  const invalid=rows.some(r=>r.count===null);
  return {rows,stale,invalid,changed:rows.filter(r=>r.count!==r.before)};
}
screens['stock-count']=()=>{
  stockTake();
  if(!takeProducts().length){screen.innerHTML=heading('No products to count.','Add a stock-tracked product first.','stock');
    primary('new-product','Add a product');return;}
  screen.innerHTML=heading('Stock take.','Front counter · Saved on this device','stock')+
    '<div class="take-toolbar"><div class="searchbox">'+icon('search')+
    '<input id="take-search" aria-label="Find product or barcode" placeholder="Find item / barcode" value="'+esc(takeSearch)+'"></div>'+
    '<label class="take-category"><span>Category</span><select id="take-category" class="form-input">'+
      option('all','All categories',takeCategory==='all')+
      [...new Set(takeProducts().map(p=>p.cat))].map(c=>option(c,c,takeCategory===c)).join('')+'</select></label></div>'+
    '<div class="take-progress" id="take-progress" aria-live="polite"></div>'+
    '<div class="tabs">'+[['all','All items'],['uncounted','Not counted'],['counted','Counted'],['recount','Recount']]
      .map(([v,l])=>btn('take-filter',l,'chip',`data-filter="${v}" aria-pressed="${v===takeFilter}"`)).join('')+'</div>'+
    '<p class="micro">Blank = not counted · 0 = none. Enter the full quantity.</p>'+
    '<div id="take-list"></div><div id="take-pagination" class="take-pagination"></div>'+
    note('Draft kept on this device. Other devices may have unsent stock changes. Recheck before saving; selling can continue.');
  const back=screen.querySelector('.back');back.classList.add('take-back');back.innerHTML=icon('back');
  back.setAttribute('aria-label','Back to Stock · count draft kept');
  primary('review-stock-count','Review counted items',true);drawTakeList();
};
function drawTakeList(){
  const matches=takeMatches();takePage=Math.min(takePage,Math.max(0,Math.ceil(matches.length/takePageSize)-1));
  const shown=matches.slice(takePage*takePageSize,(takePage+1)*takePageSize);
  document.querySelector('#take-list').innerHTML=shown.map(p=>{
    const e=stockTake().entries[p.id],stale=takeStale(p,e);
    return '<div class="take-row"><div><strong>'+esc(p.name)+'</strong><small>'+esc(p.unit)+
      (p.barcode?' · '+esc(p.barcode):'')+'</small>'+ (stale?'<span class="error">Stock changed · Recount</span>':'')+
      '<div id="take-feedback-'+esc(p.id)+'"></div></div>'+field('count-'+p.id,'Count · '+esc(p.scale?p.measure:p.stockUnit),e?.value??'',
        'maxlength="12" inputmode="decimal" placeholder="Not counted" data-take-id="'+esc(p.id)+'"')+
      (stale?btn('take-recount','Recount','text-button',`data-id="${p.id}"`):'')+'</div>';
  }).join('')||'<div class="empty compact"><h2>No matching products.</h2><p class="sub">Change the search or count filter.</p></div>';
  document.querySelector('#take-pagination').innerHTML=btn('take-prev','Previous','secondary',takePage?'':'disabled')+
    '<span>'+ (matches.length?takePage*takePageSize+1:0)+'–'+Math.min((takePage+1)*takePageSize,matches.length)+
    ' of '+matches.length+'</span>'+btn('take-next','Next 20','secondary',(takePage+1)*takePageSize<matches.length?'':'disabled');
  drawTakeProgress();shown.forEach(p=>drawTakeFeedback(p));
}
function drawTakeProgress(){
  const t=takeStatus();document.querySelector('#take-progress').innerHTML='<strong>'+t.rows.length+' of '+
    takeProducts().length+' counted</strong><span>'+(t.stale.length?t.stale.length+' need recount':
    t.invalid?'Check invalid counts':t.changed.length+' differences')+'</span>';
  enable('review-stock-count',t.rows.length>0&&!t.invalid&&!t.stale.length);
}
inputActions['stock-count']=el=>{
  if(!document.querySelector('#take-progress'))return;
  if(el?.id==='take-search'){takeSearch=el.value;takePage=0;drawTakeList();return;}
  if(el?.id==='take-category'){takeCategory=el.value;takePage=0;drawTakeList();return;}
  const inputs=el?.dataset.takeId?[el]:[...document.querySelectorAll('[data-take-id]')];
  for(const input of inputs){
    const p=products().find(p=>p.id===input.dataset.takeId);
    const prior=stockTake().entries[p.id],previous=prior?.value!==''?prior:null;
    input.setAttribute('aria-invalid',String(input.value!==''&&parseQuantity(input.value,p.scale||1)===null));
    stockTake().entries[p.id]={...prior,value:input.value.slice(0,12),before:previous?.before??p.stock,
      revision:previous?.revision??(s.stockRevisions?.[p.id]||0)};
    drawTakeFeedback(p);
  }save();drawTakeProgress();
};
actions['take-filter']=b=>{takeFilter=b.dataset.filter;takePage=0;render();};
actions['take-next']=()=>{takePage++;drawTakeList();screen.scrollTop=0;};
actions['take-prev']=()=>{takePage=Math.max(0,takePage-1);drawTakeList();screen.scrollTop=0;};
actions['take-recount']=b=>{delete stockTake().entries[b.dataset.id];save();drawTakeList();
  document.getElementById('count-'+b.dataset.id)?.focus();};
actions['review-stock-count']=()=>{
  const t=takeStatus();if(!t.rows.length||t.invalid||t.stale.length)return;
  draft.stockCount=t.rows;takeReviewPage=0;navigate('count-stock-review');
};
screens['count-stock-review']=()=>{
  // Existing isolated catalog reviews can supply a prepared draft directly.
  if(!draft.stockCount?.length){navigate('stock-count');return;}
  const changed=draft.stockCount.filter(r=>r.count!==r.before),t=stockTake();
  const unassigned=changed.filter(r=>!takeItemReason(r.id));
  screen.innerHTML=heading('Review stock take.',draft.stockCount.length+' counted · '+
    (takeProducts().length-draft.stockCount.length)+' left untouched','stock-count')+
    '<div class="take-review-summary">'+line('Differences',changed.length+' products')+
    line('Matched',draft.stockCount.length-changed.length+' products')+'</div>'+
    '<div class="tabs">'+[['differences','Differences'],['all','All counted']].map(([v,l])=>
      btn('take-review-filter',l,'chip',`data-filter="${v}" aria-pressed="${v===takeReviewFilter}"`)).join('')+'</div>'+
    '<div id="take-review-list"></div><div id="take-review-pagination" class="take-pagination"></div>'+
    (unassigned.length?select('count-reason-type','Reason for remaining differences',Object.entries(takeReasons)
      .map(([v,l])=>option(v,l,v===t.reasonType)).join(''))+
      '<div id="take-other-reason">'+field('count-reason','Explain the other reason',t.reason,'maxlength="120"')+'</div>':
      '<p class="change">'+(changed.length?'Each difference has a reason.':'All counted products match.')+'</p>')+
    '<p class="error" id="take-review-error" role="alert"></p>'+
    note('Only counted products change. Uncounted products are never set to zero.');
  primary('save-stock-count','Save stock take',!!changed.length);drawTakeReview();
};
function drawTakeReview(){
  const rows=draft.stockCount.filter(r=>takeReviewFilter==='all'||r.count!==r.before);
  takeReviewPage=Math.min(takeReviewPage,Math.max(0,Math.ceil(rows.length/20)-1));
  document.querySelector('#take-review-list').innerHTML=rows.slice(takeReviewPage*20,(takeReviewPage+1)*20).map(r=>{
    const p=products().find(p=>p.id===r.id);return line(esc(p.name),esc(stockText(p,r.count)),
      'Recorded '+esc(stockText(p,r.before))+' · Difference '+esc(stockText(p,r.count-r.before))+
      (takeItemReason(r.id)?' · '+esc(takeItemReason(r.id)):''));
  }).join('')||'<p class="sub">No differences in this view.</p>';
  document.querySelector('#take-review-pagination').innerHTML=btn('take-review-prev','Previous','secondary',takeReviewPage?'':'disabled')+
    '<span>'+rows.length+' products</span>'+btn('take-review-next','Next 20','secondary',(takeReviewPage+1)*20<rows.length?'':'disabled');
  inputActions['count-stock-review']();
}
inputActions['count-stock-review']=()=>{
  const t=stockTake();if(document.querySelector('#count-reason-type')){
    t.reasonType=val('count-reason-type');t.reason=val('count-reason');
    document.querySelector('#take-other-reason').hidden=t.reasonType!=='other';
  }
  const changed=draft.stockCount?.some(r=>r.count!==r.before),stale=draft.stockCount?.some(r=>{
    const p=products().find(p=>p.id===r.id);return !p||p.stock!==r.before||takeStale(p,t.entries[r.id]);
  });
  document.querySelector('#take-review-error').textContent=stale?'Stock changed. Go back and recount the affected products.':'';
  const missing=draft.stockCount?.filter(r=>r.count!==r.before&&!takeItemReason(r.id));
  enable('save-stock-count',!stale&&!takeInvalidReasons()&&(!missing?.length||t.reasonType!=='other'||t.reason.trim().length>=5));save();
};
actions['take-review-filter']=b=>{takeReviewFilter=b.dataset.filter;takeReviewPage=0;render();};
actions['take-review-next']=()=>{takeReviewPage++;drawTakeReview();};
actions['take-review-prev']=()=>{takeReviewPage=Math.max(0,takeReviewPage-1);drawTakeReview();};
actions['save-stock-count']=()=>{
  if(!draft.stockCount?.length||document.querySelector('[data-action="save-stock-count"]')?.disabled)return;
  const t=stockTake();if(draft.stockCount.some(r=>{
    const p=products().find(p=>p.id===r.id);return !p||p.stock!==r.before||takeStale(p,t.entries[r.id]);
  })){navigate('stock-count');return;}
  rememberTakeHistory(draft.stockCount);
  for(const r of draft.stockCount){const p=products().find(p=>p.id===r.id);
    if(p.stock!==r.count){p.stock=r.count;stockMove(r.id,'Stock take adjustment',r.count-r.before,r.count);}}
  const reason=t.reasonType==='other'?t.reason:takeReasons[t.reasonType];
  s.stockTake=null;draft.stockCount=null;record('Stock take saved: '+(reason||'Counts matched'));
  result('Count saved.',note('Only counted products were updated. Earlier sales stay unchanged.'),'stock','Back to stock');
};
document.addEventListener('keydown',e=>{
  if(page!=='stock-count'||e.key!=='Enter')return;
  if(e.target.id==='take-search'){
    const first=document.querySelector('[data-take-id]');first?.focus();e.preventDefault();
  }else if(e.target.dataset.takeId){
    const inputs=[...document.querySelectorAll('[data-take-id]')],at=inputs.indexOf(e.target);
    const p=products().find(p=>p.id===e.target.dataset.takeId);
    if(parseQuantity(e.target.value,p.scale||1)===null)return;
    if(inputs[at+1])inputs[at+1].focus();
    else if((takePage+1)*20<takeMatches().length){takePage++;drawTakeList();document.querySelector('[data-take-id]')?.focus();}
    e.preventDefault();
  }
});
