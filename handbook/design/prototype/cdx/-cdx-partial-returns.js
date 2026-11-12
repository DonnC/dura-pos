// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

function returnReceipt(){
  const r=lastSale||receiptList()[0];lastSale=r;
  if(!r){screen.innerHTML=heading('No receipt to return.','Find the original saved sale first.','history');
    primary('history','Find a receipt');return null;}
  if(!canReturn(r)){
    screen.innerHTML=heading('Check the original payment.','This receipt cannot be refunded here.','receipt')+
      note('This design supports this till’s cash and kept-change payments in the same currency. Other payment types need their own return flow.');
    primary('receipt','Back to receipt');return null;
  }return r;
}
screens['return-items']=()=>{
  const r=returnReceipt();if(!r)return;const d=returnDraft(r),t=returnTally(r);
  screen.innerHTML=heading('What came back?','Choose only the quantities being returned.','receipt')+
    '<p class="micro">Original receipt · '+esc(r.id)+'</p><div class="return-layout"><section>'+
    r.items.map((i,n)=>{
      const left=i.qty-(t.qty[n]||0),p=products().find(p=>p.id===i.id),canRestock=p&&p.stock!==null;
      return `<section class="return-item"><div class="row"><h2>${esc(i.name)}</h2>
        <div class="return-original"><small>Original line</small>
        <strong>${money(i.lineTotal??lineAmount(i,i.qty),r.currency)}</strong></div></div>
        <p class="micro">Bought ${esc(quantityText(i,i.qty))} · ${money(i.cents,r.currency)} per ${esc(i.unit)}</p>
        <p class="micro">Still returnable: <strong>${esc(quantityText(i,left))}</strong></p>`+
        (left?field('return-qty-'+n,'Return quantity · '+esc(i.scale?i.measure:i.unit),d.qty[n]||'',
          `inputmode="decimal" placeholder="0" data-return-index="${n}"`)+
        `<label class="return-stock"><input type="checkbox" id="return-restock-${n}" data-return-index="${n}"
          ${d.restock[n]?'checked':''} ${canRestock?'':'disabled'}>
          <span>Put returned ${esc(i.name.toLowerCase())} back on shelf
          <small>${canRestock?'Leave off if damaged or not sellable.':'This product is not stock-tracked here.'}</small></span></label>`:
          '<p class="status-line">Already fully returned.</p>')+'</section>';
    }).join('')+'</section><section class="return-summary"><h2 class="section-title">This return</h2>'+
    '<div id="partial-summary" aria-live="polite"></div>'+
    select('partial-reason','Reason',option('','Choose a reason',!d.reason)+
      option('wrong','Wrong item / amount',d.reason==='wrong')+option('damaged','Damaged product',d.reason==='damaged')+
      option('other','Other',d.reason==='other'))+
    '<div id="partial-other-wrap">'+field('partial-other','Explain the other reason',d.other||'','maxlength="120"')+'</div>'+
    '<p class="error" id="partial-error" role="alert"></p>'+
    note('Original receipt prices apply. Nothing changes until the owner approves the review.')+'</section></div>';
  primary('return-review','Review return',true);drawPartialReturn();
};
function drawPartialReturn(){
  const p=returnPlan(lastSale);
  document.querySelector('#partial-other-wrap').hidden=p.d.reason!=='other';
  document.querySelector('#partial-summary').innerHTML=returnPaymentRows(p);
  document.querySelector('#partial-error').textContent=p.error;
  enable('return-review',!p.error&&!!p.d.reason&&(p.d.reason!=='other'||p.d.other?.trim().length>=3));
  document.querySelector('[data-action="return-review"] span').textContent=
    !p.lines.length?'Enter a return quantity':!p.error&&!p.d.reason?'Choose a reason below':'Review return · '+money(p.amount);
}
inputActions['return-items']=()=>{
  const d=returnDraft(lastSale);
  lastSale.items.forEach((i,n)=>{
    if(document.querySelector('#return-qty-'+n)){
      d.qty[n]=val('return-qty-'+n);d.restock[n]=document.querySelector('#return-restock-'+n).checked;
    }
  });d.reason=val('partial-reason');d.other=val('partial-other');save();drawPartialReturn();
};
actions['return-review']=()=>{const p=returnPlan(lastSale);if(!p.error&&p.d.reason&&
  (p.d.reason!=='other'||p.d.other?.trim().length>=3))navigate('return-review');};
