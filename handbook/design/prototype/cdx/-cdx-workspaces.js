// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// Reparent existing controls without cloning, changing values or business rules.
function splitWorkspace(root,pivot){
  if(!pivot||pivot.parentElement!==root||root.querySelector('.task-workspace'))return;
  const nodes=[...root.children].filter(el=>!el.matches('.back,.heading'));
  const at=nodes.indexOf(pivot);if(at<0||at===nodes.length-1)return;
  const grid=document.createElement('div');grid.className='task-workspace';
  const main=document.createElement('section'),detail=document.createElement('section');
  main.className='workspace-main';detail.className='workspace-detail';
  nodes.forEach((el,i)=>(i<=at?main:detail).appendChild(el));
  grid.append(main,detail);root.appendChild(grid);
}
function applyScreenLayout(){
  const root=screen.querySelector('.page-content')||screen;
  if(['money','shop'].includes(page))splitWorkspace(root,root.querySelector(':scope>.hero'));
  if(page==='invoice-items')splitWorkspace(root,root.querySelector(':scope>[data-action="invoice-add"]'));
  if(page==='pending')splitWorkspace(root,root.querySelector(':scope>.empty'));
  if(page==='count-stock-review')splitWorkspace(root,root.querySelector(':scope>#take-review-pagination'));
  if(['expense-review','discount-review','count-review','money-in-review'].includes(page)){
    const field=root.querySelector(':scope>.form-label');splitWorkspace(root,field?.previousElementSibling);
  }
  const body=document.querySelector('#owner-report-body');
  if(body&&page!=='report-trend'&&!body.querySelector('.report-detail-workspace')){
    const chart=body.querySelector(':scope>.owner-chart'),table=body.querySelector(':scope>.report-table-scroll');
    if(chart&&table){
      const grid=document.createElement('div');grid.className='report-detail-workspace';
      chart.before(grid);grid.append(chart,table);
    }
  }
  if(!mainDestinations.has(page)&&!screen.querySelector('.task-identity')&&
    !document.querySelector('#app').classList.contains('onboarding')){
    const title=screen.querySelector('.result-top h1,.receipt h1');
    title?.insertAdjacentHTML('afterend',taskIdentity());
  }
  document.querySelector('#app').classList.toggle('has-workspace',!!screen.querySelector(
    '.task-workspace,.invoice-layout,.account-layout,.kept-layout,.quantity-layout,.return-layout,.report-detail-workspace'));
}
