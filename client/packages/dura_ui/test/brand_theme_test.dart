// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:math' as math;

import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

double contrast(Color a, Color b) {
  final first = a.computeLuminance();
  final second = b.computeLuminance();
  return (math.max(first, second) + 0.05) / (math.min(first, second) + 0.05);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('approved Shop Sign identity reaches the shared app theme', () {
    final theme = DuraTheme.light;
    expect(theme.colorScheme.primary, const Color(0xffc3452d));
    expect(theme.colorScheme.secondary, const Color(0xff252525));
    expect(theme.scaffoldBackgroundColor, Colors.white);
    expect(theme.appBarTheme.backgroundColor, const Color(0xfff4f0e8));
  });

  for (final theme in [DuraTheme.light, DuraTheme.dark]) {
    test('${theme.brightness.name} text and primary actions stay readable', () {
      final scheme = theme.colorScheme;
      for (final pair in [
        (scheme.onSurface, scheme.surface),
        (scheme.onSurfaceVariant, scheme.surface),
        (scheme.onPrimary, scheme.primary),
        (scheme.onPrimaryContainer, scheme.primaryContainer),
        (scheme.onError, scheme.error),
        (scheme.onErrorContainer, scheme.errorContainer),
      ]) {
        expect(contrast(pair.$1, pair.$2), greaterThanOrEqualTo(4.5));
      }
      final button = theme.filledButtonTheme.style!;
      final background = button.backgroundColor!.resolve({})!;
      final foreground = button.foregroundColor!.resolve({})!;
      expect(background, const Color(0xffc3452d));
      expect(contrast(foreground, background), greaterThanOrEqualTo(4.5));
    });
  }
}
