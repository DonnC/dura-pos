// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

import '../theme/dura_context.dart';
import 'dura_button.dart';

/// A screen's title in plain words ("Let's sell."), what it's about, and a
/// way back when the screen was opened from another.
class DuraPageHeading extends StatelessWidget {
  const DuraPageHeading({
    required this.title,
    this.subtitle,
    this.onBack,
    this.backLabel,
    this.trailing,
    super.key,
  }) : assert(
         onBack == null || backLabel != null,
         'A back link needs its words.',
       );

  final String title;
  final String? subtitle;
  final VoidCallback? onBack;
  final String? backLabel;

  /// A small control beside the title, such as a menu.
  final Widget? trailing;

  /// Titles grow with the person's text size, up to this much.
  static const largestScale = 1.5;

  @override
  Widget build(BuildContext context) {
    final tokens = context.dura;
    final scaler = MediaQuery.textScalerOf(context)
        .clamp(maxScaleFactor: largestScale);
    return Padding(
      padding: EdgeInsets.only(bottom: tokens.space.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (onBack != null)
            Padding(
              padding: EdgeInsets.only(bottom: tokens.space.xs),
              child: DuraButton.quiet(
                label: backLabel!,
                icon: Icons.arrow_back,
                onPressed: onBack,
              ),
            ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Semantics(
                  header: true,
                  child: Text(
                    title,
                    style: tokens.text.display,
                    textScaler: scaler,
                  ),
                ),
              ),
              ?trailing,
            ],
          ),
          if (subtitle case final detail?) ...[
            SizedBox(height: tokens.space.xs),
            Text(
              detail,
              style: tokens.text.bodySmall.copyWith(color: tokens.colors.muted),
            ),
          ],
        ],
      ),
    );
  }
}
