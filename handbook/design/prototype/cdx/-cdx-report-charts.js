// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

function ownerReportChart(data,title){
  const known=data.filter(d=>d.amount!==null);if(!known.length)return note('No figures available for this chart. Missing is not zero.');
  const highest=Math.max(...known.map(d=>d.amount)),min=Math.min(0,...known.map(d=>d.amount)),max=Math.max(1,highest);
  const y=value=>160*(max-value)/(max-min),zero=y(0);
  const shapes=data.map(d=>{
    return `<div class="chart-column"><div class="chart-plot"><span class="chart-zero" style="top:${zero}px"></span>`+
      (d.amount===null?'<span class="chart-missing">?</span>':
      `<span class="chart-bar ${d.incomplete?'older':''}" style="top:${Math.min(y(d.amount),zero)}px;height:${Math.max(1,Math.abs(zero-y(d.amount)))}px"></span>`)+
      '</div><span class="chart-label">'+esc(d.label)+'</span></div>';
  }).join('');
  return `<figure class="owner-chart"><figcaption>${esc(title)} · ${s.currency}</figcaption>
    <p class="micro">Highest recorded ${money(highest)} · Zero baseline</p>
    <div class="chart-scroll" tabindex="0" role="img" aria-label="${esc(title)}. ${s.currency}. Recorded figures only; exact values in the table below.">
    <div class="chart-columns" style="--chart-count:${data.length}">${shapes}</div></div>
    <p class="micro">Faded = incomplete or older figures · ? = no figures. Scroll horizontally if dates do not fit.</p>
    <details><summary>View chart figures</summary><div class="report-table-scroll"><table><thead><tr><th>Period / group</th><th>Recorded amount</th><th>Coverage</th></tr></thead>
    <tbody>${data.map(d=>`<tr><th scope="row">${esc(d.label)}</th><td>${d.amount===null?'Not available':money(d.amount)}</td>
    <td>${d.amount===null?'Missing':d.incomplete?'Incomplete':'Included'}</td></tr>`).join('')}</tbody></table></div></details></figure>`;
}
