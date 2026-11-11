// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'app_routes.dart';

/// Every screen the app can show, by its ID in
/// `handbook/design/ui-tracker.md`.
///
/// `melos run check` fails when a screen here is missing from the tracker, or
/// the tracker ticks a screen as built that isn't here. The same ID names the
/// screen in usage records and problem reports.
enum TrackedScreen {
  sell('SELL-01', AppRoutes.sell),
  stock('STOCK-01', AppRoutes.stock),
  money('MONEY-01', AppRoutes.money),
  shop('SHOP-01', AppRoutes.shop),
  diagnostics('SHOP-13', AppRoutes.diagnostics);

  const TrackedScreen(this.id, this.path);

  final String id;
  final String path;

  /// The bottom-bar destinations, in order.
  static const tabs = [sell, stock, money, shop];

  static TrackedScreen? forPath(String path) {
    for (final screen in values) {
      if (screen.path == path) return screen;
    }
    return null;
  }
}
