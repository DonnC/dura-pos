// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

import '../theme/dura_context.dart';

/// One line in a list: "Recent sales · Find a receipt", or "Expected cash ·
/// USD 70.50". With [onTap] it opens something, and shows a chevron.
class DuraListRow extends StatelessWidget {
  const DuraListRow({
    required this.title,
    this.subtitle,
    this.icon,
    this.value,
    this.onTap,
    this.divider = true,
    super.key,
  });

  final String title;
  final String? subtitle;
  final IconData? icon;

  /// A short value on the right. Amounts must include their currency.
  final String? value;
  final VoidCallback? onTap;

  /// A line under the row.
  final bool divider;

  /// Text scales above this count as large text.
  static const largeTextFrom = 1.5;

  @override
  Widget build(BuildContext context) {
    final tokens = context.dura;
    final colors = tokens.colors;
    final space = tokens.space;
    // At large text the icon steps aside and the value moves under the title,
    // so no word is broken to keep them side by side.
    final largeText = MediaQuery.textScalerOf(context).scale(1) > largeTextFrom;
    final valueBeside = value != null && !largeText;
    final row = Row(
      children: [
        if (icon != null && !largeText) ...[
          Container(
            width: tokens.sizes.listIcon,
            height: tokens.sizes.listIcon,
            decoration: BoxDecoration(
              color: colors.chrome,
              borderRadius: BorderRadius.all(tokens.radii.medium),
            ),
            child: Icon(icon, size: tokens.sizes.icon, color: colors.actionInk),
          ),
          SizedBox(width: space.sm),
        ],
        Expanded(
          flex: 3,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: tokens.text.rowTitle),
              if (subtitle case final detail?) ...[
                SizedBox(height: space.xxs),
                Text(
                  detail,
                  style: tokens.text.small.copyWith(color: colors.muted),
                ),
              ],
              if (value case final shown? when largeText) ...[
                SizedBox(height: space.xxs),
                Text(shown, style: tokens.text.rowValue),
              ],
            ],
          ),
        ),
        if (value case final shown? when valueBeside) ...[
          SizedBox(width: space.sm),
          Flexible(
            flex: 2,
            child: Align(
              alignment: AlignmentDirectional.centerEnd,
              child: Text(
                shown,
                textAlign: TextAlign.end,
                style: tokens.text.rowValue,
              ),
            ),
          ),
        ],
        if (onTap != null) ...[
          SizedBox(width: space.xs),
          ExcludeSemantics(
            child: Icon(
              Icons.chevron_right,
              size: tokens.sizes.icon,
              color: colors.actionInk,
            ),
          ),
        ],
      ],
    );
    return MergeSemantics(
      child: Semantics(
        button: onTap != null,
        child: Material(
          type: MaterialType.transparency,
          child: InkWell(
            onTap: onTap,
            child: Container(
              constraints: BoxConstraints(
                minHeight: tokens.sizes.tap + space.md,
              ),
              padding: EdgeInsets.symmetric(vertical: space.sm),
              decoration: divider
                  ? BoxDecoration(
                      border: Border(bottom: BorderSide(color: colors.line)),
                    )
                  : null,
              alignment: Alignment.centerLeft,
              child: row,
            ),
          ),
        ),
      ),
    );
  }
}
