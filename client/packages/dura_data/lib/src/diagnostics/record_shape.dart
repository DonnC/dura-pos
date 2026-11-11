// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// Builds the JSON record for one line of a rotating log, keeping only what
/// that log allows and staying under [maxBytes].
typedef RecordShape = Map<String, Object?> Function(
  String event,
  String? traceId,
  Map<String, Object?> fields,
  int maxBytes,
);
