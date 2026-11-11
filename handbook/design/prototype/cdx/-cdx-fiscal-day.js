// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

const fiscalDayLabel=()=>({open:'Open · Example',pending:'Waiting for confirmation',
  failed:'Close needs owner review',closed:'Example closed'}[fiscalDemo().day]);
screens['fiscal-day']=()=>{
  if(!fiscalGate())return;const d=fiscalDemo();
  screen.innerHTML=heading('This fiscal day.','Owner · Test-device example','fiscal')+
    (d.condition==='ending'?'<p class="warning">Example day-limit notice. Review the configured device deadline and outstanding receipts.</p>':'')+
    '<div class="fiscal-layout"><section>'+line('Fiscal day','Example day 17')+
    line('Day status',fiscalDayLabel())+line('Receipts needing attention',String(fiscalOutstanding().length))+
    line('Configured deadline','Read from the fiscal device','No fixed legal time limit is assumed in this example.')+
    '</section><section><h2 class="section-title">Keep day close separate</h2>'+
    '<p class="sub">Closing a fiscal day is separate from counting or handing over this cash drawer.</p>'+
    line('Till shift',s.active?'Still open':'Closed')+
    note('A request is not confirmation. Outstanding receipt results and close findings need the owner’s review.')+
    fiscalExampleNote()+'</section></div>';
  primary('fiscal-close',d.day==='pending'?'Check the close result':'Review fiscal-day close');
};
screens['fiscal-close']=()=>{
  if(!fiscalGate())return;const d=fiscalDemo(),pending=fiscalOutstanding();
  screen.innerHTML=heading('Check the fiscal-day close.','Example day 17 · Owner','fiscal-day')+
    '<div class="fiscal-layout"><section>'+line('Day status',fiscalDayLabel())+
    line('Unresolved receipt states',String(pending.length))+
    (pending.length?'<p class="warning">Review the outstanding receipt states first. This example cannot confirm a close while those records need attention.</p>':
      '<p class="sub">All receipt answers in this example are available. The day’s close still needs its own result.</p>')+
    '</section><section><h2 class="section-title">Before proceeding</h2>'+
    (d.day==='open'&&!pending.length?'<label class="toggle-row"><span><strong>I checked the receipt states</strong>'+ 
      '<small>Request close for this same example day.</small></span><input type="checkbox" id="fiscal-close-confirm"></label>':
      '<p class="sub">'+(d.day==='pending'?'Keep the same day identity and check the existing close request.':
        d.day==='failed'?'Review the reported cause and verified device procedure. Do not edit counters or mark the day closed locally.':
        d.day==='closed'?'The received closed state is shown as an example. This does not cash up the till or issue a new fiscal day.':
        'Keep each original receipt and its fiscal reference.')+'</p>')+
    fiscalExampleNote()+'</section></div>';
  if(pending.length)primary('fiscal-queue','Review outstanding receipts');
  else if(d.day==='open')primary('fiscal-request-close','Preview requesting close',true);
  else if(d.day==='closed')primary('fiscal-day','Back to fiscal-day status');
  else primary('fiscal-day-answer',d.day==='pending'?'Preview checking the existing close':'Review an example close result');
};
inputActions['fiscal-close']=()=>enable('fiscal-request-close',!!document.querySelector('#fiscal-close-confirm')?.checked);
actions['fiscal-request-close']=()=>{
  if(fiscalOutstanding().length||fiscalDemo().day!=='open'||!document.querySelector('#fiscal-close-confirm')?.checked)return;
  fiscalDemo().day='pending';save();navigate('fiscal-day');
};
actions['fiscal-day-answer']=()=>showSheet('Example close answer',
  '<p class="sub">Show a received state for this same example day. No fiscal request or retry is made.</p>',
  btn('fiscal-day-wait','Still waiting','secondary full')+btn('fiscal-day-failed','Close needs review','secondary full')+
  btn('fiscal-day-closed','Show example closed','primary'));
for(const [action,state] of [['fiscal-day-wait','pending'],['fiscal-day-failed','failed'],['fiscal-day-closed','closed']]){
  actions[action]=()=>{if(fiscalOutstanding().length)return;fiscalDemo().day=state;save();sheet.close();navigate('fiscal-day');};
}
screens['fiscal-device']=()=>{
  if(!fiscalGate())return;const condition=fiscalDemo().condition;
  screen.innerHTML=heading('This fiscal device.','Owner · One device identity on this phone','fiscal')+
    '<div class="fiscal-layout"><section>'+line('Device','Example device A')+line('Environment','Test example')+
    line('Access / stored state',condition==='certificate'?'Owner access check needed':
      condition==='integrity'?'Stored state needs investigation':'No real device linked')+
    line('Receipts to preserve',String(fiscalRows().length)+' test examples')+
    '</section><section><h2 class="section-title">If this phone is replaced</h2>'+
    '<ol class="steps"><li>Keep the old phone’s records and unresolved references.</li>'+ 
    '<li>Have the owner review the verified device/support procedure.</li>'+
    '<li>Give the replacement its own approved fiscal identity.</li></ol>'+
    note('Restoring shop records does not copy fiscal keys, identity or counters. No reset, deletion or live activation is offered here.')+
    btn('restore','Review shop-record recovery','secondary full')+fiscalExampleNote()+'</section></div>';
  primary('fiscal','Back to fiscal status');
};
