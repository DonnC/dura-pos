// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

screens.reports=()=>{
  const f=reportFilter();
  screen.innerHTML=btn('money',icon('back')+' Back','back')+'<div class="report-topline">'+
    heading('How is the shop doing?',reportExample?'Example locations · Saved snapshot':'Current till snapshot · This phone')+
    '<div class="report-filters">'+select('report-period','Period',[
      ['today','Today'],['yesterday','Yesterday'],['week','This week'],['custom','Choose dates']]
      .map(([v,l])=>option(v,l,f.period===v)).join(''))+
    select('report-place','Place',option('phone1','This phone',f.place==='phone1')+(reportExample?
      option('front','Front counter',f.place==='front')+option('market','Market stall',f.place==='market')+
      option('all','All example locations',f.place==='all'):'') )+'</div></div>'+
    (f.period==='custom'?'<div class="report-filters">'+
      field('report-start','From',f.start,`type="date" max="${reportToday}"`)+
      field('report-end','To',f.end,`type="date" max="${reportToday}"`)+'</div>':'')+
    '<p class="error" id="report-filter-error" role="alert"></p><div id="report-body"></div>';
  primary('report-sales','View sales breakdown');drawReport();
};
function drawReport(){
  const r=reportSelection(),body=document.querySelector('#report-body');
  document.querySelector('#report-filter-error').textContent=r.error||'';
  if(r.error){body.innerHTML=note('Choose a valid date range to see this report.');
    enable('report-sales',false);return;}
  if(['loading','error'].includes(demoState)){
    body.innerHTML='<div class="empty"><h2>'+ (demoState==='loading'?'Reading saved figures.':'Couldn’t read this snapshot.')+
      '</h2><p class="sub">Your cash selling and saved records are still available.</p>'+btn('report-retry',
      demoState==='loading'?'Show saved example':'Try saved figures again')+'</div>';enable('report-sales',false);return;
  }
  body.innerHTML=`<button class="report-coverage ${r.complete?'':'is-partial'}" data-action="report-coverage"
    id="report-coverage-summary">${icon(r.complete?'check':'clock')}<span>${esc(reportCoverageText(r))}
    <small>See phones and missing information</small></span>${icon('chevron')}</button>`+
    (!r.rows.length?'<div class="empty"><h2>No figures loaded.</h2><p class="sub">Missing records are unknown. '+
      'They do not mean there were no sales.</p>'+btn('report-reset','Show today on this phone')+'</div>':'')+
    '<div class="report-layout"><section><section class="hero report-hero"><p class="eyebrow">'+
      (r.complete?'Sales after returns':'Recorded sales after returns')+'</p><div class="amount-due" id="report-net">'+
      esc(reportMoney(r.net))+'</div><p class="sub hero-sub">'+esc(reportPeriod())+' · '+esc(reportPlace())+'</p></section>'+
    line('Sales recorded',r.count===null?'Not available':r.count+' sales')+
    '<div id="report-profit">'+line('Gross profit',reportMoney(r.profit),r.profit===null?
      'Buying costs or source records are missing.':'After cost of goods, before shop expenses.')+'</div></section>'+
    '<section><h2 class="section-title">Look closer</h2>'+menu('report-sales','Sales & returns',
      'Original sales, returned goods and the difference','receipt')+
    menu('report-cash','Cash in the drawers','Latest snapshot · Separate currencies and times','money')+
    menu('report-coverage','What is included?', 'Phones, dates and missing buying costs','phone')+
    note('These are sales records. Money collected from old debts, supplier payments and kept-change payouts are separate movements.')+
    '</section></div>';
  enable('report-sales',r.rows.length>0);
}
inputActions.reports=el=>{
  const f=reportFilter();f.period=val('report-period');f.place=val('report-place');
  if(document.querySelector('#report-start')){f.start=val('report-start');f.end=val('report-end');}
  save();if(el?.tagName==='SELECT')render();else drawReport();
};
actions['report-reset']=()=>{s.reportFilter={period:'today',place:'phone1',start:reportToday,end:reportToday};
  demoState='populated';save();render();};
