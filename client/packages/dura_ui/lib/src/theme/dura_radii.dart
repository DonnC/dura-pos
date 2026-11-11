// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/widgets.dart';

/// Corner rounding, from small tags to the bottom sheet.
@immutable
final class DuraRadii {
  const DuraRadii({
    this.small = const Radius.circular(10),
    this.medium = const Radius.circular(12),
    this.large = const Radius.circular(16),
    this.card = const Radius.circular(18),
    this.sheet = const Radius.circular(24),
    this.pill = const Radius.circular(30),
  });

  /// Suggested amounts, notices and toasts.
  final Radius small;

  /// Buttons, fields and list icons.
  final Radius medium;

  /// Product tiles.
  final Radius large;

  /// The summary card.
  final Radius card;

  /// The top of a bottom sheet.
  final Radius sheet;

  /// Filter chips.
  final Radius pill;
}
