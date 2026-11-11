// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

import 'dura_tokens.dart';

/// `context.dura.colors.brand`, `context.dura.type.display` and so on.
extension DuraContext on BuildContext {
  /// The tokens of the nearest Dura theme.
  ///
  /// Throws when the app's theme isn't a [DuraTheme], so a screen can't
  /// quietly fall back to Material's defaults.
  DuraTokens get dura {
    final tokens = Theme.of(this).extension<DuraTokens>();
    if (tokens == null) {
      throw FlutterError(
        'No DuraTokens in the theme. Use DuraTheme.light or DuraTheme.dark.',
      );
    }
    return tokens;
  }
}
