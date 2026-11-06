// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import '../money/money.dart';

/// A mobile-money payment to start.
///
/// [reference] identifies this attempt. Starting the same reference again
/// never charges twice, so a new attempt needs a new one.
final class PaymentRequest {
  const PaymentRequest({
    required this.reference,
    required this.provider,
    required this.method,
    required this.amount,
    required this.payer,
    this.saleId,
  });

  final String reference;
  final String provider;
  final String method;
  final Money amount;
  final String payer;
  final String? saleId;
}
