// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

let fiscalFilter='all';
screens.fiscal=()=>{
  if(!fiscalDemo().enabled){screen.innerHTML=heading('Fiscal receipts.','Optional · Not configured','settings')+
    '<div class="fiscal-layout"><section>'+line('Connection','Not configured')+
    line('Phone identity','One fiscal device per phone')+'</section><section><h2 class="section-title">Explore in test mode</h2>'+
    '<p class="sub">Review status, receipt issues and fiscal-day recovery with examples before a real setup.</p>'+
    fiscalExampleNote()+'</section></div>';primary('fiscal-setup','Explore test setup');return;}
  screen.innerHTML=heading('Fiscal receipt status.','Test-device example · This phone','settings')+
    (fiscalDemo().condition==='ending'?'<p class="warning">Example: the fiscal day is nearing its configured limit. Ask the owner to review it.</p>':'')+
    '<div class="fiscal-layout"><section>'+line('Saved sale','Separate local record')+
    line('Fiscal items needing attention',String(fiscalOutstanding().length))+
    menu('fiscal-queue','Receipt status','Waiting, unconfirmed and owner review','receipt')+
    '</section><section>'+menu('fiscal-day','Fiscal day','Separate from your till’s cash-up','clock')+
    menu('fiscal-device','This fiscal device','Access, identity and replacement checks','phone')+fiscalExampleNote()+'</section></div>';
  primary('fiscal-queue','View receipt status');
};
screens['fiscal-setup']=()=>{
  screen.innerHTML=heading('Start with a test device.','Owner setup preview · No live activation','fiscal')+
    '<div class="fiscal-layout"><section><ol class="steps"><li>Confirm the business’s requirements with the authority.</li>'+
    '<li>Use the business’s own assigned test device.</li><li>Review receipt and fiscal-day outcomes.</li></ol></section>'+
    '<section>'+line('Mode','Test example only')+line('Credentials','None entered or stored here')+
    line('Live activation','Not offered by this preview')+fiscalExampleNote()+'</section></div>';
  primary('fiscal-enable-preview','Preview test-device status');
};
actions['fiscal-enable-preview']=()=>{fiscalDemo().enabled=true;save();navigate('fiscal');};
screens['fiscal-queue']=()=>{
  if(!fiscalGate())return;
  screen.innerHTML=heading('Fiscal receipt queue.',s.role==='owner'?'Test example · This phone':'Your test examples on this phone','shop')+
    '<div class="tabs">'+[['all','All'],['waiting','Waiting'],['attention','Needs attention']].map(([v,l])=>
      btn('fiscal-filter',l,'chip',`data-filter="${v}" aria-pressed="${fiscalFilter===v}"`)).join('')+'</div>'+
    '<div id="fiscal-queue-list"></div>'+note('A saved sale, a payment and a fiscal answer are separate records. Checking status does not charge the customer again.');
  drawFiscalQueue();primary('sell','Back to till');
};
function drawFiscalQueue(){
  const rows=visibleFiscalRows().filter(r=>fiscalFilter==='all'||fiscalFilter==='waiting'&&r.state==='waiting'||
    fiscalFilter==='attention'&&['unknown','refused','flagged'].includes(r.state));
  document.querySelector('#fiscal-queue-list').innerHTML=rows.map(r=>menu('fiscal-open',fiscalLabels[r.state],
    `${esc(r.type)} · ${money(r.amount)} · ${esc(r.ref)}`,'receipt',`data-ref="${r.ref}"`)).join('')||
    '<div class="empty"><h2>No items in this view.</h2><p class="sub">Other fiscal states may still be present.</p>'+btn('fiscal-show-all','Show all states')+'</div>';
}
actions['fiscal-filter']=b=>{fiscalFilter=b.dataset.filter;drawFiscalQueue();};
actions['fiscal-show-all']=()=>{fiscalFilter='all';render();};
actions['fiscal-open']=b=>{fiscalDemo().selected=b.dataset.ref;save();navigate('fiscal-receipt');};
screens['fiscal-receipt']=()=>{
  if(!fiscalGate())return;const r=selectedFiscal();
  if(!r){screen.innerHTML=heading('Open your own receipt.','Ask the owner to review other sellers’ records.','fiscal-queue');return;}
  screen.innerHTML=heading(fiscalLabels[r.state]+'.','Test result · Original record kept','fiscal-queue')+
    '<div class="fiscal-layout"><section>'+line('Amount',money(r.amount))+
    line('Fiscal reference',`<span id="fiscal-reference">${esc(r.ref)}</span>`)+
    line('Saved sale / return',esc(r.sale),'Example local record')+line('Document type',esc(r.type))+
    '</section><section><h2 class="section-title">What to do next</h2>'+
    '<p class="sub">'+esc(fiscalStatusCopy(r.state))+'</p>'+line('Shop Hub upload','Not connected by this preview')+fiscalExampleNote()+
    (r.state==='refused'||r.state==='flagged'?btn(s.role==='owner'?'fiscal-owner-review':'fiscal-ask-owner',
      s.role==='owner'?'Review the issue':'Ask the owner','secondary full'):'')+'</section></div>';
  primary(r.state==='refused'||r.state==='flagged'?(s.role==='owner'?'fiscal-owner-review':'fiscal-ask-owner'):'fiscal-check',
    r.state==='refused'||r.state==='flagged'?'Review next step':'Check this existing reference');
};
actions['fiscal-ask-owner']=()=>showSheet('Ask the owner to review',
  '<p class="sub">Keep the original sale and fiscal reference. No message is sent from this preview.</p>',btn('sell','Back to till','primary'));
