// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

const sellCategories=()=>['Favourites','All items',...new Set(products().map(p=>p.cat).filter(Boolean))];
const inSellCategory=(p,i,c)=>c==='Favourites'?(p.favourite??i<12):c==='All items'||p.cat===c;
screens.sell=()=>{
  screen.innerHTML=`<div class="sell-tools"><div class="row heading"><h1>Let’s sell.</h1>
    ${btn('sale-options',icon('down'),'scan','aria-label="Sale options"')}</div>
    ${!s.active?`<p class="warning">Your till is closed. Open it before the next sale.
    ${btn('opening','Open till','text-button')}</p>`:''}
    <div class="search"><div class="searchbox">${icon('search')}
    <input id="search" aria-label="Find a product" placeholder="Find a product"
      value="${esc(search)}"></div>${btn('scan',icon('scan'),'scan','aria-label="Scan barcode"')}</div>
    <div class="tabs" aria-label="Product categories">${sellCategories()
      .map(c=>btn('category',c+' <span class="category-count">'+products().filter((p,i)=>inSellCategory(p,i,c)).length+'</span>',
        'chip',`data-category="${c}" aria-pressed="${c===category}"`)).join('')}</div></div>
    <div class="catalog" id="catalog"></div>
    ${btn('quick',icon('plus')+' Sell an unlisted item','quick')}
    ${s.held.length?btn('held',`${s.held.length} held ${s.held.length===1?'sale':'sales'} · Resume`,'quick'):''}
    ${s.pending.length?btn('pending',`${s.pending.length} unconfirmed payment · Check`,'quick'):''}`;
  drawCatalog();drawBasket();
};
function drawCatalog(){
  const el=document.querySelector('#catalog');
  if(demoState!=='populated'){
    const states={loading:['Getting the shelf ready.','Loading products saved on this device.','retry','Show loaded shelf'],
      empty:['Your shelf starts here.','Add one product, or sell an unlisted item.','product-edit','Add first product'],
      error:['Couldn’t load products.','Your basket is safe. Try the local catalogue again.','retry','Try again'],
      interrupted:['Your sale is still here.','Pick up the basket you left on this device.','retry','Continue sale']};
    const [t,c,a,l]=states[demoState]||states.error;
    el.innerHTML=`<div class="empty"><h2>${t}</h2><p class="sub">${c}</p>${btn(a,l)}</div>`;
    el.classList.add('single');return;
  }
  el.classList.remove('single');
  const matches=products().filter((p,i)=>(search||inSellCategory(p,i,category))&&
    p.name.toLowerCase().includes(search.toLowerCase()));
  el.classList.toggle('many-products',matches.length>4);
  el.innerHTML=matches.map(p=>`<button class="product ${s.basket[p.id]?'selected':''}"
    data-action="add" data-id="${p.id}" aria-label="Add ${esc(p.name)}, ${money(p.cents)}, ${esc(p.unit)}">
    <div class="art">${p.short?'<span class="product-monogram">'+esc(p.short)+'</span>':art(p.id)}</div>${s.basket[p.id]?`<span class="count">${p.scale?quantityText(p,s.basket[p.id]):s.basket[p.id]}</span>`:''}
    <div class="product-text"><span class="product-name">${esc(p.name)}</span>
    <span class="unit">${esc(p.unit)}</span>${typeof activeLineDiscount==='function'&&activeLineDiscount(p)?
      '<span class="discount-badge">Discount in basket</span>':''}<span class="price">${money(p.cents)}</span></div>
    <span class="add">${icon('plus')}</span></button>`).join('')||
    `<div class="empty"><h2>No products found.</h2><p class="sub">Try a shorter name.</p>
    ${btn('clear-search','Show all products')}</div>`;
}
function drawBasket(){
  dock.innerHTML=`<div class="basket-top">${btn('basket',`${icon('sell')} ${count()}
    ${count()===1?'item':'items'} in basket ${icon('down')}`,'basket-link')}
    <span class="micro">${s.currency} prices</span></div>`+
    btn(s.active?'pay':'opening',`<span>${s.active?'Take payment':'Open till'} ${icon('arrow')}</span>
    <span class="total">${money(total())}</span>`,'primary',s.active&&!count()?'disabled':'');
}
actions.add=b=>{const id=b.dataset.id;
  if(products().find(p=>p.id===id)?.scale){selectedId=id;navigate('quantity');return;}
  s.basket[id]=Math.min(99,(s.basket[id]||0)+1);
  save();drawCatalog();drawBasket();toast('Added to basket');};
