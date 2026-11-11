// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// Inert test-device examples; no fiscal adapter, number or signed receipt exists here.
function fiscalDemo(){return s.fiscalDemo||(s.fiscalDemo={enabled:false,condition:'waiting',
  firstStatus:'waiting',selected:'F-EX-0015',day:'open'});}
if(q.get('fiscal')){
  const d=fiscalDemo(),condition=q.get('fiscal');d.enabled=condition!=='off';d.condition=condition;
  d.firstStatus=['unknown','refused','flagged','accepted'].includes(condition)?condition:
    ['clear','closing','close-failed','closed'].includes(condition)?'accepted':'waiting';
  d.day=condition==='closing'?'pending':condition==='close-failed'?'failed':condition==='closed'?'closed':'open';
}
const fiscalLabels={waiting:'Waiting to send',unknown:'Result not confirmed',refused:'Needs owner review',
  flagged:'Example received · Day-close issue',accepted:'Example accepted'};
function fiscalRows(){
  const d=fiscalDemo(),allAccepted=['clear','closing','close-failed','closed'].includes(d.condition);
  return [{ref:'F-EX-0015',sale:'T-P1-S261110-0015',who:'Rudo',amount:250,type:'Sale receipt',state:d.firstStatus},
    {ref:'F-EX-0016',sale:'T-P1-S261110-0016',who:'Chipo',amount:350,type:'Sale receipt',state:allAccepted?'accepted':'waiting'},
    {ref:'F-EX-0017',sale:'T-P1-S261110-0014',who:'Rudo',amount:100,type:'Linked credit note',state:allAccepted?'accepted':'waiting'}];
}
const visibleFiscalRows=()=>fiscalRows().filter(r=>s.role==='owner'||r.who===s.name);
const selectedFiscal=()=>visibleFiscalRows().find(r=>r.ref===fiscalDemo().selected);
const fiscalOutstanding=()=>fiscalRows().filter(r=>r.state!=='accepted');
function fiscalExampleNote(){return note('Test example only. No fiscal request, signature, verification code or live receipt is created.');}
function fiscalGate(){
  if(fiscalDemo().enabled)return true;
  screen.innerHTML=heading('Fiscal receipts are off.','Cash selling and saved receipts remain available.','shop')+
    fiscalExampleNote();primary(s.role==='owner'?'fiscal-setup':'sell',s.role==='owner'?'Explore test setup':'Back to till');return false;
}
function fiscalDetailRows(r){return line('Saved sale / return',esc(r.sale),'Example local reference')+
  line('Document type',esc(r.type))+line('Amount',money(r.amount))+
  line('Fiscal reference',`<span id="fiscal-reference">${esc(r.ref)}</span>`)+
  line('Mode / phone','Test example · This phone');}
function fiscalStatusCopy(state){return {
  waiting:'This example has not reached the authority. Later records stay in their original order.',
  unknown:'The reply was not confirmed. Check this existing reference before any further submission.',
  refused:'The submission was refused. The owner needs to review the cause; later records may be waiting behind it.',
  flagged:'This example was received with a finding that blocks day close. Receipt delivery and a clean fiscal-day close are separate facts.',
  accepted:'A successful answer is shown for this test example. No live receipt was issued by this browser.'}[state];}
