// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

const ownerReportRoutes=['report-trend','report-products','report-cashiers','report-discounts'];
ownerReportRoutes.forEach(route=>ownerScreens.add(route));
function ownerReportFilters(){
  const f=reportFilter();return '<div class="report-filters">'+select('report-period','Period',[
    ['today','Today'],['yesterday','Yesterday'],['week','This week'],['last7','Last 7 days'],['month','This month'],['custom','Choose dates']]
    .map(([v,l])=>option(v,l,f.period===v)).join(''))+
    select('report-place','Place',option('phone1','This device',f.place==='phone1')+(reportExample?
      option('front','Front counter',f.place==='front')+option('market','Market stall',f.place==='market')+
      option('all','All locations',f.place==='all'):'') )+'</div>'+
    (f.period==='custom'?'<div class="report-filters">'+field('report-start','From',f.start,'type="date"')+
      field('report-end','To',f.end,'type="date"')+'</div>':'');
}
function ownerDetailScreen(route,title){
  screen.innerHTML=btn('reports',icon('back')+' Back','back')+
    '<div class="report-topline">'+heading(title,reportPeriod()+' · '+reportPlace())+ownerReportFilters()+'</div>'+
    '<div id="owner-report-body"></div>';drawOwnerReport(route);primary('report-coverage','Check included records');
}
function drawOwnerReport(route){
  const r=reportSelection(),body=document.querySelector('#owner-report-body');
  if(r.error){body.innerHTML='<p class="error" role="alert">'+esc(r.error)+'</p>';return;}
  let content='<div class="report-coverage">'+esc(reportCoverageText(r))+'</div>';
  if(route==='report-trend'){
    content+='<div class="report-layout"><section>'+ownerReportChart(ownerDailyReport(r),'Sales by day')+
      '</section><section><h2 class="section-title">Recorded performance</h2>'+
      line('Recorded sales after returns',reportMoney(r.net))+
      line('Gross profit',reportMoney(r.profit),'After buying costs; before shop expenses.')+
      line('Sales before returns',reportMoney(r.gross))+line('Returns',reportMoney(r.returns))+
      note('Select a period or location to compare its recorded days. Missing devices stay visible; a gap is not a zero-sales day.')+
      menu('report-products','Products','What sold, discounts and known buying costs','stock')+
      menu('report-cashiers','Cashiers','Recorded sales by person, not by device','people')+'</section></div>';
  }else{
    const key=route==='report-products'?'name':route==='report-cashiers'?'cashier':'reason';
    let groups=ownerGroupedItems(r,key);if(route==='report-discounts')groups=groups.filter(g=>g.discount>0);
    if(!groups.length)content+='<div class="empty"><h2>No detail available.</h2><p class="sub">Only saved item records can provide this breakdown.</p></div>';
    else{
      content+=ownerReportChart(groups.map(g=>({label:g.label,amount:route==='report-discounts'?g.discount:g.net,
        incomplete:!r.complete})),route==='report-products'?'Net sales by product':route==='report-cashiers'?'Net sales by cashier':'Discounts by reason');
      content+='<div class="report-table-scroll"><table><thead><tr><th>'+({name:'Product',cashier:'Cashier',reason:'Reason'}[key])+
        '</th>'+(key==='name'?'<th>Net quantity</th>':'')+'<th>Net sales</th><th>Discounts granted</th>'+
        (key==='name'?'<th>Gross profit</th>':'')+'</tr></thead><tbody>'+groups.map(g=>'<tr><th scope="row">'+esc(g.label)+'</th>'+
        (key==='name'?'<td>'+esc(decimalQuantity(g.qty,g.scale))+' '+esc(g.unit)+'</td>':'')+
        '<td>'+money(g.net)+'</td><td>'+money(g.discount)+'</td>'+(key==='name'?'<td>'+reportMoney(g.cost===null?null:g.net-g.cost)+'</td>':'')+'</tr>').join('')+
        '</tbody></table></div>';
    }
    content+=note(route==='report-discounts'?'Discounts granted on original sales; returned goods are reported separately. No second discount is subtracted.':
      route==='report-cashiers'?'Attribution uses the recorded cashier. A shared device does not identify a person.':
      'Gross profit requires known buying costs. Missing cost is not zero; these figures exclude shop expenses.');
    if(!reportExample)content+=note('Item detail covers saved receipts available on this device. Earlier seeded figures may have no item records.');
  }
  body.innerHTML=content;
  if(typeof applyScreenLayout==='function')applyScreenLayout();
}
for(const [route,title] of [['report-trend','Sales trend.'],['report-products','Products.'],
  ['report-cashiers','Cashiers.'],['report-discounts','Discounts.']]){
  screens[route]=()=>ownerDetailScreen(route,title);
  inputActions[route]=el=>{
    const f=reportFilter();f.period=val('report-period');f.place=val('report-place');
    if(document.querySelector('#report-start')){f.start=val('report-start');f.end=val('report-end');}
    save();if(el?.tagName==='SELECT')render();else drawOwnerReport(route);
  };
}
const originalOwnerDrawReport=drawReport;
if(['today','yesterday','week','last7','month','custom'].includes(q.get('period')))reportFilter().period=q.get('period');
drawReport=()=>{
  originalOwnerDrawReport();const body=document.querySelector('#report-body'),r=reportSelection();
  if(!body||r.error||['loading','error'].includes(demoState))return;
  body.querySelector('.report-layout>section')?.insertAdjacentHTML('beforeend',ownerReportChart(ownerDailyReport(r),'Recorded sales by day'));
  body.querySelector('.report-layout>section:last-child h2')?.insertAdjacentHTML('afterend',
    menu('report-trend','Sales trend','Daily graph, returns and known profit','receipt')+
    menu('report-products','Products','Quantities, sales, discounts and known profit','stock')+
    menu('report-cashiers','Cashiers','Recorded sales by person','people')+
    menu('report-discounts','Discounts','What was granted and why','money'));
};
