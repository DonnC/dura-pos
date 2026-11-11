// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:math' as math;

import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'font_harness.dart';

double contrast(Color a, Color b) {
  final first = a.computeLuminance();
  final second = b.computeLuminance();
  return (math.max(first, second) + 0.05) / (math.min(first, second) + 0.05);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(loadGoldenFonts);

  group('UI-01 tokens', () {
    for (final theme in [DuraTheme.light, DuraTheme.dark]) {
      final name = theme.brightness.name;
      test('$name theme carries the tokens', () {
        expect(theme.extension<DuraTokens>(), isNotNull);
      });

      test('$name words stay readable on their backgrounds', () {
        final colors = theme.extension<DuraTokens>()!.colors;
        final pairs = {
          'ink on paper': (colors.ink, colors.paper),
          'ink on chrome': (colors.ink, colors.chrome),
          'muted on paper': (colors.muted, colors.paper),
          'muted on chrome': (colors.muted, colors.chrome),
          'action on paper': (colors.actionInk, colors.paper),
          'selected chip': (colors.onActionInk, colors.actionInk),
          'main action': (colors.onBrand, colors.brand),
          'warning': (colors.warnInk, colors.warn),
          'warning on chrome': (colors.warnInk, colors.chrome),
          'error on paper': (colors.error, colors.paper),
          'error notice': (colors.onErrorContainer, colors.errorContainer),
          'summary figure': (colors.onSummary, colors.summary),
          'summary words': (colors.summaryMuted, colors.summary),
        };
        for (final MapEntry(key: pair, value: (fore, back)) in pairs.entries) {
          expect(
            contrast(fore, back),
            greaterThanOrEqualTo(4.5),
            reason: '$name $pair',
          );
        }
      });
    }

    testWidgets('a screen outside a Dura theme fails loudly', (tester) async {
      late Object error;
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              try {
                context.dura;
              } on FlutterError catch (caught) {
                error = caught;
              }
              return const SizedBox();
            },
          ),
        ),
      );
      expect(error.toString(), contains('DuraTheme'));
    });

    test('touch targets are at least 48', () {
      const sizes = DuraSizes();
      for (final size in [sizes.tap, sizes.mainAction, sizes.navItem]) {
        expect(size, greaterThanOrEqualTo(48));
      }
    });
  });

  group('UI-02 type scale', () {
    final text = DuraTheme.light.extension<DuraTokens>()!.text;

    test('figures line up in columns', () {
      for (final style in [
        text.amountHero,
        text.amountLarge,
        text.amountMedium,
        text.price,
        text.actionAmount,
        text.rowValue,
      ]) {
        expect(
          style.fontFeatures,
          contains(const FontFeature.tabularFigures()),
        );
      }
    });

    test('a screen title outranks its body, and the body its notes', () {
      expect(text.display.fontSize, greaterThan(text.title.fontSize!));
      expect(text.title.fontSize, greaterThan(text.body.fontSize!));
      expect(text.body.fontSize, greaterThan(text.small.fontSize!));
    });

    test('plain text in a Material widget uses the Dura body style', () {
      final theme = DuraTheme.light;
      expect(theme.textTheme.bodyMedium!.fontSize, text.body.fontSize);
      expect(theme.textTheme.labelLarge!.fontSize, text.label.fontSize);
    });
  });

  group('UI-03 window sizes', () {
    test('widths map to compact, medium and expanded', () {
      expect(DuraWindow.forWidth(320), DuraWindow.compact);
      expect(DuraWindow.forWidth(599), DuraWindow.compact);
      expect(DuraWindow.forWidth(600), DuraWindow.medium);
      expect(DuraWindow.forWidth(839), DuraWindow.medium);
      expect(DuraWindow.forWidth(840), DuraWindow.expanded);
      expect(DuraWindow.compact.hasRail, isFalse);
      expect(DuraWindow.medium.hasRail, isTrue);
    });

    Future<Rect> firstLine(WidgetTester tester, Size size) async {
      setSurface(tester, size);
      await tester.pumpWidget(
        duraHarness(const DuraPage(children: [Text('First line')])),
      );
      return tester.getRect(find.text('First line'));
    }

    testWidgets('narrow phones get the narrow side margin', (tester) async {
      expect((await firstLine(tester, const Size(320, 600))).left, 15);
      expect((await firstLine(tester, const Size(390, 600))).left, 20);
    });

    testWidgets('a wide window keeps one readable column', (tester) async {
      final line = await firstLine(tester, const Size(1200, 800));
      const width = DuraSizes();
      expect(line.left, (1200 - width.contentWidth) / 2 + 20);
    });
  });
}
