// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/foundation.dart';

/// Fixed sizes: touch targets, controls and layout limits.
@immutable
final class DuraSizes {
  const DuraSizes({
    this.tap = 48,
    this.mainAction = 56,
    this.field = 52,
    this.amountField = 64,
    this.navItem = 56,
    this.avatar = 48,
    this.icon = 22,
    this.smallIcon = 17,
    this.listIcon = 39,
    this.statusDot = 6,
    this.navIndicator = 3,
    this.focusRing = 3,
    this.accentEdge = 3,
    this.markHeight = 32,
    this.contentWidth = 560,
    this.railWidth = 96,
  });

  /// The smallest touch target anywhere: 48 logical pixels.
  final double tap;

  /// The height of the one main action at the bottom.
  final double mainAction;
  final double field;
  final double amountField;
  final double navItem;
  final double avatar;
  final double icon;
  final double smallIcon;

  /// The rounded square behind a list row's icon.
  final double listIcon;
  final double statusDot;

  /// The red line above the selected navigation item.
  final double navIndicator;
  final double focusRing;

  /// The red edge on the summary card and the change box.
  final double accentEdge;

  /// The height of the Shop Sign wordmark in the header.
  final double markHeight;

  /// The widest a single column of content grows on a tablet or computer.
  final double contentWidth;
  final double railWidth;
}