screens['fiscal-check']=()=>{
  if(!fiscalGate())return;const r=selectedFiscal();if(!r){navigate('fiscal-queue');return;}
  screen.innerHTML=heading('Check the existing result.','Test response preview · No new submission','fiscal-receipt')+
    '<div class="fiscal-layout"><section>'+fiscalDetailRows(r)+note('Use this same reference. Do not create another sale or take payment again.')+
    '</section><section>'+select('fiscal-answer','Example answer to show',option('unknown','Still not confirmed')+
      option('accepted','Accepted example')+option('refused','Needs owner review')+option('flagged','Received with a day-close finding'))+
    fiscalExampleNote()+'</section></div>';
  primary('fiscal-show-answer','Show example answer');
};
actions['fiscal-show-answer']=()=>{
  const r=selectedFiscal();if(!r)return;
  if(r.ref!=='F-EX-0015'){toast('Only the first example has response variants. No record changed.');return;}
  fiscalDemo().firstStatus=val('fiscal-answer');save();navigate('fiscal-receipt');
};
screens['fiscal-owner-review']=()=>{
  const r=selectedFiscal()||fiscalRows()[0];
  screen.innerHTML=heading('Review the receipt issue.','Owner · Keep the original record','fiscal-receipt')+
    '<div class="fiscal-layout"><section>'+fiscalDetailRows(r)+line('Current state',fiscalLabels[r.state])+
    '</section><section><h2 class="section-title">Keep one clear history</h2><ol class="steps">'+
    '<li>Keep the original sale and fiscal reference.</li><li>Review the reported cause with the configured support route.</li>'+
    '<li>Confirm the existing outcome before further fiscal action.</li></ol>'+
    note('A refused submission and an accepted receipt with findings need different recovery. This preview does not edit signed data or clear a blocked fiscal day.')+
    btn('fiscal-support','View safe support details','secondary full')+'</section></div>';
  primary('fiscal-check','Preview checking the same reference');
};
actions['fiscal-support']=()=>{
  const r=selectedFiscal()||fiscalRows()[0];showSheet('Support details · Example',
    line('Fiscal reference',esc(r.ref))+line('Mode','Test example')+line('State',fiscalLabels[r.state])+
    note('No credentials, PINs, private keys or full receipt payload are included. Nothing is sent.'),btn('close','Back to the issue','primary'));
};
