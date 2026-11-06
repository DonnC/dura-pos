// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import '../money/money.dart';
import 'payment_state.dart';

/// A payment as the backend last knew it.
final class PaymentStatus {
  const PaymentStatus({
    required this.reference,
    required this.state,
    required this.amount,
    this.note,
  });

  final String reference;
  final PaymentState state;
  final Money amount;

  /// Why it failed, when the provider said.
  final String? note;
}
