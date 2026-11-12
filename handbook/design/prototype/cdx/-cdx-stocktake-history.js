// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

Object.assign(takeReasons,{expired:'Expired goods',returns:'Return not yet recorded'});
const takeItemReason=id=>{
  const e=stockTake().entries[id];
  return e?.reasonType==='other'?e.reason?.trim():takeReasons[e?.reasonType]||'';
};
const takeInvalidReasons=()=>takeRows().some(r=>r.count!==r.before&&
  stockTake().entries[r.id]?.reasonType==='other'&&(takeItemReason(r.id)||'').length<5);
function drawTakeFeedback(p){
  const target=document.getElementById('take-feedback-'+p.id);if(!target)return;
  const e=stockTake().entries[p.id],n=e?.value!==''&&e?parseQuantity(e.value,p.scale||1):null;
  target.innerHTML=n===null?'':'<small class="'+(n!==e.before?'take-difference':'')+'">Counted '+
    esc(stockText(p,n))+(n===e.before?' · Matched':' · '+(n>e.before?'+':'')+esc(stockText(p,n-e.before)))+'</small>'+
    (n!==e.before?btn('take-item-reason',takeItemReason(p.id)?'Reason: '+esc(takeItemReason(p.id)):'Add reason',
      'text-button',`data-id="${esc(p.id)}"`):'');
}
// A single inline editor; counting never requires opening or saving a modal.
actions['take-item-reason']=b=>{
  const id=b.dataset.id,e=stockTake().entries[id],target=document.getElementById('take-feedback-'+id);
  target.innerHTML=select('take-item-kind','Reason for this difference',option('','Use reason at review',!e.reasonType)+
    Object.entries(takeReasons).map(([v,l])=>option(v,l,v===e.reasonType)).join(''))+
    '<div id="take-item-other" '+(e.reasonType==='other'?'':'hidden')+'>'+field('take-item-note','Explain the other reason',e.reason||'',
      'maxlength="120"')+'</div>'+btn('take-reason-done','Done','text-button',`data-id="${esc(id)}"`);
  target.dataset.editor=id;document.getElementById('take-item-kind').focus();
};
actions['take-reason-done']=b=>{
  const e=stockTake().entries[b.dataset.id];
  if(e.reasonType==='other'&&(e.reason||'').trim().length<5){document.getElementById('take-item-note').focus();return;}
  drawTakeFeedback(products().find(p=>p.id===b.dataset.id));
};
const countInput=inputActions['stock-count'];
inputActions['stock-count']=el=>{
  if(['take-item-kind','take-item-note'].includes(el?.id)){
    const id=el.closest('[data-editor]').dataset.editor,e=stockTake().entries[id];
    e.reasonType=val('take-item-kind');e.reason=val('take-item-note');
    document.getElementById('take-item-other').hidden=e.reasonType!=='other';save();return;
  }countInput(el);
};
const takeScreen=screens['stock-count'];
screens['stock-count']=()=>{
  takeScreen();screen.querySelector('.heading')?.insertAdjacentHTML('afterend',
    '<div class="take-history-link">'+btn('take-history','Past stock takes','text-button')+'</div>');
};
function rememberTakeHistory(rows){
  const t=stockTake(),fallback=t.reasonType==='other'?t.reason:takeReasons[t.reasonType];
  const lines=rows.map(r=>{const p=products().find(p=>p.id===r.id);
    return {...r,name:p.name,unit:p.unit,stockUnit:p.stockUnit,scale:p.scale,measure:p.measure,
      reason:r.count!==r.before?(takeItemReason(r.id)||fallback):''};});
  s.takeHistory=[{id:'ST-'+String((s.takeHistorySeq||0)+1).padStart(4,'0'),shop:s.shop,
    when:new Date().toISOString(),who:s.name,location:'Front counter',lines,
    counted:lines.length,differences:lines.filter(r=>r.before!==r.count).length,
    untouched:takeProducts().length-lines.length},...(s.takeHistory||[])].slice(0,10);
  s.takeHistorySeq=(s.takeHistorySeq||0)+1;
}
const takeHistory=()=>(s.takeHistory||[]).filter(h=>h.shop===s.shop);
let selectedTake='',takeHistoryPage=0,takeHistoryFilter='differences',takeHistorySearch='';
ownerScreens.add('take-history');ownerScreens.add('take-history-detail');
screens['take-history']=()=>{
  screen.innerHTML=heading('Past stock takes.','Front counter','stock-count')+
    (takeHistory().length?takeHistory().map(h=>btn('take-history-open',
      '<span><strong>'+esc(h.id)+'</strong><small>'+esc(new Date(h.when).toLocaleString('en-GB'))+' · '+esc(h.who)+
      '</small></span><span>'+h.counted+' counted<small>'+h.differences+' differences</small></span>',
      'take-history-row',`data-id="${esc(h.id)}"`)).join(''):
      '<div class="empty compact"><h2>No completed stock takes yet.</h2><p class="sub">Your current count stays in progress.</p></div>')+
    '<p class="micro">Last 10 stock takes saved on this device.</p>';
  primary('stock-count',stockTake()&&takeRows().length?'Resume stock take':'Start counting');
};
actions['take-history-open']=b=>{selectedTake=b.dataset.id;takeHistoryPage=0;takeHistorySearch='';
  takeHistoryFilter='differences';navigate('take-history-detail');};
