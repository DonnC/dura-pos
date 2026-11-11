// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// Design review controls only; the app prototype still owns its workflows.
const coverageFrame=document.querySelector('#coverage-frame');
const coverageBoard=document.querySelector('#coverage-board');
function resizeCoveragePreview(){
  const size={phone:[390,844],portrait:[768,1024],landscape:[1024,768]}
    [document.querySelector('#coverage-device').value];
  const scale=Math.min(1,(coverageBoard.clientWidth-24)/size[0]);
  coverageFrame.style.width=size[0]+'px';coverageFrame.style.height=size[1]+'px';
  coverageFrame.style.transform=`translateX(-50%) scale(${scale})`;coverageFrame.style.transformOrigin='top center';
  coverageBoard.style.height=(size[1]*scale+32)+'px';
  document.querySelector('#coverage-size').textContent=`${size[0]} × ${size[1]} CSS px · Browser simulation`;
}
function openCoveragePreview(href,label){
  const target=new URL(href,location.href),mode=document.querySelector('#coverage-appearance').value;
  target.searchParams.delete('theme');target.searchParams.delete('text');
  if(mode==='dark')target.searchParams.set('theme','dark');
  if(mode==='large')target.searchParams.set('text','large');
  coverageFrame.src=target.href;coverageFrame.dataset.example=href;
  document.querySelector('#coverage-current').textContent=label;
  document.querySelector('#coverage-open').href=target.href;
  resizeCoveragePreview();
}
document.querySelector('#coverage-links').addEventListener('click',e=>{
  const link=e.target.closest('a');if(!link)return;e.preventDefault();
  openCoveragePreview(link.getAttribute('href'),link.textContent);
});
document.querySelector('#coverage-device').onchange=resizeCoveragePreview;
document.querySelector('#coverage-appearance').onchange=()=>{
  if(coverageFrame.dataset.example)openCoveragePreview(coverageFrame.dataset.example,
    document.querySelector('#coverage-current').textContent);
};
document.querySelector('#coverage-search').oninput=e=>{
  const value=e.target.value.toLowerCase();
  for(const li of document.querySelectorAll('#coverage-links li'))li.hidden=!li.textContent.toLowerCase().includes(value);
  if(value)for(const details of document.querySelectorAll('#coverage-links details'))details.open=true;
};
window.addEventListener('resize',resizeCoveragePreview);
openCoveragePreview('-cdx-counter.html?fresh=1&seed=1','Sell · Start here');
