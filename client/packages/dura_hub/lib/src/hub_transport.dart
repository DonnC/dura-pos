// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// Carries one request to the hub and returns the reply's text.
///
/// Throws a `BackendFailure` of kind `retryableUnavailable` if there's no
/// usable reply. It never retries: only the caller knows what's safe to repeat.
abstract interface class HubTransport {
  Future<String> post(Uri address, String body);
}
