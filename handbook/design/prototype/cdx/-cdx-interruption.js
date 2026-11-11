// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// One bounded practice cash entry. It is never a payment or a saved sale.
let cashDraftRecovered=false;
function cashDraftKey(){
  return JSON.stringify([s.role,s.name,s.currency,basketRows().map(p=>
    [p.id,s.basket[p.id],p.cents,p.scale||1]).sort((a,b)=>a[0].localeCompare(b[0]))]);
}
function clearStaleCashDraft(){
  if(s.cashDraft&&(!count()||s.cashDraft.key!==cashDraftKey())){
    delete s.cashDraft;received='';cashDraftRecovered=false;
  }
}
clearStaleCashDraft();
if(s.cashDraft&&typeof s.cashDraft.value==='string'&&s.cashDraft.value.length<=16&&!q.has('cash')){
  received=s.cashDraft.value;cashDraftRecovered=true;
}
function rememberCashEntry(){
  cashDraftRecovered=false;
  s.cashDraft={key:cashDraftKey(),value:received.slice(0,16)};save();
}
const originalCashInput=inputActions.pay;
inputActions.pay=el=>{originalCashInput(el);if(el.id==='received')rememberCashEntry();};
const originalCashTender=actions.tender;
actions.tender=b=>{originalCashTender(b);rememberCashEntry();};
const originalCashScreen=screens.pay;
screens.pay=()=>{
  originalCashScreen();if(page!=='pay')return;
  if(cashDraftRecovered)document.querySelector('#payment-error').insertAdjacentHTML('beforebegin',
    '<p class="micro" id="cash-draft-note">Unfinished cash entry restored. Check the amount before saving.</p>');
};