screens['take-history-detail']=()=>{
  const h=takeHistory().find(h=>h.id===selectedTake)||takeHistory()[0];
  if(!h){navigate('take-history');return;}
  screen.innerHTML=heading(h.id+'.',new Date(h.when).toLocaleString('en-GB')+' · '+h.who,'take-history')+
    '<p class="sub">'+h.counted+' counted · '+h.differences+' differences · '+h.untouched+' untouched</p>'+
    '<div class="searchbox">'+icon('search')+'<input id="take-history-search" aria-label="Find a counted item" '+
      'placeholder="Find an item" value="'+esc(takeHistorySearch)+'"></div>'+
    '<div class="tabs">'+[['differences','Differences'],['all','All counted']].map(([v,l])=>
      btn('take-history-filter',l,'chip',`data-filter="${v}" aria-pressed="${v===takeHistoryFilter}"`)).join('')+'</div>'+
    '<div id="take-history-lines"></div><div id="take-history-pages" class="take-pagination"></div>';
  drawTakeHistory();primary('stock-count','Back to counting');
};
function drawTakeHistory(){
  const h=takeHistory().find(h=>h.id===selectedTake)||takeHistory()[0];
  const rows=h.lines.filter(r=>(takeHistoryFilter==='all'||r.count!==r.before)&&
    r.name.toLowerCase().includes(takeHistorySearch.toLowerCase()));
  takeHistoryPage=Math.min(takeHistoryPage,Math.max(0,Math.ceil(rows.length/20)-1));
  document.getElementById('take-history-lines').innerHTML=rows.slice(takeHistoryPage*20,(takeHistoryPage+1)*20)
    .map(r=>line(esc(r.name),esc(stockText(r,r.count)),
      'Before '+esc(stockText(r,r.before))+' · Difference '+esc(stockText(r,r.count-r.before))+
      (r.reason?' · '+esc(r.reason):''))).join('')||'<p class="sub">No matching items.</p>';
  document.getElementById('take-history-pages').innerHTML=btn('take-history-prev','Previous','secondary',takeHistoryPage?'':'disabled')+
    '<span>'+rows.length+' items</span>'+btn('take-history-next','Next 20','secondary',(takeHistoryPage+1)*20<rows.length?'':'disabled');
}
inputActions['take-history-detail']=()=>{takeHistorySearch=val('take-history-search');takeHistoryPage=0;drawTakeHistory();};
actions['take-history-filter']=b=>{takeHistoryFilter=b.dataset.filter;takeHistoryPage=0;render();};
actions['take-history-prev']=()=>{takeHistoryPage=Math.max(0,takeHistoryPage-1);drawTakeHistory();};
actions['take-history-next']=()=>{takeHistoryPage++;drawTakeHistory();};