screens['return-review']=()=>{
  const r=returnReceipt();if(!r)return;const p=returnPlan(r);
  if(p.error||!p.d.reason){navigate('return-items');return;}
  screen.innerHTML=heading('Check the return.','Original prices · Owner approval','return-items')+
    '<div class="return-layout"><section><h2 class="section-title">Returning now</h2>'+p.lines.map(l=>
      line(esc(l.item.name),money(l.amount),`${esc(quantityText(l.item,l.qty))} · ${l.restock?'Back on shelf':'Keep out of stock'}`)).join('')+
    line('Reason',esc(p.d.reason==='other'?p.d.other:{wrong:'Wrong item / amount',damaged:'Damaged product'}[p.d.reason]))+
    line('Original receipt',esc(r.id))+'</section><section>'+returnPaymentRows(p)+
    (p.kept?note('Restore the kept-change part to '+esc(p.customer.name)+'. Give only the cash amount shown. No extra cash replaces kept change.'):'')+
    (r.keptAdded?note('Change kept from the original sale stays owed to '+esc(r.customer)+'. This return refunds only the goods.'):'')+
    approvalField()+'<p class="error" id="return-save-error" role="alert"></p></section></div>';
  primary('return-save','Approve & save return',true);
};
inputActions['return-review']=()=>enable('return-save',val('approval-pin')==='123456');
actions['return-save']=()=>{
  if(val('approval-pin')!=='123456'||!s.returnDraft||!lastSale)return;
  const p=returnPlan(lastSale);if(p.error||!p.d.reason){
    document.querySelector('#return-save-error').textContent=p.error||'Choose a reason.';return;
  }
  if(p.lines.some(l=>l.restock&&!products().some(i=>i.id===l.item.id&&i.stock!==null))){
    document.querySelector('#return-save-error').textContent='Stock tracking changed. Go back and keep those items out of stock.';return;
  }
  const r=lastSale,reference='Practice return '+((s.returnSeq||0)+1);s.returnSeq=(s.returnSeq||0)+1;
  const tally={qty:[...p.prior.qty],amount:p.prior.amount+p.amount,kept:p.prior.kept+p.kept};
  for(const l of p.lines){
    tally.qty[l.index]+=l.qty;
    if(l.restock){const product=products().find(i=>i.id===l.item.id);product.stock+=l.qty;
      stockMove(product.id,reference,l.qty,product.stock);}
  }
  s.returnTotals=s.returnTotals||{};s.returnTotals[r.id]=tally;
  if(p.kept){keptMove(p.customer,p.kept,'Restored after return',reference);s.features.kept=true;}
  s.cash-=p.cash;s.sales-=p.amount;
  s.partialReturns=[{sale:r.id,reference,amount:p.amount,cash:p.cash,kept:p.kept,who:s.name,
    reason:p.d.reason==='other'?p.d.other:p.d.reason,
    lines:p.lines.map(l=>({name:l.item.name,quantity:quantityText(l.item,l.qty),restock:l.restock}))},
    ...(s.partialReturns||[])].slice(0,30);
  if(tally.qty.every((qty,n)=>qty===r.items[n].qty)){
    s.refunds=s.refunds||[];if(!s.refunds.includes(r.id))s.refunds.push(r.id);
  }
  s.returnDraft=null;record(reference+' linked to '+r.id);
  result('Return saved.',returnPaymentRows(p)+line('Linked receipt',esc(r.id))+
    note('Practice correction saved on this device. The original receipt stays unchanged.'),'receipt','View original receipt');
};
