// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/foundation.dart';

/// Spacing steps, in logical pixels.
@immutable
final class DuraSpace {
  const DuraSpace({
    this.xxs = 4,
    this.xs = 8,
    this.sm = 12,
    this.md = 16,
    this.lg = 20,
    this.xl = 24,
    this.xxl = 32,
    this.gutter = 20,
    this.narrowGutter = 15,
  });

  final double xxs;
  final double xs;
  final double sm;
  final double md;
  final double lg;
  final double xl;
  final double xxl;

  /// The page's side margin.
  final double gutter;

  /// The side margin on the narrowest phones, at or under 350 wide.
  final double narrowGutter;
}
