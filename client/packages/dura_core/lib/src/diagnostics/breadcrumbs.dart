// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:collection';

/// The last few places the app went, so a problem report says what led to
/// the problem. Only short identifiers are kept, such as a screen's tracker
/// ID (`SELL-01`), never names, amounts or typed text.
final class Breadcrumbs {
  Breadcrumbs({this.limit = defaultLimit}) : assert(limit > 0);

  static const defaultLimit = 20;
  static final _identifier = RegExp(r'^[A-Za-z0-9_.-]{1,64}$');

  final int limit;
  final _trail = ListQueue<String>();

  /// Adds [step] unless it repeats the last one or isn't an identifier.
  void add(String step) {
    if (!_identifier.hasMatch(step)) return;
    if (_trail.isNotEmpty && _trail.last == step) return;
    _trail.addLast(step);
    while (_trail.length > limit) {
      _trail.removeFirst();
    }
  }

  /// Oldest first.
  List<String> get trail => List.unmodifiable(_trail);

  String? get current => _trail.isEmpty ? null : _trail.last;
}
