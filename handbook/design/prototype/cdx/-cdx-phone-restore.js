// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

screens.restore=()=>{
  const d=recoveryDemo();
  screen.innerHTML=heading('Recover onto a new phone.','Use a replacement phone; keep working phones intact.','records')+
    '<div class="recovery-layout"><section>'+select('restore-source','Get the shop’s records from',
      option('drive','Owner’s Google Drive · Example',d.source==='drive')+
      option('archive','Shop archive · Example',d.source==='archive'))+
    select('restore-backup','Snapshot to check',option('latest','10 Nov, 08:12 · Example',d.backup==='latest')+
      option('previous','9 Nov, 18:30 · Needs newer records',d.backup==='previous')+
      option('missing','No backup found',d.backup==='missing'))+
    '<p class="error" id="restore-source-error" role="alert"></p>'+
    '</section><section><h2 class="section-title">Work that may be missing</h2>'+
    '<p class="sub">A lost phone may have sales it never uploaded. A backup can only recover the records it contains.</p>'+
    recoveryWork()+note('This browser previews a separate replacement phone. It does not erase, replace or import your current work.')+
    setupNote()+'</section></div>';
  primary('restore-check','Review example recovery',d.backup==='missing');
};
inputActions.restore=()=>{
  const d=recoveryDemo();d.source=val('restore-source');d.backup=val('restore-backup');save();
  document.querySelector('#restore-source-error').textContent=d.backup==='missing'?'Ask the owner to find the shop’s backup or journal first.':'';
  enable('restore-check',d.backup!=='missing');
};
actions['restore-check']=()=>{if(recoveryDemo().backup!=='missing')navigate('restore-review');};
screens['restore-review']=()=>{
  const d=recoveryDemo(),problem=restoreProblem();
  screen.innerHTML=heading('Check what comes back.','Replacement phone example · Before recovery','restore')+
    '<div class="recovery-layout"><section>'+line('Shop in this backup',esc(restoreShop()))+
    line('Mode',d.condition==='wrong-mode'&&d.source==='drive'?'Live':'Practice')+
    line('Prices in',recoveryCurrency())+line('Snapshot date',restoreDate())+
    line('Record check',problem?'Needs attention':'Example passed')+
    (problem?'<p class="warning" role="alert">'+esc(problem)+'</p>'+btn('restore','Choose another backup','secondary full'):'')+
    '</section><section><h2 class="section-title">Possible missing work</h2>'+
    '<p class="sub">Work never uploaded from the lost phone may be missing. Do not treat this snapshot as a complete current shop total.</p>'+
    line('Replacement phone','New identity; set fresh access')+
    line('Old PINs / fiscal identity','Not copied')+
    '<label class="toggle-row"><span><strong>I understand the possible gap</strong><small>Check missing work with the owner before relying on totals.</small></span>'+
    '<input type="checkbox" id="restore-understand" '+(problem?'disabled':'')+'></label>'+setupNote()+'</section></div>';
  primary('restore-preview-save',problem?'Choose another backup':'Confirm the note below',true);
};
inputActions['restore-review']=()=>{
  const checked=!restoreProblem()&&document.querySelector('#restore-understand').checked;
  enable('restore-preview-save',checked);
  document.querySelector('[data-action="restore-preview-save"] span').textContent=
    checked?'Preview recovery on a new phone':'Confirm the note below';
};
actions['restore-preview-save']=()=>{
  if(restoreProblem()||!document.querySelector('#restore-understand')?.checked)return;
  recoveryDemo().restorePreview=true;save();navigate('restore-status');
};
screens['restore-status']=()=>{
  screen.innerHTML=heading('Example recovery ready.','No records were imported into this browser.')+
    '<div class="recovery-layout"><section>'+line('Shop',esc(s.shop))+line('Records through',restoreDate())+
    line('Missing work','Anything the old phone never uploaded')+line('Phone identity','A new identity in the app')+
    '</section><section><h2 class="section-title">Before trading on the replacement</h2>'+
    '<ol class="steps"><li>The owner verifies the replacement phone.</li><li>Set fresh local PINs and access.</li>'+
    '<li>Count the starting drawer.</li><li>Review the lost phone’s access.</li></ol>'+
    btn('lost-phone','Review lost phone access','secondary full')+setupNote()+'</section></div>';
  primary('records','Finish preview · View records');
};
screens['lost-phone']=()=>{
  screen.innerHTML=heading('Review the lost phone.','Device access is separate from a person’s seller access.','restore-status')+
    '<div class="recovery-layout"><section>'+line('Phone 2','Counter spare · Example')+
    line('Last seen','10 Nov, 08:12')+line('Work not uploaded','Unknown')+
    '</section><section><h2 class="section-title">Block future access to shared records</h2>'+
    '<p class="sub">The owner removes the lost phone’s access at the Shop Hub. Its offline copy cannot receive that change immediately.</p>'+
    note('Blocking a phone does not erase it or recover work it never uploaded. Other phones and the seller’s account are separate.')+
    setupNote()+'</section></div>';
  primary('lost-phone-preview','Preview a device block request');
};
actions['lost-phone-preview']=()=>{
  recoveryDemo().blockPreview=true;save();
  result('Example block request.',line('Shop Hub','Not contacted by this preview')+
    line('Lost phone','Still unconfirmed')+note('No real device, seller or saved work was changed.'),'records','Back to records');
};
