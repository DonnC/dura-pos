// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

import '../layout/dura_window.dart';
import '../theme/dura_context.dart';

/// The band at the top of the app: the Shop Sign, which shop and who is
/// serving, and one status line that says where the records stand.
///
/// At large text sizes the wordmark steps aside, so the words keep their room.
class DuraShopHeader extends StatelessWidget {
  const DuraShopHeader({
    required this.mark,
    required this.title,
    required this.status,
    this.subtitle,
    this.avatarLabel,
    this.statusNeedsAttention = false,
    this.onStatusTap,
    super.key,
  });

  /// The Shop Sign wordmark, supplied by the app.
  final Widget mark;

  /// The shop's name.
  final String title;

  /// Where and who: "Front counter · Chipo · Owner".
  final String? subtitle;

  /// The person's initial, in a circle.
  final String? avatarLabel;

  /// In words: "Practice shop · Saved on this phone".
  final String status;

  /// Shows the status in the warning colour, as when sales are waiting.
  final bool statusNeedsAttention;

  /// Opens the plain explanation behind the status.
  final VoidCallback? onStatusTap;

  /// Above this text scale the wordmark is hidden.
  static const markHiddenAbove = 1.5;

  @override
  Widget build(BuildContext context) {
    final tokens = context.dura;
    final colors = tokens.colors;
    final space = tokens.space;
    final largeText =
        MediaQuery.textScalerOf(context).scale(1) > markHiddenAbove;
    final statusColor = statusNeedsAttention ? colors.warnInk : colors.muted;
    return Material(
      color: colors.chrome,
      child: SafeArea(
        bottom: false,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final gutter = constraints.maxWidth <= DuraWindow.narrowUpTo
                ? space.narrowGutter
                : space.gutter;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: EdgeInsets.fromLTRB(
                    gutter,
                    space.sm,
                    gutter,
                    space.xxs,
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (!largeText) ...[
                              SizedBox(
                                height: tokens.sizes.markHeight,
                                child: mark,
                              ),
                              SizedBox(height: space.xxs),
                            ],
                            Semantics(
                              header: true,
                              child: Text(title, style: tokens.text.strong),
                            ),
                            if (subtitle case final detail?)
                              Text(
                                detail,
                                style: tokens.text.caption.copyWith(
                                  color: colors.muted,
                                ),
                              ),
                          ],
                        ),
                      ),
                      if (avatarLabel case final initial?)
                        Container(
                          width: tokens.sizes.avatar,
                          height: tokens.sizes.avatar,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: colors.soft,
                            border: Border.all(color: colors.line),
                          ),
                          child: Text(initial, style: tokens.text.strong),
                        ),
                    ],
                  ),
                ),
                InkWell(
                  onTap: onStatusTap,
                  child: ConstrainedBox(
                    constraints: BoxConstraints(minHeight: tokens.sizes.tap),
                    child: Padding(
                      padding: EdgeInsets.symmetric(horizontal: gutter),
                      child: Row(
                        children: [
                          Container(
                            width: tokens.sizes.statusDot,
                            height: tokens.sizes.statusDot,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: statusNeedsAttention
                                  ? colors.warnInk
                                  : colors.actionInk,
                            ),
                          ),
                          SizedBox(width: space.xs),
                          Expanded(
                            child: Text(
                              status,
                              style: tokens.text.caption.copyWith(
                                color: statusColor,
                              ),
                            ),
                          ),
                          if (onStatusTap != null)
                            ExcludeSemantics(
                              child: Icon(
                                Icons.chevron_right,
                                size: tokens.sizes.smallIcon,
                                color: statusColor,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
