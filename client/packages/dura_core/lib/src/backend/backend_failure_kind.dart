// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// What the caller should do about a failure, whichever backend it came from.
enum BackendFailureKind {
  /// Fix the request. Never retry it unchanged.
  validation,

  /// The action needs the owner.
  permission,

  /// Pair again, or check the phone's clock.
  authenticationRequired,

  /// Retry later, with backoff.
  retryableUnavailable,

  /// It may or may not have happened. Keep the operation open and check it
  /// again. Never repeat a payment.
  unknownExternalOutcome,

  /// Stop, keep the local data, and report it.
  integrityConflict,
}
