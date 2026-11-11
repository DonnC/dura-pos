// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';

/// A tab whose work arrives in a later update. It says so plainly, rather
/// than showing buttons that do nothing.
class TabPlaceholder extends StatelessWidget {
  const TabPlaceholder({
    required this.title,
    required this.subtitle,
    required this.later,
    this.children = const [],
    super.key,
  });

  final String title;
  final String subtitle;

  /// When this tab's work opens, in plain words.
  final String later;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => DuraPage(
    children: [
      DuraPageHeading(title: title, subtitle: subtitle),
      DuraNotice(message: later),
      ...children,
    ],
  );
}
