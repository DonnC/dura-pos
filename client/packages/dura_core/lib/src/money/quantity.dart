// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:decimal/decimal.dart';

/// How many units of a product: whole (2 loaves) or measured (1.5 kg).
///
/// Always greater than zero. Returns are separate records, not negative
/// quantities on a sale line.
final class Quantity {
  const Quantity._(this.value);

  factory Quantity.parse(String value) {
    final parsed = Decimal.tryParse(value.trim());
    if (parsed == null) {
      throw ArgumentError.value(value, 'value', 'is not a decimal number');
    }
    if (parsed <= Decimal.zero) {
      throw ArgumentError.value(value, 'value', 'must be greater than zero');
    }
    return Quantity._(parsed);
  }

  final Decimal value;

  @override
  bool operator ==(Object other) => other is Quantity && other.value == value;

  @override
  int get hashCode => value.hashCode;

  @override
  String toString() => value.toString();
}
