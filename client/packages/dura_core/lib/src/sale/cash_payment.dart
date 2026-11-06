// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import '../money/money.dart';

/// Cash handed over for a sale, and the change given back.
///
/// [applied] is what counts towards the sale: received minus change. Cash
/// received is never itself revenue.
final class CashPayment {
  factory CashPayment({required Money total, required Money received}) {
    if (received.currency != total.currency) {
      throw ArgumentError(
        'Cash in ${received.currency} needs a conversion to '
        '${total.currency}.',
      );
    }
    if (received.compareTo(total) < 0) {
      throw ArgumentError('$received is less than the total of $total.');
    }
    return CashPayment._(received, received - total, total);
  }

  const CashPayment._(this.received, this.change, this.applied);

  final Money received;
  final Money change;
  final Money applied;
}
