// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

import '../theme/dura_context.dart';
import 'dura_nav_item.dart';

/// A destination button, shared by [DuraNavBar] and [DuraNavRail]. The
/// selected one is bold, in ink, with a red line above it.
class DuraNavButton extends StatelessWidget {
  const DuraNavButton({
    required this.item,
    required this.selected,
    required this.onTap,
    super.key,
  });

  final DuraNavItem item;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = context.dura;
    final colors = tokens.colors;
    final color = selected ? colors.actionInk : colors.muted;
    final style = tokens.text.nav.copyWith(
      color: color,
      fontWeight: selected ? FontWeight.w700 : null,
    );
    return Semantics(
      button: true,
      selected: selected,
      label: item.label,
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: tokens.sizes.navItem),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: tokens.sizes.listIcon,
                height: tokens.sizes.navIndicator,
                decoration: BoxDecoration(
                  color: selected ? colors.brand : null,
                  borderRadius: BorderRadius.all(
                    Radius.circular(tokens.sizes.navIndicator),
                  ),
                ),
              ),
              SizedBox(height: tokens.space.xs),
              Icon(item.icon, size: tokens.sizes.icon, color: color),
              SizedBox(height: tokens.space.xxs),
              Text(
                item.label,
                style: style,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              SizedBox(height: tokens.space.xxs),
            ],
          ),
        ),
      ),
    );
  }
}
