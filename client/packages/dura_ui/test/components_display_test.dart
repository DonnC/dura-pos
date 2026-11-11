// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'font_harness.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(loadGoldenFonts);

  group('UI-07 amount text', () {
    testWidgets('an amount is read with its currency', (tester) async {
      await tester.pumpWidget(
        duraHarness(const DuraAmountText(currency: 'ZWG', amount: '94.50')),
      );
      expect(find.bySemanticsLabel('ZWG 94.50'), findsOneWidget);
    });

    testWidgets('a large figure grows with text size, within limits', (
      tester,
    ) async {
      await tester.pumpWidget(
        duraHarness(
          const DuraAmountText(
            currency: 'USD',
            amount: '86.50',
            size: DuraAmountSize.hero,
          ),
          textScale: 3,
        ),
      );
      final text = tester.widget<RichText>(find.byType(RichText).last);
      expect(text.textScaler.scale(10), 10 * DuraAmountText.largestScale);
    });
  });

  group('UI-09 list row', () {
    testWidgets('a row that opens something says so and shows a chevron', (
      tester,
    ) async {
      var opened = false;
      await tester.pumpWidget(
        duraHarness(
          Column(
            children: [
              DuraListRow(
                title: 'Recent sales',
                subtitle: 'Find a receipt · Returns',
                icon: Icons.receipt_long_outlined,
                onTap: () => opened = true,
              ),
              const DuraListRow(title: 'Expected cash', value: 'USD 70.50'),
            ],
          ),
        ),
      );
      expect(find.byIcon(Icons.chevron_right), findsOneWidget);
      expect(find.text('USD 70.50'), findsOneWidget);
      await tester.tap(find.text('Recent sales'));
      expect(opened, isTrue);
      final row = tester.getSemantics(find.byType(DuraListRow).first);
      expect(row.flagsCollection.isButton, isTrue);
      expect(row.label, contains('Find a receipt'));
    });
  });

  group('UI-10 summary card', () {
    testWidgets('a figure has its words above and its scope below', (
      tester,
    ) async {
      await tester.pumpWidget(
        duraHarness(
          const DuraSummaryCard.amount(
            eyebrow: 'Sales after returns',
            currency: 'USD',
            amount: '86.50',
            footnote: '24 sales · This till only',
          ),
        ),
      );
      expect(find.text('SALES AFTER RETURNS'), findsOneWidget);
      expect(find.bySemanticsLabel('USD 86.50'), findsOneWidget);
      expect(find.text('24 sales · This till only'), findsOneWidget);
    });

    testWidgets('an instruction can take the figure\'s place', (tester) async {
      await tester.pumpWidget(
        duraHarness(
          const DuraSummaryCard.headline(
            eyebrow: 'Before the first customer',
            headline: 'Count your starting cash.',
          ),
        ),
      );
      expect(find.text('Count your starting cash.'), findsOneWidget);
    });
  });

  group('UI-11 notice', () {
    testWidgets('warnings and errors are announced; hints are not', (
      tester,
    ) async {
      await tester.pumpWidget(
        duraHarness(
          const Column(
            children: [
              DuraNotice(message: 'No float? Leave it at zero.'),
              DuraNotice.warning(message: 'Shop total incomplete.'),
              DuraNotice.error(message: 'The shelf could not load.'),
            ],
          ),
        ),
      );
      bool announced(String words) =>
          tester.getSemantics(find.text(words)).flagsCollection.isLiveRegion;
      expect(announced('No float? Leave it at zero.'), isFalse);
      expect(announced('Shop total incomplete.'), isTrue);
      expect(announced('The shelf could not load.'), isTrue);
    });
  });

  group('UI-12 action dock', () {
    testWidgets('holds the main action across the page, inside the margins', (
      tester,
    ) async {
      setSurface(tester, const Size(320, 640));
      await tester.pumpWidget(
        duraHarness(
          DuraPage(
            dock: DuraActionDock(
              children: [DuraButton(label: 'Open till', onPressed: () {})],
            ),
            children: const [Text('Starting cash')],
          ),
        ),
      );
      final button = tester.getRect(find.byType(FilledButton));
      expect(button.left, 15);
      expect(button.right, 320 - 15);
      expect(button.bottom, lessThanOrEqualTo(640));
    });
  });

  group('UI-14 shop header', () {
    Widget header({VoidCallback? onStatusTap, bool attention = false}) =>
        DuraShopHeader(
          mark: const Text('dura'),
          title: "Chipo's corner shop",
          subtitle: 'Front counter · Chipo · Owner',
          avatarLabel: 'C',
          status: attention
              ? '3 sales waiting to upload'
              : 'Practice shop · Saved on this phone',
          statusNeedsAttention: attention,
          onStatusTap: onStatusTap,
        );

    testWidgets('the status is words, and opens its explanation', (
      tester,
    ) async {
      var opened = false;
      await tester.pumpWidget(
        duraHarness(header(attention: true, onStatusTap: () => opened = true)),
      );
      expect(find.text('3 sales waiting to upload'), findsOneWidget);
      await tester.tap(find.text('3 sales waiting to upload'));
      expect(opened, isTrue);
      final name = tester.getSemantics(find.text("Chipo's corner shop"));
      expect(name.flagsCollection.isHeader, isTrue);
    });

    testWidgets('at large text the wordmark steps aside', (tester) async {
      await tester.pumpWidget(duraHarness(header()));
      expect(find.text('dura'), findsOneWidget);
      await tester.pumpWidget(duraHarness(header(), textScale: 2));
      expect(find.text('dura'), findsNothing);
      expect(find.text("Chipo's corner shop"), findsOneWidget);
    });
  });

  group('UI-15 page heading', () {
    testWidgets('the title is a heading, and Back returns', (tester) async {
      var back = false;
      await tester.pumpWidget(
        duraHarness(
          DuraPageHeading(
            title: 'Take payment',
            subtitle: 'Walk-in customer · 3 items',
            backLabel: 'Back',
            onBack: () => back = true,
          ),
        ),
      );
      final title = tester.getSemantics(find.text('Take payment'));
      expect(title.flagsCollection.isHeader, isTrue);
      await tester.tap(find.text('Back'));
      expect(back, isTrue);
    });
  });
}
