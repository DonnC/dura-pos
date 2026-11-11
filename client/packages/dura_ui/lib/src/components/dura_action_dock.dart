// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

import '../layout/dura_window.dart';
import '../theme/dura_context.dart';

/// The strip at the bottom of a screen that holds its one main action, and
/// anything that belongs with it, such as the basket line above "Take payment".
class DuraActionDock extends StatelessWidget {
  const DuraActionDock({required this.children, super.key});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final tokens = context.dura;
    return LayoutBuilder(
      builder: (context, constraints) {
        final gutter = constraints.maxWidth <= DuraWindow.narrowUpTo
            ? tokens.space.narrowGutter
            : tokens.space.gutter;
        return DecoratedBox(
          decoration: BoxDecoration(
            color: tokens.colors.paper,
            border: Border(top: BorderSide(color: tokens.colors.line)),
          ),
          child: Padding(
            padding: EdgeInsets.symmetric(
              horizontal: gutter,
              vertical: tokens.space.xs,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: children,
            ),
          ),
        );
      },
    );
  }
}
