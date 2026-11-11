// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

import '../theme/dura_context.dart';
import 'dura_window.dart';

/// The standard screen body: content that scrolls, with the one main action
/// held below it in a [dock], within reach of the thumb.
///
/// On a wide window the column stays a readable width and sits in the middle.
class DuraPage extends StatelessWidget {
  const DuraPage({
    required this.children,
    this.dock,
    this.controller,
    super.key,
  });

  final List<Widget> children;

  /// Usually a [DuraActionDock] holding the screen's main action.
  final Widget? dock;
  final ScrollController? controller;

  @override
  Widget build(BuildContext context) {
    final tokens = context.dura;
    return LayoutBuilder(
      builder: (context, constraints) {
        final gutter = constraints.maxWidth <= DuraWindow.narrowUpTo
            ? tokens.space.narrowGutter
            : tokens.space.gutter;
        return Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: tokens.sizes.contentWidth),
            child: Column(
              children: [
                Expanded(
                  child: ListView(
                    controller: controller,
                    padding: EdgeInsets.fromLTRB(
                      gutter,
                      tokens.space.md,
                      gutter,
                      tokens.space.md,
                    ),
                    children: children,
                  ),
                ),
                ?dock,
              ],
            ),
          ),
        );
      },
    );
  }
}
