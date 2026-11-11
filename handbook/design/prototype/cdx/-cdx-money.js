// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

screens.money=()=>{
  const own=s.role==='owner';
  screen.innerHTML=heading(own?'Your money.':'My till.',
    `Tuesday, 10 November · ${own?'Front counter':esc(s.name)}`)+
    (own?'<p class="warning">This device only · Shop total incomplete.<br>Device 2 last uploaded at 08:12.</p>':'')+
    `<section class="hero"><p class="eyebrow">${own?'Sales after returns':'My sales this shift'}</p>
    <div class="amount-due"><span>${s.currency}</span>${(s.sales/100).toFixed(2)}</div>
    <small>${s.saleCount} sales · ${own?'This till only':'Your signed-in shift'}</small></section>`+
    `<div class="row"><h2>In the cash drawer</h2><span class="micro">${s.currency}</span></div>`+
    line('Expected cash',money(s.cash),'Float + cash in − cash out')+keptOwedRow()+
    (s.zwg>0?line('Expected ZWG',money(s.zwg,'ZWG')):'')+
    menu('history','Recent sales','Find a receipt · Returns','receipt')+
    (s.features.kept?menu('kept-customers','Kept change','Money this till owes customers','people'):'')+
    (own?menu('expense','Record money out','Shop expense, drawing or supplier payment','money')+
      (s.features.credit?menu('customers','Customers',money(s.owed)+' owed to the shop','people'):'')+
      menu('suppliers','Suppliers',money(s.supplier)+' to pay','stock')+
      menu('reports','Reports','Period, place and missing information','receipt'):
      menu('expense','Record a shop expense','Owner approval before cash leaves','money'))+
    (!s.active?'<p class="change">Your shift is closed. Open the till for a new shift.</p>':'');
  primary(s.active?'cashup':'opening',s.active?'Cash up this till':'Open till');
};
screens.expense=()=>{
  screen.innerHTML=heading('Record money out.','What left this drawer?','money')+
    select('expense-kind','Reason',option('expense','Shop expense')+(s.role==='owner'?
      option('drawing','Owner’s drawing')+option('supplier','Payment to Mambo Wholesale'):''))+
    field('expense-amount',`Cash taken out · ${s.currency}`,draft.expense?
      (draft.expense.amount/100).toFixed(2):'','inputmode="decimal" placeholder="0.00"')+
    field('expense-note','What was it for?',draft.expense?.note||'',
      'maxlength="120" placeholder="e.g. Bus fare to buy stock"')+
    '<p class="error" id="expense-error" role="alert"></p>'+
    note('This changes expected cash. Receiving stock alone does not take money out of the drawer.');
  if(draft.expense)document.querySelector('#expense-kind').value=draft.expense.kind;
  primary('review-expense','Review money out',true);inputActions.expense();
};
inputActions.expense=()=>{
  const amount=parseCents(val('expense-amount'));
  const error=amount>s.cash?`Only ${money(s.cash)} is expected in this drawer.`:
    val('expense-kind')==='supplier'&&amount>s.supplier?'That is more than this supplier’s balance.':
    val('expense-amount')&&amount===null?'Use an amount with up to two decimal places.':'';
  document.querySelector('#expense-error').textContent=error;
  enable('review-expense',validAmount('expense-amount')&&!error&&val('expense-note').length>=3);
};
actions['review-expense']=()=>{
  draft.expense={amount:parseCents(val('expense-amount')),kind:val('expense-kind'),note:val('expense-note')};
  navigate('expense-review');
};
function approvalField(){return field('approval-pin','Chipo’s approval PIN','','type="password" '+
  'inputmode="numeric" maxlength="6"')+note('Practice approval PIN: 123456. No real cashier credentials are used.');}
screens['expense-review']=()=>{
  const e=draft.expense;if(!e){navigate('expense');return;}
  screen.innerHTML=heading('Check money out.','Owner approval · Front counter','expense')+
    line(e.kind==='drawing'?'Owner’s drawing':e.kind==='supplier'?'Mambo Wholesale':'Shop expense',money(e.amount))+
    line('For',esc(e.note))+line('Cash left after saving',money(s.cash-e.amount))+approvalField();
  primary('save-expense','Save money out',true);
};
inputActions['expense-review']=()=>enable('save-expense',val('approval-pin')==='123456');
actions['save-expense']=()=>{
  const e=draft.expense;if(!e||val('approval-pin')!=='123456')return;
  s.cash-=e.amount;if(e.kind==='supplier'){s.supplier-=e.amount;
    accountMove('supplier','Cash payment',-e.amount,e.note);}
  record(`Money out ${money(e.amount)}: ${e.note}`);draft.expense=null;
  result('Money out saved.',line('Amount',money(e.amount))+line('Expected cash now',money(s.cash)),
    'money','Back to money');
};
