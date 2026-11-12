// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

const cashInKinds={float:'Extra change / float',owner:'Owner contribution',repaid:'Expense money returned',other:'Other'};
const cashInScope=()=>JSON.stringify([s.shop,s.role,s.name,s.currency]);
function cashInDraft(){
  if(s.cashInDraft?.scope!==cashInScope())s.cashInDraft={scope:cashInScope(),kind:'other',amount:'',note:''};
  return s.cashInDraft;
}
function cashInValid(){const d=cashInDraft(),n=parseCents(d.amount);
  return s.active&&n!==null&&n>0&&cashInKinds[d.kind]&&(d.kind!=='other'||d.note.trim().length>=3);}
screens['money-in']=()=>{
  const d=cashInDraft();screen.innerHTML=heading('Money in.','Cash added to this drawer · Not a sale','money')+
    field('cash-in-amount','Cash received · '+s.currency,d.amount,'maxlength="16" inputmode="decimal" placeholder="0.00"')+
    select('cash-in-kind','Where did it come from?',Object.entries(cashInKinds).map(([v,l])=>option(v,l,v===d.kind)).join(''))+
    '<div id="cash-in-other">'+field('cash-in-note','Describe the other source',d.note,'maxlength="120"')+'</div>'+
    note('Record sales and customer debt payments on their own screens, so they are not counted twice.');
  primary('cash-in-review','Review money in',true);drawCashIn();
};
function drawCashIn(){document.querySelector('#cash-in-other').hidden=cashInDraft().kind!=='other';enable('cash-in-review',cashInValid());}
inputActions['money-in']=()=>{
  Object.assign(cashInDraft(),{amount:val('cash-in-amount').slice(0,16),kind:val('cash-in-kind'),note:val('cash-in-note').slice(0,120)});save();drawCashIn();
};
actions['cash-in-review']=()=>{if(cashInValid()){cashInDraft().baseline=s.cash;save();navigate('money-in-review');}};
screens['money-in-review']=()=>{
  if(!cashInValid()){navigate('money-in');return;}const d=cashInDraft(),amount=parseCents(d.amount);
  screen.innerHTML=heading('Check money in.','Cash movement only · Sales stay unchanged','money-in')+
    line('Cash added',money(amount))+line('From',esc(d.kind==='other'?d.note:cashInKinds[d.kind]))+
    line('Expected cash after saving',money(s.cash+amount))+
    (s.role==='worker'?approvalField():note('You are signed in as Owner. This records cash received, not income from a sale.'))+
    '<p id="cash-in-error" class="error" role="alert"></p>';
  primary('cash-in-save','Save money in',s.role==='worker');
};
inputActions['money-in-review']=()=>enable('cash-in-save',s.role==='owner'||val('approval-pin')==='123456');
actions['cash-in-save']=()=>{
  if(!cashInValid()||s.role==='worker'&&val('approval-pin')!=='123456')return;
  const d=cashInDraft();if(d.baseline!==s.cash){navigate('money-in');return;}
  const amount=parseCents(d.amount);s.cash+=amount;s.cashInDraft=null;
  record('Money in '+money(amount)+' · '+(d.kind==='other'?d.note:cashInKinds[d.kind]));
  result('Money in saved.',line('Cash added',money(amount))+line('Expected cash now',money(s.cash))+
    note('Sales and customer balances are unchanged.'),'money','Back to money');
};
