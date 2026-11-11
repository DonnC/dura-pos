// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

import '../theme/dura_context.dart';

/// A setting that is on or off, with what it does in plain words. The whole
/// row is the touch target.
class DuraToggleRow extends StatelessWidget {
  const DuraToggleRow({
    required this.title,
    required this.value,
    this.subtitle,
    this.onChanged,
    super.key,
  });

  final String title;
  final String? subtitle;
  final bool value;

  /// Without it the row is shown but can't be changed.
  final ValueChanged<bool>? onChanged;

  @override
  Widget build(BuildContext context) {
    final tokens = context.dura;
    final colors = tokens.colors;
    final change = onChanged;
    return MergeSemantics(
      child: Material(
        type: MaterialType.transparency,
        child: InkWell(
          onTap: change == null ? null : () => change(!value),
          child: Container(
            padding: EdgeInsets.symmetric(vertical: tokens.space.md),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: colors.line)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: tokens.text.rowTitle),
                      if (subtitle case final detail?) ...[
                        SizedBox(height: tokens.space.xxs),
                        Text(
                          detail,
                          style: tokens.text.small.copyWith(
                            color: colors.muted,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                SizedBox(width: tokens.space.md),
                Switch(
                  value: value,
                  onChanged: change,
                  thumbColor: WidgetStateProperty.resolveWith(
                    (states) => states.contains(WidgetState.selected)
                        ? colors.onActionInk
                        : colors.muted,
                  ),
                  trackColor: WidgetStateProperty.resolveWith(
                    (states) => states.contains(WidgetState.selected)
                        ? colors.actionInk
                        : colors.soft,
                  ),
                  trackOutlineColor: WidgetStatePropertyAll(colors.line),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
