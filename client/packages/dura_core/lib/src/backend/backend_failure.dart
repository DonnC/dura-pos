// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'backend_failure_kind.dart';

/// A backend refused a request, or couldn't be reached.
///
/// [message] is for logs. The app shows its own words, chosen from [kind] and
/// [code].
final class BackendFailure implements Exception {
  const BackendFailure(this.kind, this.code, [this.message = '']);

  final BackendFailureKind kind;
  final String code;
  final String message;

  @override
  String toString() => 'BackendFailure(${kind.name}, $code)';
}
