// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'phone_status.dart';

/// A backend's health, for the owner's screen. It holds no secrets.
final class BackendStatus {
  const BackendStatus({
    required this.version,
    required this.protocols,
    required this.business,
    required this.pricingCurrency,
    required this.batchesWaiting,
    required this.rowsSkipped,
    required this.paymentAccounts,
    required this.phones,
  });

  final String version;
  final List<int> protocols;
  final String business;
  final String pricingCurrency;

  /// Batches stored but not yet in the owner's records.
  final int batchesWaiting;
  final int rowsSkipped;

  /// The provider and currency of each set of keys, e.g. `paynow:USD`.
  final List<String> paymentAccounts;
  final List<PhoneStatus> phones;
}
