// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// Original, deliberately generic packaging: recognition without brand dependence.
const productArt = {
  bread: `<ellipse cx="54" cy="77" rx="32" ry="4" fill="#d8cbb6"/>
    <path d="M26 31q0-15 17-14h24q17 1 17 17l-5 40H30z" fill="#e8bc78"/>
    <path d="M27 31q0-13 15-13h27q14 2 14 15" fill="#c88a40"/>
    <path d="M38 25q3-8 10-7m7 7q3-8 10-7m7 10q2-6 7-6" fill="none"
      stroke="#efcb91" stroke-width="3" stroke-linecap="round"/>
    <path d="M28 43h53l-3 27H31z" fill="#f8f1df"/>
    <rect x="30" y="49" width="49" height="15" fill="#c3452d"/>
    <text x="54" y="59" fill="#fff" text-anchor="middle" font-size="8"
      font-family="sans-serif" font-weight="bold">DAILY BREAD</text>
    <path d="M32 75h44" stroke="#b27d3e" stroke-width="2"/>`,
  milk: `<ellipse cx="56" cy="78" rx="22" ry="3" fill="#cdd5c6"/>
    <path d="M36 25l10-13h24l9 13v51H36z" fill="#fcfbef" stroke="#d9d1c8"/>
    <path d="M36 25l10-13v13zm10-13h24l9 13H46z" fill="#e1d8ca"/>
    <path d="M68 25h11v51H68z" fill="#e8dfd3"/>
    <path d="M36 41q16-9 32 1v28H36z" fill="#c3452d"/>
    <text x="52" y="53" fill="white" text-anchor="middle" font-size="9"
      font-family="sans-serif" font-weight="bold">MILK</text>
    <text x="52" y="64" fill="#f4f0e8" text-anchor="middle" font-size="6"
      font-family="sans-serif">FRESH · 1 L</text><circle cx="64" cy="20" r="4" fill="white"/>`,
  eggs: `<ellipse cx="55" cy="75" rx="35" ry="4" fill="#d8cec1"/>
    <path d="M19 43h72l-7 29H26z" fill="#b9a78c"/>
    <path d="M21 40h68l-2 19H23z" fill="#e0d3b9"/>
    <g fill="#f7e6c9" stroke="#d1b68f"><ellipse cx="34" cy="37" rx="10" ry="14"/>
    <ellipse cx="55" cy="36" rx="10" ry="14"/><ellipse cx="76" cy="37" rx="10" ry="14"/></g>
    <path d="M22 47h66l-3 12H25z" fill="#d6c7a9"/>
    <rect x="42" y="50" width="27" height="17" rx="2" fill="#faf4e5"/>
    <text x="55" y="60" text-anchor="middle" fill="#6d5d40" font-size="7"
      font-family="sans-serif" font-weight="bold">6 EGGS</text>`,
  oil: `<ellipse cx="54" cy="78" rx="21" ry="3" fill="#d7d2bc"/>
    <rect x="45" y="10" width="19" height="9" rx="2" fill="#615b55"/>
    <path d="M45 19h19v9l9 12v31q0 6-7 6H42q-7 0-7-6V40l10-12z"
      fill="#e3d3ae" stroke="#c1af8e"/>
    <path d="M42 40l7-11v-8" stroke="#f4ead7" stroke-width="3" fill="none"/>
    <rect x="35" y="44" width="38" height="22" fill="#faf5de"/>
    <rect x="35" y="44" width="38" height="7" fill="#c3452d"/>
    <text x="54" y="61" fill="#c3452d" text-anchor="middle" font-size="8"
      font-family="sans-serif" font-weight="bold">COOKING OIL</text>`,
  meal: `<ellipse cx="55" cy="78" rx="28" ry="3" fill="#d8c9b7"/>
    <path d="M33 14h43l-1 9 5 51q-23 7-50 0l5-51z" fill="#eee0bf" stroke="#dbcca5"/>
    <path d="M33 14h43v7H34zm-2 49h48v11q-23 6-49 0z" fill="#ba7943"/>
    <path d="M34 32h42l2 30H32z" fill="#fcf5df"/>
    <path d="M54 36v13m-5-10 5 5 5-5m-10 6 5 5 5-5" stroke="#b58c38"
      fill="none" stroke-width="2"/>
    <text x="55" y="57" fill="#705334" text-anchor="middle" font-size="7"
      font-family="sans-serif" font-weight="bold">MEALIE MEAL</text>`,
  sugar: `<ellipse cx="55" cy="78" rx="24" ry="3" fill="#d7ccbd"/>
    <path d="M35 18h41l-3 8 5 48q-24 7-46 0l5-48z" fill="#f3ecdd" stroke="#d7cbb4"/>
    <path d="M35 18h41l-1 7H36z" fill="#bd8359"/>
    <path d="M35 40h40l2 28H33z" fill="#a66146"/>
    <text x="55" y="53" fill="white" text-anchor="middle" font-size="9"
      font-family="sans-serif" font-weight="bold">SUGAR</text>
    <text x="55" y="62" fill="#f5e1d2" text-anchor="middle" font-size="6"
      font-family="sans-serif">BROWN · 2 KG</text>`
};
function art(name) {
  return `<svg viewBox="0 0 110 90" aria-hidden="true">${productArt[name]||
    '<path d="M30 25h50v50H30z" fill="#d8c69e"/><path d="M30 25l25-10 25 10-25 12z" fill="#eaddbd"/><path d="M55 37v38" stroke="#ad9975"/>'}</svg>`;
}
const iconPaths = {
  sell: '<path d="m3 8 3-4h12l3 4v12H3zM3 8h18M8 8v3a4 4 0 0 0 8 0V8"/>',
  stock: '<path d="m3 7 9-4 9 4v11l-9 4-9-4zM3 7l9 4 9-4M12 11v11M7 5l10 4"/>',
  money: '<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M16 10h5v6h-5zM3 9h17"/>',
  shop: '<path d="M3 10h18l-2-6H5zM4 10v11h16V10M9 21v-7h6v7M2 10q2 5 5 0 2 5 5 0 2 5 5 0 3 5 5 0"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
  scan: '<path d="M3 8V3h5m8 0h5v5M3 16v5h5m8 0h5v-5M7 7v10m4-10v10m3-10v10m3-10v10"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  back: '<path d="M19 12H5m5-5-5 5 5 5"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  shield: '<path d="m12 3 8 3v6q0 6-8 10-8-4-8-10V6z"/><path d="m8 12 3 3 5-6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  cash: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M5 9v6m14-6v6"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/>',
  receipt: '<path d="M5 3h14v19l-3-2-4 2-4-2-3 2zM8 7h8m-8 4h8m-8 4h5"/>',
  people: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-17a3 3 0 0 1 0 6m3 11v-3a6 6 0 0 0-2-4"/>',
  upload: '<path d="M4 16v5h16v-5M12 17V3m-5 5 5-5 5 5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M10 2h4l1 4 3-1 2 3-2 3 2 3-2 3-3-1-1 4h-4l-1-4-3 1-2-3 2-3-2-3 2-3 3 1z"/>'
};
function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || iconPaths.chevron}</svg>`;
}
