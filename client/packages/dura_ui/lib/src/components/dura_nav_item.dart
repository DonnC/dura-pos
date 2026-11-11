// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/widgets.dart';

/// One destination in the bottom bar or the side rail.
@immutable
final class DuraNavItem {
  const DuraNavItem({required this.icon, required this.label});

  final IconData icon;

  /// One or two plain words: "Sell", "My shop".
  final String label;
}
