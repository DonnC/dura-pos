// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// Fictional grouped item records reconcile with the existing daily snapshots.
function reportSplit(amount){
  if(amount===null)return [null,null,null];
  const a=Math.floor(amount*0.4),b=Math.floor(amount*0.35);return [a,b,amount-a-b];
}
function reportFixtureItems(row){
  const net=reportSplit(row.net),discount=reportSplit(Math.floor(row.gross*0.05)),cost=reportSplit(row.costs);
  return ['Bread','Fresh milk','Cooking oil'].map((name,i)=>({name,unit:['loaves','cartons','bottles'][i],
    qty:Math.max(1,Math.round(row.count*[0.8,0.7,0.5][i])),net:net[i],discount:discount[i],cost:cost[i],
    cashier:i===1?'Chipo':'Rudo',reason:i===1?'Damaged outer pack':'Promotion',approvedBy:'Chipo'}));
}
const originalOwnerReportDataset=reportDataset;
reportDataset=()=>{
  const data=originalOwnerReportDataset();if(!reportExample||demoState==='empty')return data;
  for(let n=4;n<=8;n++)for(const [id,factor] of [['phone1',1],['phone2',0.55],['phone3',0.4]]){
    const gross=Math.round((7600+n*500)*factor),returns=n%2?Math.round(200*factor):0;
    data.rows.push({day:`2026-11-0${n}`,phone:id,gross,returns,net:gross-returns,count:Math.round(22*factor),
      costs:Math.round(gross*0.6),state:'current'});
  }
  data.rows.forEach(row=>{row.items=reportFixtureItems(row);row.discounts=row.items.reduce((n,i)=>n+i.discount,0);});
  return data;
};
function ownerReportItems(r){
  if(reportExample)return r.rows.flatMap(row=>row.items||[]);
  if(!r.range?.dates.includes(reportToday))return [];
  return s.history.filter(receipt=>receipt.currency===s.currency).flatMap(receipt=>receipt.items.map((item,index)=>{
    const original=item.lineTotal??roundRatio(BigInt(item.cents)*BigInt(item.qty),item.scale||1);
    const tally=returnTally(receipt),returned=tally.qty[index]||0;
    const refunded=roundRatio(BigInt(original)*BigInt(returned),item.qty);
    return {name:item.name,unit:item.stockUnit,qty:item.qty-returned,scale:item.scale||1,net:original-refunded,
      discount:item.discountAmount||0,cost:null,cashier:receipt.who,reason:item.discountReason||'No manual discount',
      approvedBy:item.discountApprovedBy||''};
  }));
}
function ownerGroupedItems(r,key){
  const groups=new Map();
  for(const item of ownerReportItems(r)){
    const id=item[key],g=groups.get(id)||{label:id,net:0,discount:0,qty:0,unit:item.unit,cost:0,scale:item.scale||1};
    g.net+=item.net;g.discount+=item.discount;g.qty+=item.qty;
    g.cost=g.cost===null||item.cost===null?null:g.cost+item.cost;groups.set(id,g);
  }
  return [...groups.values()].sort((a,b)=>b.net-a.net);
}
function ownerDailyReport(r){
  return (r.range?.dates||[]).map(date=>{
    const rows=r.rows.filter(row=>row.day===date);
    return {label:reportDate(date).replace(' 2026',''),date,
      amount:rows.length?rows.reduce((n,row)=>n+row.net,0):null,
      incomplete:rows.length!==r.phones.length||rows.some(row=>row.state!=='current')};
  });
}
