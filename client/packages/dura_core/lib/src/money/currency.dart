// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// A currency a shop prices in or accepts, identified by its code.
///
/// [scale] is the number of decimal places an amount may carry. There is no
/// default currency: the owner chooses the pricing currency at setup.
final class Currency {
  const Currency(this.code, {required this.scale}) : assert(scale >= 0);

  static const usd = Currency('USD', scale: 2);
  static const zwg = Currency('ZWG', scale: 2);
  static const zar = Currency('ZAR', scale: 2);

  final String code;
  final int scale;

  @override
  bool operator ==(Object other) =>
      other is Currency && other.code == code && other.scale == scale;

  @override
  int get hashCode => Object.hash(code, scale);

  @override
  String toString() => code;
}
