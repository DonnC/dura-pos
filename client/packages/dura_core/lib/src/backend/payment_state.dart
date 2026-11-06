// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// Where a payment stands.
enum PaymentState {
  /// The customer has been prompted.
  pending,

  /// The provider's own status check confirmed it, for the right amount.
  paid,

  /// Refused or not completed. A new attempt needs a new reference.
  failed,

  /// Cancelled or refunded at the provider.
  cancelled,

  /// No usable reply. It may or may not have gone through, so it's never
  /// charged again automatically.
  unknown,
}
