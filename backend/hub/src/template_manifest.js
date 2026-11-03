// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

// The workbook templates this hub version creates files from: each pinned to
// a Dura release URL and its SHA-256. A release fills these in; a template
// whose bytes don't match its hash is never used. Empty means not released.

var TEMPLATE_MANIFEST_ = {
  myShop: { url: '', sha256: '' },
  month: { url: '', sha256: '' },
};
