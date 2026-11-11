// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

import '../theme/dura_context.dart';

/// A label above a field, and its error below, read as one by screen readers.
class DuraLabelled extends StatelessWidget {
  const DuraLabelled({
    required this.label,
    required this.child,
    this.errorText,
    super.key,
  });

  final String label;
  final Widget child;

  /// What to correct, in plain words. Announced when it appears.
  final String? errorText;

  @override
  Widget build(BuildContext context) {
    final tokens = context.dura;
    return MergeSemantics(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(label, style: tokens.text.label),
          SizedBox(height: tokens.space.xs),
          child,
          if (errorText case final error?) ...[
            SizedBox(height: tokens.space.xs),
            Semantics(
              liveRegion: true,
              child: Text(
                error,
                style: tokens.text.small.copyWith(color: tokens.colors.error),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
