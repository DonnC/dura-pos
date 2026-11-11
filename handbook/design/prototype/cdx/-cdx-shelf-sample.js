// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// Opt-in fictional larger shop for responsive review. Existing fixtures stay small.
if(q.get('shelf')==='full'&&q.get('fresh')==='1'){
  const shelfSample=[
    ['rice-pack','Rice','1 kg',240,'Food','RC'],
    ['salt','Salt','500 g',50,'Food','SL'],
    ['flour','Plain flour','2 kg',220,'Food','FL'],
    ['tea','Tea bags','40 bags',180,'Food','TE'],
    ['peanut-butter','Peanut butter','375 g',200,'Food','PB'],
    ['beans','Baked beans','410 g',120,'Food','BE'],
    ['pasta','Spaghetti','500 g',100,'Food','SP'],
    ['biscuits','Biscuits','200 g',80,'Food','BI'],
    ['water','Still water','500 ml',50,'Drinks','WA'],
    ['cola','Cola','500 ml',100,'Drinks','CO'],
    ['juice','Orange juice','1 litre',180,'Drinks','OJ'],
    ['maheu','Maheu','1 litre',120,'Drinks','MA'],
    ['soap','Bath soap','1 bar',75,'Household','SO'],
    ['washing-powder','Washing powder','500 g',150,'Household','WP'],
    ['dish-liquid','Dishwashing liquid','750 ml',180,'Household','DL'],
    ['matches','Matches','1 box',10,'Household','MT'],
    ['candles','Candles','6 candles',100,'Household','CA'],
    ['tissue','Toilet tissue','4 rolls',180,'Household','TT']
  ];
  s.products.push(...shelfSample.map(([id,name,unit,cents,cat,short],i)=>
    ({id,name,unit,cents,cat,short,stock:12+i,stockUnit:'packs',favourite:i<6})));
  s.products.slice(0,6).forEach(p=>p.favourite=true);
}
