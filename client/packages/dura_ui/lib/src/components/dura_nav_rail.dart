// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

import '../theme/dura_context.dart';
import 'dura_nav_button.dart';
import 'dura_nav_item.dart';

/// The side navigation on a tablet, a phone on its side, or a computer.
class DuraNavRail extends StatelessWidget {
  const DuraNavRail({
    required this.items,
    required this.selectedIndex,
    required this.onSelected,
    super.key,
  });

  final List<DuraNavItem> items;
  final int selectedIndex;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) {
    final tokens = context.dura;
    return Material(
      color: tokens.colors.paper,
      child: DecoratedBox(
        decoration: BoxDecoration(
          border: Border(right: BorderSide(color: tokens.colors.line)),
        ),
        child: SafeArea(
          right: false,
          child: SizedBox(
            width: tokens.sizes.railWidth,
            child: SingleChildScrollView(
              padding: EdgeInsets.symmetric(vertical: tokens.space.md),
              child: Column(
                children: [
                  for (final (index, item) in items.indexed)
                    DuraNavButton(
                      item: item,
                      selected: index == selectedIndex,
                      onTap: () => onSelected(index),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
