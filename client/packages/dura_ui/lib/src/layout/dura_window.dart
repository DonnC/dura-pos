// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/widgets.dart';

/// How much room the app has, whatever the device: a phone, a tablet, a
/// browser window or a desktop. Decide layout from this, never from the
/// platform.
enum DuraWindow {
  /// Phones, and narrow windows: bottom navigation and one column.
  compact,

  /// Small tablets and phones on their side: a side rail.
  medium,

  /// Tablets and computers: a side rail, and room for two panes.
  expanded;

  static const mediumFrom = 600.0;
  static const expandedFrom = 840.0;

  /// At or under this width, pages use the narrow side margin.
  static const narrowUpTo = 350.0;

  static DuraWindow forWidth(double width) => width >= expandedFrom
      ? expanded
      : width >= mediumFrom
      ? medium
      : compact;

  /// Rebuilds only when the window's size changes, not on every inset change.
  static DuraWindow of(BuildContext context) =>
      forWidth(MediaQuery.sizeOf(context).width);

  bool get hasRail => this != compact;
}
