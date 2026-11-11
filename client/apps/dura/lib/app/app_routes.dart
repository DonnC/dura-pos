// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// Every path in the app. Sell is home.
abstract final class AppRoutes {
  static const sell = '/sell';
  static const stock = '/stock';
  static const money = '/money';
  static const shop = '/shop';
  static const diagnosticsSegment = 'diagnostics';
  static const diagnostics = '$shop/$diagnosticsSegment';
}
