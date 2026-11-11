// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:ui' show Tristate;

import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'font_harness.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(loadGoldenFonts);

  group('UI-04 buttons', () {
    testWidgets('a disabled button never runs; an enabled one runs once', (
      tester,
    ) async {
      var calls = 0;
      await tester.pumpWidget(
        duraHarness(
          Column(
            children: [
              const DuraButton(label: 'Disabled'),
              DuraButton(label: 'Continue', onPressed: () => calls++),
            ],
          ),
        ),
      );
      await tester.tap(find.text('Disabled'));
      expect(calls, 0);
      await tester.tap(find.text('Continue'));
      expect(calls, 1);
      final disabled = tester.getSemantics(find.byType(FilledButton).first);
      expect(disabled.flagsCollection.isEnabled, Tristate.isFalse);
    });

    testWidgets('the main action is tall and shows its total with currency', (
      tester,
    ) async {
      await tester.pumpWidget(
        duraHarness(
          DuraButton(
            label: 'Take payment',
            trailing: 'USD 3.50',
            onPressed: () {},
          ),
        ),
      );
      expect(find.text('USD 3.50'), findsOneWidget);
      expect(tester.getSize(find.byType(FilledButton)).height, 56);
      expect(
        find.bySemanticsLabel(RegExp('Take payment.*USD 3.50', dotAll: true)),
        findsOneWidget,
      );
    });

    testWidgets('secondary and quiet buttons keep a 48 touch target', (
      tester,
    ) async {
      await tester.pumpWidget(
        duraHarness(
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DuraButton.secondary(label: 'Exact', onPressed: () {}),
              DuraButton.quiet(
                label: 'Back',
                icon: Icons.arrow_back,
                onPressed: () {},
              ),
            ],
          ),
        ),
      );
      expect(tester.getSize(find.byType(OutlinedButton)).height, 48);
      expect(tester.getSize(find.byType(TextButton)).height, 48);
    });

    testWidgets('keyboard focus draws a thick ring', (tester) async {
      await tester.pumpWidget(
        duraHarness(DuraButton(label: 'Continue', onPressed: () {})),
      );
      final button = tester.widget<FilledButton>(find.byType(FilledButton));
      final focused = button.style!.side!.resolve({WidgetState.focused})!;
      final rest = button.style!.side!.resolve({})!;
      expect(focused.width, const DuraSizes().focusRing);
      expect(rest.width, lessThan(focused.width));
    });
  });

  group('UI-08 chips', () {
    testWidgets('the selected chip says so, and a tap selects', (tester) async {
      var picked = '';
      await tester.pumpWidget(
        duraHarness(
          Row(
            children: [
              DuraChip(
                label: 'Favourites',
                selected: true,
                onSelected: () => picked = 'Favourites',
              ),
              DuraChip(
                label: 'Drinks',
                selected: false,
                onSelected: () => picked = 'Drinks',
              ),
            ],
          ),
        ),
      );
      final selected = tester.getSemantics(find.byType(DuraChip).first);
      expect(selected.flagsCollection.isSelected, Tristate.isTrue);
      expect(selected.label, 'Favourites');
      await tester.tap(find.text('Drinks'));
      expect(picked, 'Drinks');
      expect(tester.getSize(find.byType(DuraChip).last).height, 48);
    });
  });

  group('UI-13 navigation', () {
    const items = [
      DuraNavItem(icon: Icons.shopping_basket_outlined, label: 'Sell'),
      DuraNavItem(icon: Icons.inventory_2_outlined, label: 'Stock'),
      DuraNavItem(icon: Icons.account_balance_wallet_outlined, label: 'Money'),
      DuraNavItem(icon: Icons.storefront_outlined, label: 'My shop'),
    ];

    testWidgets('the bar marks the current place and reports taps', (
      tester,
    ) async {
      var chosen = -1;
      await tester.pumpWidget(
        duraHarness(
          Align(
            alignment: Alignment.bottomCenter,
            child: DuraNavBar(
              items: items,
              selectedIndex: 0,
              onSelected: (index) => chosen = index,
            ),
          ),
        ),
      );
      final sell = tester.getSemantics(find.byType(DuraNavButton).first);
      expect(sell.flagsCollection.isSelected, Tristate.isTrue);
      await tester.tap(find.text('Money'));
      expect(chosen, 2);
      final button = tester.getSize(find.byType(DuraNavButton).first).height;
      expect(button, greaterThanOrEqualTo(56));
      // The bar keeps to its content; it must not take the screen.
      expect(tester.getSize(find.byType(DuraNavBar)).height, lessThan(100));
    });

    testWidgets('the rail offers the same places', (tester) async {
      var chosen = -1;
      await tester.pumpWidget(
        duraHarness(
          Row(
            children: [
              DuraNavRail(
                items: items,
                selectedIndex: 3,
                onSelected: (index) => chosen = index,
              ),
            ],
          ),
        ),
      );
      await tester.tap(find.text('Stock'));
      expect(chosen, 1);
      final shop = tester.getSemantics(find.byType(DuraNavButton).last);
      expect(shop.flagsCollection.isSelected, Tristate.isTrue);
    });
  });

  group('UI-16 toggle row', () {
    testWidgets('a tap anywhere on the row changes the setting', (
      tester,
    ) async {
      bool? changed;
      await tester.pumpWidget(
        duraHarness(
          DuraToggleRow(
            title: 'Customer accounts',
            subtitle: 'Keep balances for trusted regulars',
            value: false,
            onChanged: (value) => changed = value,
          ),
        ),
      );
      await tester.tap(find.text('Keep balances for trusted regulars'));
      expect(changed, isTrue);
    });

    testWidgets('without a handler the row cannot change', (tester) async {
      await tester.pumpWidget(
        duraHarness(const DuraToggleRow(title: 'Fiscal receipts', value: true)),
      );
      await tester.tap(find.text('Fiscal receipts'));
      final row = tester.getSemantics(find.byType(Switch));
      expect(row.flagsCollection.isEnabled, Tristate.isFalse);
    });
  });

  group('UI-17 confirmation', () {
    Future<bool?> answer(WidgetTester tester, String choice) async {
      bool? result;
      await tester.pumpWidget(
        duraHarness(
          Builder(
            builder: (context) => DuraButton(
              label: 'Share diagnostics',
              onPressed: () async {
                result = await showDuraConfirmation(
                  context,
                  title: 'Share local logs?',
                  message: 'Only share with someone you trust.',
                  confirmLabel: 'Share',
                  cancelLabel: 'Not now',
                );
              },
            ),
          ),
        ),
      );
      await tester.tap(find.text('Share diagnostics'));
      await tester.pumpAndSettle();
      await tester.tap(find.text(choice));
      await tester.pumpAndSettle();
      return result;
    }

    testWidgets('cancelling never authorises the operation', (tester) async {
      expect(await answer(tester, 'Not now'), isFalse);
    });

    testWidgets('confirming returns yes', (tester) async {
      expect(await answer(tester, 'Share'), isTrue);
    });
  });
}