actions['report-retry']=()=>{demoState='populated';drawReport();};
function reportDetailHeading(title,sub=''){
  return heading(title,sub||reportPeriod()+' · '+reportPlace(),'reports');
}
screens['report-sales']=()=>{
  const r=reportSelection();
  screen.innerHTML=reportDetailHeading('Sales & returns.')+
    '<div class="report-coverage is-partial">'+esc(reportCoverageText(r))+'</div>'+
    '<div class="report-layout"><section>'+line('Sales before returns',reportMoney(r.gross??null))+
    line('Goods returned',reportMoney(r.returns??null))+
    '<div class="report-total">'+line('Sales after returns',reportMoney(r.net??null))+'</div>'+
    line('Gross profit',reportMoney(r.profit??null),'Sales after returns − cost of goods. Shop expenses are separate.')+
    '</section><section><h2 class="section-title">By phone</h2>'+r.phones.map(p=>{
      const rows=r.rows.filter(row=>row.phone===p.id);
      return line(esc(p.name),rows.length?money(rows.reduce((sum,row)=>sum+row.net,0)):'Not available',
        esc(p.seen)+(rows.some(row=>row.state!=='current')?' · Older / local figures':''));
    }).join('')+note('Return amounts stay linked to their original sales. No cash payment or refund is made from this report.')+'</section></div>';
  primary('report-coverage','Check included records');
};
screens['report-cash']=()=>{
  const r=reportSelection(),drawers=reportDrawers();
  screen.innerHTML=reportDetailHeading('What cash is expected?','Latest drawer snapshots · '+reportPlace())+
    '<p class="warning">Drawer snapshots are separate from the sales period '+esc(reportPeriod())+'. Check each time below.</p>'+
    '<div class="report-layout">'+r.phones.map(p=>{
      const d=drawers[p.id];return '<section><h2 class="section-title">'+esc(p.name)+'</h2>'+
        '<p class="micro">As of '+esc(d.asof)+' · '+esc(d.state)+'</p>'+
        (d.balances?d.balances.map(b=>line('Expected cash · '+b.currency,money(b.amount,b.currency))).join(''):
          line('Expected cash','Not available','A missing drawer figure is not zero.'))+'</section>';
    }).join('')+'</div>'+note('Count each currency separately. Kept change in the drawer is owed to customers; it is not extra sales.');
  primary('reports','Back to report');
};
screens['report-coverage']=()=>{
  const r=reportSelection();
  screen.innerHTML=reportDetailHeading('What is included?')+
    '<div class="report-coverage is-partial">'+esc(reportCoverageText(r))+'</div>'+
    '<div class="report-layout"><section>'+r.phones.map(p=>{
      const rows=r.rows.filter(row=>row.phone===p.id),expected=r.range?.dates.length||0;
      return line(esc(p.name),!rows.length?'Missing':rows.length<expected?'Some days missing':
        rows.some(row=>row.state==='stale')?'Older figures':rows.some(row=>row.state==='local')?'Current till only':'Included',
        esc(p.place==='market'?'Market stall':'Front counter')+' · '+esc(p.seen)+
        ` · ${rows.length} of ${expected} daily updates`);
    }).join('')+'</section><section><h2 class="section-title">Before relying on the total</h2>'+
    line('Buying costs',r.profit==null?'Missing or incomplete':'Included for this period')+
    note('An older phone can have newer sales that are not in this view. Keep the recorded figures labelled until the missing records arrive.')+
    btn('report-refresh','Check for newer figures','secondary full')+'</section></div>';
  primary('reports','Back to report');
};
actions['report-refresh']=()=>showSheet('No new figures received',
  '<p class="sub">No Shop Hub is connected in this prototype. The saved figures, missing phones and timestamps remain as shown.</p>',
  btn('close','Keep the saved view','primary'));
