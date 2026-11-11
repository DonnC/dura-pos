// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

import '../theme/dura_context.dart';
import 'dura_notice_tone.dart';

/// A message in words, never colour alone. Warnings and errors are announced
/// to screen readers when they appear.
class DuraNotice extends StatelessWidget {
  const DuraNotice({
    required this.message,
    this.tone = DuraNoticeTone.hint,
    super.key,
  });

  const DuraNotice.warning({required this.message, super.key})
    : tone = DuraNoticeTone.warning;

  const DuraNotice.error({required this.message, super.key})
    : tone = DuraNoticeTone.error;

  final String message;
  final DuraNoticeTone tone;

  @override
  Widget build(BuildContext context) {
    final tokens = context.dura;
    final colors = tokens.colors;
    final space = tokens.space;
    final (background, foreground, icon) = switch (tone) {
      DuraNoticeTone.hint => (null, colors.muted, Icons.verified_user_outlined),
      DuraNoticeTone.warning => (colors.warn, colors.warnInk, null),
      DuraNoticeTone.error => (
        colors.errorContainer,
        colors.onErrorContainer,
        Icons.error_outline,
      ),
    };
    final body = Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (icon != null) ...[
          ExcludeSemantics(
            child: Icon(icon, size: tokens.sizes.smallIcon, color: foreground),
          ),
          SizedBox(width: space.xs),
        ],
        Expanded(
          child: Text(
            message,
            style: tokens.text.small.copyWith(color: foreground),
          ),
        ),
      ],
    );
    return Semantics(
      liveRegion: tone != DuraNoticeTone.hint,
      container: true,
      child: background == null
          ? Padding(
              padding: EdgeInsets.symmetric(vertical: space.sm),
              child: body,
            )
          : Container(
              width: double.infinity,
              padding: EdgeInsets.all(space.sm),
              decoration: BoxDecoration(
                color: background,
                borderRadius: BorderRadius.all(tokens.radii.small),
              ),
              child: body,
            ),
    );
  }
}
