// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

// The workbook templates this hub version creates files from, per pricing
// currency (headings carry it). Each is pinned to a Dura release URL and its
// SHA-256 from backend/templates/dist/manifest.json; a template whose bytes
// don't match is never used. Empty URLs mean not released yet.

var TEMPLATE_MANIFEST_ = {
  USD: { myShop: { url: '', sha256: '' }, month: { url: '', sha256: '' } },
  ZWG: { myShop: { url: '', sha256: '' }, month: { url: '', sha256: '' } },
  ZAR: { myShop: { url: '', sha256: '' }, month: { url: '', sha256: '' } },
};

// The cells the hub fills after converting a template. They must match the
// `cells` section of backend/templates/dist/manifest.json; a test compares them.
var TEMPLATE_CELLS_ = {
  myShop: { businessName: 'Settings!B2', hubVersion: 'Settings!B27', dataYear: 'Settings!B29' },
  month: { period: 'Summary!E1' },
};