actions.category=b=>{category=b.dataset.category;screens.sell();};
actions['clear-search']=()=>{search='';category='All items';screens.sell();};
actions.retry=()=>{demoState='populated';screens.sell();};
inputActions.sell=el=>{if(el.id==='search'){search=el.value;drawCatalog();}};
actions['sale-options']=()=>showSheet('This sale',
  menu('held','Held sales',`${s.held.length} waiting`,'clock')+
  menu('history','Recent sales','Find a receipt or request a return','receipt')+
  (count()?menu('hold','Hold this sale','Keep it while serving someone else','clock')+
    menu('clear-basket','Clear this basket','Undo is available','close'):''));
actions.basket=()=>showSheet('Your basket',basketRows().map(p=>
  `<div class="ledger-row"><div class="grow"><strong>${esc(p.name)}</strong>
  <small>${money(p.cents)} · ${esc(p.unit)}</small></div>${p.scale?
  btn('quantity-edit',esc(quantityText(p,s.basket[p.id]))+' · Edit','secondary',`data-id="${p.id}"`):`<div class="stepper">
  ${btn('minus','−','',`data-id="${p.id}" aria-label="Remove one ${esc(p.name)}"`)}
  <span>${p.scale?quantityText(p,s.basket[p.id]):s.basket[p.id]}</span>${btn('plus','+','',`data-id="${p.id}" aria-label="Add one ${esc(p.name)}"`)}</div>`}</div>`
  ).join('')+line('Total',money(total()))+
  (count()?btn('hold','Hold sale','text-button'):'<p class="sub">Add a product to start.</p>'),
  (undoBasket?btn('undo','Undo last quantity change','text-button full'):'')+
  btn('close','Keep selling','primary'));
for(const a of ['plus','minus'])actions[a]=b=>{
  undoBasket={...s.basket};const id=b.dataset.id;
  s.basket[id]=Math.max(0,Math.min(99,(s.basket[id]||0)+(a==='plus'?1:-1)));
  save();actions.basket();drawCatalog();drawBasket();if(!s.basket[id])toast('Item removed',true);
};
actions['clear-basket']=()=>{resetBasket();navigate('sell');toast('Basket cleared',true);};
actions.hold=()=>{
  if(!count())return;if(s.held.length===3){toast('Resume a held sale first. Three can wait here.');return;}
  s.held.push({basket:{...s.basket},name:`Sale ${s.held.length+1}`,amount:total()});
  s.basket={};save();navigate('sell');toast('Sale held. Ready for the next customer.');
};
actions.held=()=>showSheet('Held sales',s.held.length?s.held.map((h,i)=>menu('resume-held',
  `${esc(h.name)} · ${money(h.amount)}`,'Tap to put it back in the basket','clock',`data-index="${i}"`)).join(''):
  '<p class="sub">Nothing waiting. Hold a basket from Sale options.</p>');
actions['resume-held']=b=>{
  if(count()){toast('Hold or clear the current basket first.');return;}
  s.basket=s.held.splice(Number(b.dataset.index),1)[0].basket;save();navigate('sell');
};
screens.quick=()=>{
  screen.innerHTML=heading('An unlisted item.','A one-off sale, without adding to your shelf.','sell')+
    field('quick-name','What are you selling?','','maxlength="60" placeholder="e.g. Device charging"')+
    field('quick-price',`Price · ${s.currency}`,'','inputmode="decimal" placeholder="0.00"')+
    note('One unit. To sell this regularly, ask the owner to add a product.');
  primary('quick-add','Add to basket',true);
};
inputActions.quick=()=>enable('quick-add',val('quick-name')&&validAmount('quick-price'));
actions['quick-add']=()=>{
  if(products().length>=40){toast('Practice catalogue limit reached.');return;}
  const id=`item${products().length}`;products().push({id,name:val('quick-name'),unit:'1 item',
    stockUnit:'items',stock:null,cents:parseCents(val('quick-price')),cat:'Food',oneOff:true});
  s.basket[id]=1;save();navigate('sell');
};
actions.scan=()=>showSheet('Scan a product',`<div class="scan-frame">${icon('scan')}</div>
  <p class="sub center">Point at the barcode on the pack.</p>
  <p class="micro center">Camera preview only. Use the sample result below.</p>`,
  btn('scan-result','Bread · '+money(100),'primary'));
