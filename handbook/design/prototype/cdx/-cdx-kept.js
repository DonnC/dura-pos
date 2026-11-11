// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

screens['kept-customers']=()=>{
  if(!keptGate())return;
  screen.innerHTML=heading('Kept change.','Small change the shop owes customers.','money')+
    line('Kept at this till',keptMoney(keptState().contacts.reduce((sum,c)=>sum+c.balance,0)))+
    keptState().contacts.map(c=>menu('kept-open',esc(c.name),
      keptMoney(c.balance)+' kept here','people',`data-id="${c.id}"`)).join('')+keptContextNote();
};
actions['kept-open']=b=>{s.keptSelected=b.dataset.id;s.keptCheckout=null;save();navigate('kept-account');};
screens['kept-account']=()=>{
  if(!keptGate())return;const c=keptContact();
  let balance=c.opening;
  const moves=c.moves.map(m=>{balance+=m.delta;return {...m,balance};});
  screen.innerHTML=heading(esc(c.name)+'’s change.','Front counter · '+keptState().currency,'kept-customers')+
    '<div class="hero"><p class="eyebrow">The shop owes '+esc(c.name)+'</p>'+
    '<div class="amount-due">'+keptMoney(c.balance)+'</div></div>'+
    '<div class="kept-layout"><section>'+keptContextNote()+
    btn('kept-refund','Give cash back','secondary full',!c.balance||!keptAllowed()?'disabled':'')+
    '<p class="micro">Cash back needs owner approval. It is not a returned sale.</p></section>'+
    '<section><h2 class="section-title">Activity</h2>'+line('Opening kept change',keptMoney(c.opening))+
    (moves.length?moves.slice().reverse().map(m=>line(esc(m.label),
      (m.delta>0?'+ ':'− ')+keptMoney(Math.abs(m.delta)),
      `${esc(m.who)} · ${esc(m.reference)} · left ${keptMoney(m.balance)}`)).join(''):
      '<p class="sub">No new activity on this phone yet.</p>')+'</section></div>';
  const use=count()>0&&c.balance>0&&keptAllowed();
  primary(use?'kept-checkout':count()?'pay':'sell',
    use?'Use with current basket':count()?'Pay with cash instead':'Start a sale');
};
screens['kept-checkout']=()=>{
  if(!keptGate())return;if(!count()){navigate('sell');return;}
  const d=keptCheckout();s.keptSelected=d.customer;
  screen.innerHTML=heading('Use kept change.','Sale total · '+money(total()),'pay')+
    '<div class="kept-layout"><section>'+keptPicker(d.customer)+
    '<div class="kept-use-row">'+
    field('kept-use',`Use for this sale · ${s.currency}`,d.use,'inputmode="decimal"')+
    btn('kept-use-max','Use maximum','secondary')+'</div>'+
    '<div id="kept-mobile-needed" class="kept-highlight" aria-live="polite"></div>'+
    field('kept-cash',`Cash received now · ${s.currency}`,d.cash,'inputmode="decimal" placeholder="0.00"')+
    '<p class="error" id="kept-error" role="alert"></p>'+btn('pay','Pay with cash instead','text-button full')+
    '</section><section class="kept-summary"><h2 class="section-title">This payment</h2>'+
    '<div id="kept-payment-summary" aria-live="polite"></div></section></div>';
  primary('kept-save-sale','Save practice sale',true);drawKeptCheckout();
};
function keptCheckoutValues(){
  const d=keptCheckout(),c=keptContact(d.customer),use=parseCents(d.use);
  const cash=d.cash===''&&use===total()?0:parseCents(d.cash);
  const error=!s.active?'Open the till before saving a sale.':!keptAllowed()?'Balance unavailable here. Take cash instead.':
    use===null||use<=0?'Enter how much kept change to use.':use>c.balance?
    `Only ${keptMoney(c.balance)} is kept for ${c.name}.`:use>total()?'Use no more than this sale total.':
    cash===null?'Enter the cash received, or use kept change for the whole sale.':
    cash<total()-use?`${money(total()-use-cash)} cash still needed.`:'';
  return {d,c,use,cash,error};
}
function drawKeptCheckout(){
  const {c,use,cash,error}=keptCheckoutValues();
  const usable=use!==null&&use>0&&use<=c.balance&&use<=total();
  document.querySelector('#kept-mobile-needed').innerHTML=line('Cash needed',usable?money(total()-use):'Check amount');
  document.querySelector('#kept-payment-summary').innerHTML=line('Sale total',money(total()))+
    line('Kept change used',usable?money(use):'Check amount')+
    '<div class="kept-highlight">'+line('Cash needed',usable?money(total()-use):'Check amount')+'</div>'+
    line('Change to give',usable&&cash!==null?money(Math.max(0,cash-(total()-use))):money(0))+
    line('Kept here after sale',usable?keptMoney(c.balance-use):'Unchanged')+
    '<p class="micro">Stock and sales change once when you save. Only the new cash goes into this till.</p>';
  document.querySelector('#kept-error').textContent=error;
  enable('kept-save-sale',!error);
}
inputActions['kept-checkout']=el=>{
  const d=keptCheckout();
  if(el.id==='kept-customer'){
    d.customer=val('kept-customer');s.keptSelected=d.customer;
    d.use=(Math.min(keptContact().balance,total())/100).toFixed(2);d.cash='';save();render();return;
  }
  d.use=val('kept-use');d.cash=val('kept-cash');save();drawKeptCheckout();
};
actions['kept-use-max']=()=>{
  const d=keptCheckout();d.use=(Math.min(keptContact(d.customer).balance,total())/100).toFixed(2);
  document.querySelector('#kept-use').value=d.use;save();drawKeptCheckout();
};
actions['kept-save-sale']=()=>{
  const {c,use,cash,error}=keptCheckoutValues();if(error||!count())return;
  const remainder=total()-use;keptMove(c,-use,'Used at checkout','Sale '+(s.saleSeq+1));
  s.keptCheckout=null;
  completeSale(remainder?'Kept change + cash':'Kept change',cash,remainder,
    {keptUsed:use,keptCustomerId:c.id,customer:c.name,keptBalance:c.balance,change:cash-remainder});
};
screens['kept-refund']=()=>{
  if(!keptGate())return;const c=keptContact();
  screen.innerHTML=heading('Give cash back.','Return kept change to '+esc(c.name)+'.','kept-account')+
    '<div class="kept-layout"><section>'+line('Kept for '+esc(c.name),keptMoney(c.balance))+
    field('kept-refund-amount',`Cash to give back · ${keptState().currency}`,
      s.keptRefund?.customer===c.id?s.keptRefund.amount:'','inputmode="decimal" placeholder="0.00"')+
    btn('kept-refund-all','Give all kept change back','text-button')+
    '<p class="error" id="kept-refund-error" role="alert"></p></section>'+
    '<section class="kept-summary"><h2 class="section-title">Before you give cash</h2>'+keptContextNote()+
    line('Expected in this till',money(s.cash))+note('Check the person and amount. Owner approval comes next. This does not change sales or stock.')+
    '</section></div>';
  primary('kept-review-refund','Review cash back',true);inputActions['kept-refund']();
};
inputActions['kept-refund']=()=>{
  const c=keptContact(),amount=parseCents(val('kept-refund-amount'));
  s.keptRefund={customer:c.id,amount:val('kept-refund-amount')};save();
  const error=!s.active?'Open this till before giving cash back.':!keptAllowed()?'This balance cannot be paid out here.':
    amount===null||amount<=0?'Enter an amount above zero.':amount>c.balance?
    `Only ${keptMoney(c.balance)} is kept for ${c.name}.`:amount>s.cash?
    `Only ${money(s.cash)} is expected in this till. Enter a smaller amount or come back when cash is available.`:'';
  document.querySelector('#kept-refund-error').textContent=error;enable('kept-review-refund',!error);
};
actions['kept-refund-all']=()=>{
  document.querySelector('#kept-refund-amount').value=(keptContact().balance/100).toFixed(2);
  inputActions['kept-refund']();
};
actions['kept-review-refund']=()=>navigate('kept-refund-review');
screens['kept-refund-review']=()=>{
  if(!keptGate())return;const d=s.keptRefund,c=keptContact(d?.customer),amount=parseCents(d?.amount||'');
  if(!d||amount===null||amount<=0){navigate('kept-refund');return;}
  screen.innerHTML=heading('Check cash back.','Owner approval · Kept change','kept-refund')+
    '<div class="kept-layout"><section>'+line('Give to',esc(c.name))+
    '<div class="kept-highlight">'+line('Cash leaving this till',keptMoney(amount))+'</div>'+
    line('Kept here after refund',keptMoney(c.balance-amount))+
    line('Cash left in this till',money(s.cash-amount))+
    note('Pay out this amount once. It clears kept change; it is not a sale return.')+
    '</section><section>'+approvalField()+'</section></div>';
  primary('kept-save-refund','Approve & save cash back',true);
};
inputActions['kept-refund-review']=()=>enable('kept-save-refund',val('approval-pin')==='123456');
actions['kept-save-refund']=()=>{
  const d=s.keptRefund;if(!d||val('approval-pin')!=='123456'||!keptAllowed()||!s.active)return;
  const c=keptContact(d.customer),amount=parseCents(d.amount);
  if(!amount||amount>c.balance||amount>s.cash)return;
  keptMove(c,-amount,'Cash given back','Approved by Chipo');s.cash-=amount;s.keptRefund=null;
  record('Kept change paid to '+c.name+' · '+keptMoney(amount));
  result('Cash back saved.',line('Give '+esc(c.name),keptMoney(amount))+
    line('Kept here now',keptMoney(c.balance))+line('Cash left in till',money(s.cash))+
    note('Practice payout saved on this phone. Sales and stock are unchanged.'),'kept-account','View kept change');
};
screens['kept-keep']=()=>{
  if(!keptGate())return;if(!count()){navigate('sell');return;}
  const change=(parseCents(received)||0)-total();
  screen.innerHTML=heading('Keep this change.','Only if the customer agrees.','pay')+
    '<div class="kept-layout"><section>'+keptPicker()+
    btn('kept-add-customer','Add a customer','text-button')+
    line('Change to keep',money(Math.max(0,change)),'<span id="kept-after-keep"></span>')+
    '<label class="toggle-row"><span><strong>Customer agrees</strong><small>Leave this change here for their next visit.</small></span>'+
    '<input type="checkbox" id="kept-consent"></label>'+
    '<p class="error" id="kept-keep-error" role="alert"></p>'+btn('pay','Give the change instead','text-button full')+
    '</section><section class="kept-summary"><h2 class="section-title">After this sale</h2>'+
    '<div id="kept-keep-summary"></div>'+note('The extra cash stays in this till. It is owed to the customer, not extra sales.')+
    '</section></div>';
  primary('kept-save-keep','Save sale & keep change',true);drawKeepChange();
};
function drawKeepChange(){
  const c=keptContact(),change=(parseCents(received)||0)-total();
  const error=!s.active?'Open the till before saving.':!keptAllowed()?'This balance cannot receive change here.':
    change<=0?'There is no change to keep. Return to cash payment.':
    c.balance+change>keptState().cap?`That exceeds the practice limit of ${keptMoney(keptState().cap)} per customer. Give the change instead.`:'';
  document.querySelector('#kept-keep-error').textContent=error;
  document.querySelector('#kept-after-keep').textContent=
    `${c.name} will have ${keptMoney(c.balance+Math.max(0,change))} kept here.`;
  document.querySelector('#kept-keep-summary').innerHTML=line('Sale total',money(total()))+
    line('Cash received',money(parseCents(received)||0))+line('Change given now',money(0))+
    line('Kept for '+esc(c.name)+' after saving',keptMoney(c.balance+Math.max(0,change)));
  enable('kept-save-keep',!error&&document.querySelector('#kept-consent').checked);
}
inputActions['kept-keep']=el=>{
  if(el.id==='kept-customer'){s.keptSelected=val('kept-customer');save();
    document.querySelector('#kept-consent').checked=false;}
  drawKeepChange();
};
actions['kept-add-customer']=()=>showSheet('Whose change is it?',
  field('kept-new-name','Customer name or phone','','maxlength="40" placeholder="Name they will recognise"')+
  '<p class="error" id="kept-name-error" role="alert"></p>'+
  note('Use a name you can recognise when they return. Practice contacts stay on this phone.'),
  btn('kept-save-customer','Add customer','primary'));
actions['kept-save-customer']=()=>{
  const name=val('kept-new-name'),k=keptState();
  const error=name.length<2?'Enter a name or phone number.':k.contacts.length>=12?
    'Practice contact limit reached.':k.contacts.some(c=>c.name.toLowerCase()===name.toLowerCase())?
    'That name is already listed. Close this panel and choose them.':'';
  document.querySelector('#kept-name-error').textContent=error;if(error)return;
  const id='kept'+k.contacts.length;k.contacts.push({id,name,balance:0,opening:0,moves:[]});
  s.keptSelected=id;save();sheet.close();render();
};
actions['kept-save-keep']=()=>{
  const c=keptContact(),tender=parseCents(received),change=(tender||0)-total();
  if(!s.active||!keptAllowed()||!count()||change<=0||c.balance+change>keptState().cap||
    !document.querySelector('#kept-consent')?.checked)return;
  keptMove(c,change,'Change kept','Sale '+(s.saleSeq+1));
  completeSale('Cash · change kept',tender,tender,
    {keptAdded:change,keptCustomerId:c.id,customer:c.name,keptBalance:c.balance,change:0});
};
