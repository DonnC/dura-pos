// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// Accepts operational metadata, never messages, payloads or credentials.
abstract interface class Diagnostics {
  Future<void> record(
    String event, {
    String? traceId,
    Map<String, Object?> fields = const {},
  });
}