actions['scan-result']=()=>{navigate('sell');actions.add({dataset:{id:'bread'}});};
screens.pay=()=>{
  if(!count()){navigate('sell');return;}
  screen.innerHTML=heading('Take payment','Walk-in customer · '+count()+' items','sell')+
    (s.paymentRecovery?.key===cashDraftKey()&&s.paymentRecovery.current===total()?
      '<p class="warning" id="payment-recovery">Previous payment failed. Prices changed: the request was '+
      money(s.paymentRecovery.amount)+'. Check the current total before taking payment.</p>':'')+
    `<div class="amount-due"><span>${s.currency}</span>${(total()/100).toFixed(2)}</div>
    <div class="payment-tabs">${btn('cash',icon('cash')+' Cash','active')}
    ${s.features.mobile?btn('mobile',icon('phone')+' Mobile money'):''}</div>
    <label for="received">Cash received<div class="field"><span>${s.currency}</span>
    <input id="received" inputmode="decimal" autocomplete="off" placeholder="0.00"
    value="${esc(received)}" aria-describedby="payment-error change-copy"></div></label>
    <div class="suggestions">${[total(),500,1000].filter((n,i,a)=>n>=total()&&a.indexOf(n)===i)
      .map(n=>btn('tender',n===total()?'Exact':money(n),'',`data-cents="${n}"`)).join('')}</div>
    <div id="payment-error" class="error" role="alert"></div>
    <div class="change row" id="change-copy"><span>Change to give</span><strong id="change">${money(0)}</strong></div>
    ${s.features.kept&&staffPermission('kept')?'<div class="kept-options">'+btn('kept-checkout','Use a customer’s kept change','secondary full')+
      btn('kept-keep','Keep this change','text-button full')+'</div>':''}
    ${s.features.credit&&staffPermission('credit')?btn('credit','Put on a customer’s account','text-button full'):''}
    ${s.features.multi&&s.currency==='USD'?btn('mixed','Pay with USD + ZWG','text-button full'):''}`;
  primary('complete','Save sale');updateChange();
};
function updateChange(){
  const n=parseCents(received),short=n!==null&&n<total();
  document.querySelector('#received').setAttribute('aria-invalid',String(!!received&&(n===null||short)));
  document.querySelector('#change').textContent=money(Math.max(0,(n||0)-total()));
  document.querySelector('#payment-error').textContent=short?`${money(total()-n)} still needed`:
    received&&n===null?'Use an amount with up to two decimal places.':'';
  enable('complete',n!==null&&!short);
  if(s.features.kept)enable('kept-keep',n!==null&&n>total());
}
inputActions.pay=el=>{if(el.id==='received'){received=el.value;updateChange();}};
actions.tender=b=>{received=(Number(b.dataset.cents)/100).toFixed(2);
  document.querySelector('#received').value=received;updateChange();};
actions.cash=()=>navigate('pay');
actions.complete=()=>{const n=parseCents(received);if(n===null||n<total())return;
  completeSale('Cash',n,total());};
