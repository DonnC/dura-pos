// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

import '../theme/dura_context.dart';

/// A filter choice, such as "Favourites" or "Drinks". The selected chip is
/// filled in ink; screen readers hear "selected" as well.
class DuraChip extends StatelessWidget {
  const DuraChip({
    required this.label,
    required this.selected,
    this.onSelected,
    super.key,
  });

  final String label;
  final bool selected;
  final VoidCallback? onSelected;

  @override
  Widget build(BuildContext context) {
    final tokens = context.dura;
    final colors = tokens.colors;
    final shape = StadiumBorder(
      side: BorderSide(color: selected ? colors.actionInk : colors.line),
    );
    return Semantics(
      button: true,
      selected: selected,
      enabled: onSelected != null,
      excludeSemantics: true,
      label: label,
      child: Material(
        color: selected ? colors.actionInk : colors.paper,
        shape: shape,
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onSelected,
          customBorder: shape,
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: tokens.sizes.tap),
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: tokens.space.md),
              child: Center(
                widthFactor: 1,
                heightFactor: 1,
                child: Text(
                  label,
                  style: tokens.text.label.copyWith(
                    color: selected ? colors.onActionInk : colors.ink,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
