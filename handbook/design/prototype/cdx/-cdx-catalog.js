// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// Catalog-only fixtures. Every mutation is local fictional preview data.
function prepareCoverageCase(c){
  if(c.base){
    draft.receive={id:'bread',qty:6,ref:'DEL-012',supplier:'Mambo Wholesale'};
    draft.stockCount=[{id:'bread',before:18,count:16}];
    draft.expense={kind:'expense',amount:200,note:'Bus fare'};
    draft.counted=7000;draft.countedZwg=0;draft.kept=1000;draft.keptZwg=0;
    draft.refund={reason:'wrong',restock:true};draft.setupCurrency='USD';draft.setupName='Practice shop';
    lastSale=receiptList()[0];
    if(c.screen==='invoice-detail')s.invoices=[{...invoiceDraft(),
      total:invoiceTotal(invoiceDraft()),paid:invoicePaid(invoiceDraft()),who:'Chipo'}];
    if(c.screen==='kept-refund-review')s.keptRefund={customer:'tariro',amount:'1.00'};
    if(c.screen==='return-review'){const d=returnDraft(lastSale);d.qty[0]='1';d.reason='wrong';}
    if(c.screen==='handover')s.active=false;
    if(c.screen==='discount-review'){
      selectedId='bread';s.discountDraft=null;const d=discountDraft();d.value='10';d.reason='Promotion';
    }
    page=c.screen;render();
  }
  if(c.setup==='empty-products'){s.products=[];s.basket={};render();}
  if(c.setup==='invoice-empty'){s.invoiceDraft={ref:'',items:[],mode:'later',paid:'',due:'',evidence:false};render();}
  if(c.setup==='invoice-saved'){s.invoices=[{...invoiceDraft(),total:invoiceTotal(invoiceDraft()),
    paid:invoicePaid(invoiceDraft()),who:'Chipo'}];render();}
  if(c.setup==='receipt-empty'){s.history=[];s.seedDay=false;render();}
  if(c.setup==='kept-other-currency'){keptState().currency='ZAR';render();}
  if(c.setup==='kept-no-balance'){keptContact().balance=0;render();}
  if(c.setup==='kept-cash-short'){s.cash=0;s.keptRefund={customer:keptContact().id,amount:'1.00'};render();}
  if(c.setup==='currency'){s.currency=c.value;render();}
  if(c.setup==='report-last7'){reportFilter().period='last7';render();}
  if(c.setup==='discount-review'){
    selectedId='bread';s.discountDraft=null;const d=discountDraft();d.value=c.value||'10';d.reason='Promotion';
    navigate('discount-review');
  }
  if(c.setup==='discount-applied')applyCoverageDiscount(c.screen);
  if(c.setup==='sale-continuity')prepareContinuityCase(c);
  if(c.setup==='long-data'){
    s.shop='Chipo’s groceries and household supplies at the front counter';
    products()[0].name='Wholegrain family bread with seeds and extra thick slices';
    products()[0].cents=999999999;s.basket={bread:1};render();
  }
  if(c.setup==='multi'){s.zwg=2700;s.features.multi=true;render();}
  if(c.setup==='count-review'){
    draft.counted=parseCents(c.value);draft.countUsd=c.value;draft.countedZwg=0;page=c.screen;render();
  }
  if(c.setup==='count-matched'){draft.stockCount=[{id:'bread',before:18,count:18}];page=c.screen;render();}
  if(c.setup==='sale-done'){
    lastSale={...receiptList().at(-1),method:c.value,received:500,change:c.value==='Cash'?150:0};
    navigate('done');
  }
  if(c.setup==='invoice-mode'){invoiceDraft().mode=c.value;render();}
  if(c.setup==='report-period'){reportFilter().period=c.value;render();}
  if(c.setup==='limited'){
    staffAccess().people[0].credit=false;staffAccess().people[0].kept=false;render();
  }
  if(c.setup==='kept-off'){s.features.kept=false;render();}
  if(c.input){
    const el=document.getElementById(c.input);if(!el)throw Error('Missing catalog input: '+c.input);
    el.value=c.value;el.dispatchEvent(new Event('input',{bubbles:true}));
  }
  if(c.reviewKind){
    const kind=c.reviewKind,flow=reviewFlows[kind];
    const values=kind==='receive'?{'receive-qty':'6','delivery-ref':'DEL-012'}:
      kind==='stock'?{'count-bread':'16'}:kind==='expense'?{'expense-amount':'2.00','expense-note':'Bus fare'}:
      {'counted-usd':'70.00'};
    for(const [id,value] of Object.entries(values)){
      const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));
    }
    actions[flow.next]();recoveredReviews.add(kind);
    if(c.variant==='stale'){
      if(kind==='receive'||kind==='stock')products()[0].stock++;else s.cash++;
    }
    render();
  }
  if(c.outcome)runCoverageOutcome(c.outcome);
}
function coverageInput(id,value){
  const el=document.getElementById(id);if(!el)throw Error('Missing outcome field: '+id);
  el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));
}
function applyCoverageDiscount(scene){
  selectedId='bread';s.discountDraft=null;const d=discountDraft();d.value='10';d.reason='Promotion';
  navigate('discount-review');if(s.role==='worker')coverageInput('approval-pin','123456');
  actions['discount-apply']();
  if(scene==='receipt'){received='5.00';completeSale('Cash',500,total());}
  navigate(scene);
}
function prepareContinuityCase(c){
  s.pending=[];s.paymentSeq=0;
  s.basket={bread:2,milk:1};applyCoverageDiscount('sell');
  if(c.value==='handover'){
    navigate('cashup');coverageInput('counted-usd',(s.cash/100).toFixed(2));
    actions['review-count']();actions['close-shift']();return;
  }
  sealPayment();
  if(c.value==='legacy')delete s.pending[0].quote;
  if(c.value==='retry'){
    products()[0].cents=120;actions['retry-pending']();return;
  }
  if(['current','saved'].includes(c.value)){
    s.basket={bread:1};applyCoverageDiscount('sell');received='2.00';rememberCashEntry();
  }
  navigate('pending');demoState=c.value==='quote'?'populated':'confirmed';render();
  if(c.value==='saved')actions['finish-mobile']();
  else{const quote=document.querySelector('.payment-quote');if(quote)quote.open=true;}
}
function runCoverageOutcome(kind){
  const run=action=>actions[action]({dataset:{}});
  if(reviewFlows[kind]){
    const flow=reviewFlows[kind],values=kind==='receive'?{'receive-qty':'6','delivery-ref':'DEL-012'}:
      kind==='stock'?{'count-bread':'16'}:kind==='expense'?{'expense-amount':'2.00','expense-note':'Bus fare'}:
      {'counted-usd':'70.50'};
    for(const [id,value] of Object.entries(values))coverageInput(id,value);
    run(flow.next);
    if(kind==='stock')coverageInput('count-reason','Damaged loaves removed');
    if(kind==='expense')coverageInput('approval-pin','123456');
    if(kind==='cashup')coverageInput('keep-float','10.00');
    run(flow.commit);return;
  }
  if(kind==='collection'){coverageInput('customer-amount','5.00');run('review-collection');run('save-collection');}
  if(kind==='invoice'){coverageInput('approval-pin','123456');run('invoice-save');}
  if(kind==='kept-refund'){
    coverageInput('kept-refund-amount','1.00');run('kept-review-refund');
    coverageInput('approval-pin','123456');run('kept-save-refund');
  }
  if(kind==='partial-return'){
    coverageInput('return-qty-0','1');coverageInput('partial-reason','wrong');
    run('return-review');coverageInput('approval-pin','123456');run('return-save');
  }
  if(kind==='full-return'){
    coverageInput('return-reason','wrong');run('review-refund');
    coverageInput('approval-pin','123456');run('save-refund');
  }
  if(kind==='access')run('access-confirm-remove');
  if(kind==='lost-phone')run('lost-phone-preview');
}
function openCoverageDialog(c){
  if(c.fixture==='discounted')applyCoverageDiscount('sell');
  if(c.fixture==='collection'){
    document.querySelector('#customer-amount').value='5.00';inputActions.customer();
  }
  if(c.fixture==='receipt'){lastSale=receiptList()[0];}
  if(c.fixture==='held'){s.held=[{basket:{bread:1},name:'Sale 1',amount:100}];}
  if(c.fixture==='measured'){s.basket={rice:750};render();}
  if(c.id==='basket-empty'){s.basket={};render();}
  if(c.fixture==='empty'&&c.id!=='basket-empty'){s.basket={};render();}
  const trigger=[...document.querySelectorAll(`[data-action="${c.action}"]`)]
    .find(el=>el.getClientRects().length);
  if(trigger)trigger.focus();else screen.focus();
  actions[c.action]({dataset:{index:'0'}});
  if(c.variant==='invalid')actions[c.fixture==='invoice'?'invoice-add-line':'kept-save-customer']();
}
document.addEventListener('DOMContentLoaded',()=>{
  const id=q.get('catalog');if(!id)return;
  const c=designCoverage.states.find(c=>c.id===id)||designCoverage.dialogs.find(c=>c.id===id);
  const route=id.startsWith('base-')?id.slice(5):'';
  const example=c||(Object.values(designCoverage.familyRoutes).flat().includes(route)?
    {id,screen:route,base:true}:null);
  if(!example)throw Error('Unknown design catalog example: '+id);
  prepareCoverageCase(example);
  if(example.fixture)openCoverageDialog(example);
  else if(example.action)actions[example.action]({dataset:example.data||{}});
  document.body.dataset.catalogReady=id;
});