function completeSale(method,tender,cashDelta,extra={}){
  const amount=extra.amount??total();s.saleSeq++;
  lastSale={id:`T-P1-S261110-${String(s.saleSeq).padStart(4,'0')}`,
    items:saleSnapshot(),amount,received:tender,change:method==='Cash'?tender-amount:0,
    method,who:s.name,status:'Saved on device',currency:s.currency,
    ...(typeof saleDiscountSummary==='function'?saleDiscountSummary():{}),...extra};
  if(method==='On account'){lastSale.customer='Tariro';s.owed+=amount;
    accountMove('customer','Sale on account',amount,lastSale.id);}
  s.cash+=cashDelta;s.sales+=amount;s.saleCount++;
  for(const p of basketRows())if(p.stock!==null){p.stock-=s.basket[p.id];
    stockMove(p.id,'Sale',-s.basket[p.id],p.stock);}
  s.history.unshift(lastSale);s.last=lastSale;s.basket={};s.keptCheckout=null;s.paymentRecovery=null;
  received='';save();navigate('done');
}
screens.done=()=>{
  if(!lastSale){navigate('history');return;}
  screen.innerHTML=`<section class="receipt"><div class="success-icon">${icon('check')}</div>
    <p class="eyebrow">Sale saved</p><h1>All sorted.</h1>
    <p class="sub">${lastSale.method==='Cash'?'Give the customer their change.':esc(lastSale.method)}</p>
    <div class="change"><p class="micro">${lastSale.method==='Cash'?'CHANGE TO GIVE':'SALE TOTAL'}</p>
    <div class="amount-due">${money(lastSale.method==='Cash'?lastSale.change:lastSale.amount)}</div></div>
    <div class="receipt-details">${line('Sale total',money(lastSale.amount))}
    ${line('Payment',esc(lastSale.method))}${keptReceiptRows(lastSale)}</div></section>
    <p class="status-line">${icon('check')}Saved on this device · Practice</p>
    <p class="status-line wait">${icon('clock')}Not uploaded · No fiscal receipt issued</p>
    ${btn('receipt','View receipt','secondary full')}`;
  primary('next',count()?'Return to current sale':'Next customer');
};
actions.next=()=>navigate('sell');
screens.mobile=()=>{
  screen.innerHTML=heading('Mobile money.',money(total())+' · Practice payment','pay')+
    select('provider','Provider',option('ecocash','EcoCash'))+
    field('payment-phone','Customer’s mobile number','','type="tel" maxlength="15" placeholder="07…"')+
    note('Ask the customer to approve on their device. A screenshot is not confirmation.')+
    (offline?'<p class="warning">You’re offline. Take cash or hold this sale until connected.</p>':'');
  primary('request-payment','Request practice payment',true);
};
inputActions.mobile=()=>enable('request-payment',!offline&&/^0[0-9]{9}$/.test(val('payment-phone')));
function sealPayment(){
  if(!count())return false;
  if(s.pending.length>=3){toast('Check an unconfirmed payment before requesting another.');return false;}
  s.paymentSeq=(s.paymentSeq||0)+1;
  s.pending.push({basket:{...s.basket},amount:total(),ref:`T-PAY-${String(s.paymentSeq).padStart(4,'0')}`,
    lineDiscounts:structuredClone(s.lineDiscounts||{}),
    quote:{items:saleSnapshot(),amount:total(),who:s.name,currency:s.currency,
      ...saleDiscountSummary()}});
  s.basket={};save();return true;
}
actions['request-payment']=()=>{if(sealPayment())navigate('pending');};
screens.pending=()=>{
  if(!s.pending.length&&!sealPayment()){navigate('sell');return;}
  const payment=s.pending[0];
  const confirmed=demoState==='confirmed',failed=demoState==='failed';
  const missingQuote=confirmed&&!payment.quote;
  screen.innerHTML=heading(missingQuote?'Review payment details.':confirmed?'Payment confirmed.':failed?'Payment failed.':'Waiting for payment.',
    'Practice provider · '+money(payment.amount))+
    `<div class="empty">${icon(confirmed?'check':'clock')}<h2>${missingQuote?'Keep this payment reference':confirmed?'Ready to finish':
      failed?'No money collected':'Ask the customer to approve'}</h2>
    <p class="sub">${confirmed?'Confirmed by the practice provider.':failed?
      'Choose cash or try mobile money again.':'Not paid yet. Don’t take another payment for this sale.'}</p></div>`+
    note(`Reference ${payment.ref} · Rechecking uses this same reference. No live provider is connected.`)+
    (missingQuote?'<p class="warning">Item details are missing from this older preview request. '+
      'Keep the reference and ask the owner to review. Do not collect payment again.</p>':'')+
    (payment.quote?'<details class="payment-quote"><summary>Items in this payment</summary>'+
      summaryRows(payment.quote.items)+line('Requested amount',money(payment.amount,payment.quote.currency))+
      '</details>':'')+
    (!confirmed&&!failed?btn('sell','Keep pending · Serve next customer','secondary full'):'');
  primary(missingQuote?'sell':confirmed?'finish-mobile':failed?'retry-pending':'check-payment',
    missingQuote?'Keep pending · Back to selling':confirmed?'Save practice sale':failed?'Choose another payment':'Check payment');
};
actions['check-payment']=()=>toast('Still waiting. No payment confirmed.');
actions['finish-mobile']=()=>{
  if(!s.pending[0]?.quote)return;
  const pending=s.pending.shift();
  const current={basket:s.basket,lineDiscounts:s.lineDiscounts||{},cashDraft:s.cashDraft,
    keptCheckout:s.keptCheckout,paymentRecovery:s.paymentRecovery,received};
  s.basket=pending.basket;s.lineDiscounts=pending.lineDiscounts||{};
  completeSale('Mobile money',pending.amount,0,{...pending.quote,providerRef:pending.ref});
  Object.assign(s,{basket:current.basket,lineDiscounts:current.lineDiscounts,
    cashDraft:current.cashDraft,keptCheckout:current.keptCheckout,paymentRecovery:current.paymentRecovery});
  received=current.received;save();render();
};
actions['retry-pending']=()=>{
  if(count()){toast('Hold the current basket before returning to this payment.');return;}
  const pending=s.pending.shift();s.basket=pending.basket;s.lineDiscounts=pending.lineDiscounts||{};
  save();s.paymentRecovery=total()!==pending.amount?
    {key:cashDraftKey(),amount:pending.amount,current:total()}:null;save();
  navigate('pay');
};
screens.credit=()=>{
  screen.innerHTML=heading('Put it on account.','Name the person before saving.','pay')+
    select('credit-customer','Customer',option('','Choose a customer')+option('tariro','Tariro'))+
    line('This sale',money(total()))+line('Tariro already owes',money(s.owed))+
    note('The balance increases. No cash goes into the drawer. Credit is enabled by the owner.');
  primary('save-credit','Save on account',true);
};
inputActions.credit=()=>enable('save-credit',!!val('credit-customer'));
actions['save-credit']=()=>completeSale('On account',0,0);
screens.mixed=()=>{
  screen.innerHTML=heading('USD + ZWG cash.','Rate shown before you accept the money.','pay')+
    `<div class="warning">Practice rate · USD 1.00 = ${money(s.rateMinor,'ZWG')}<br>Example only; not a live rate.</div>`+
    field('mixed-usd','Cash in USD','','inputmode="decimal" placeholder="0.00"')+
    field('mixed-zwg','Cash in ZWG','','inputmode="decimal" placeholder="0.00"')+
    line('Sale total',money(total()))+`<p class="change" id="mixed-due">Enter both amounts. Use 0 if none.</p>`+
    note('This lean preview supports an exact split. Overpayments need an explicit change currency in production.');
  primary('save-mixed','Save split payment',true);
};
inputActions.mixed=()=>{
  const usd=parseCents(val('mixed-usd')),zwg=parseCents(val('mixed-zwg'));
  const paid=usd!==null&&zwg!==null?BigInt(usd)*BigInt(s.rateMinor)+BigInt(zwg)*100n:null;
  const left=paid===null?null:BigInt(total())*BigInt(s.rateMinor)-paid;
  const due=left!==null&&left>0n?(left+99n)/100n:0n;
  document.querySelector('#mixed-due').textContent=left===null?'Enter both amounts.':
    left===0n?'Exact payment. No change to give.':left>0n?
    `ZWG ${due/100n}.${String(due%100n).padStart(2,'0')} still needed`:
    'Overpayment: adjust the split to the exact amount.';
  enable('save-mixed',left===0n);
};
actions['save-mixed']=()=>{
  const usd=parseCents(val('mixed-usd')),zwg=parseCents(val('mixed-zwg'));s.zwg+=zwg;
  completeSale('Split cash',total(),usd,{rateMinor:s.rateMinor,
    payments:[{currency:'USD',amount:usd},{currency:'ZWG',amount:zwg}]});
};
