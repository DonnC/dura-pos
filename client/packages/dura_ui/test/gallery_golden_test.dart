// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'font_harness.dart';

/// Reviewed images of every component, at the smallest phone width, in light
/// and dark, at normal and doubled text. Each gallery names the tracker IDs it
/// covers (`handbook/design/ui-tracker.md`).
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(loadGoldenFonts);

  final galleries = <String, (String, List<Widget> Function())>{
    'actions': ('UI-04 UI-08 UI-16', _actions),
    'fields': ('UI-05 UI-06', _fields),
    'figures': ('UI-07 UI-09 UI-10 UI-11', _figures),
  };

  for (final MapEntry(key: name, value: (ids, build)) in galleries.entries) {
    for (final brightness in Brightness.values) {
      for (final scale in [1.0, 2.0]) {
        testWidgets('$name gallery ($ids) ${brightness.name} 320 at $scale', (
          tester,
        ) async {
          setSurface(tester, Size(320, scale == 1 ? 760 : 1500));
          await tester.pumpWidget(
            duraHarness(
              brightness: brightness,
              textScale: scale,
              Builder(
                builder: (context) => Padding(
                  padding: EdgeInsets.all(context.dura.space.narrowGutter),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: build(),
                  ),
                ),
              ),
            ),
          );
          await tester.pumpAndSettle();
          expect(tester.takeException(), isNull);
          await expectLater(
            find.byType(Scaffold),
            matchesGoldenFile(
              'goldens/ui_${name}_${brightness.name}_320_$scale.png',
            ),
          );
        });
      }
    }
  }

  for (final brightness in Brightness.values) {
    for (final scale in [1.0, 2.0]) {
      testWidgets(
        'chrome gallery (UI-12 UI-13 UI-14 UI-15) ${brightness.name} 320 '
        'at $scale',
        (tester) async {
          setSurface(tester, Size(320, scale == 1 ? 640 : 900));
          await tester.pumpWidget(
            duraHarness(
              brightness: brightness,
              textScale: scale,
              scaffold: false,
              const _Chrome(rail: false),
            ),
          );
          await tester.pumpAndSettle();
          expect(tester.takeException(), isNull);
          await expectLater(
            find.byType(Scaffold),
            matchesGoldenFile(
              'goldens/ui_chrome_${brightness.name}_320_$scale.png',
            ),
          );
        },
      );
    }
    testWidgets('tablet chrome (UI-03 UI-13) ${brightness.name} 1024 at 1.0', (
      tester,
    ) async {
      setSurface(tester, const Size(1024, 640));
      await tester.pumpWidget(
        duraHarness(
          brightness: brightness,
          scaffold: false,
          const _Chrome(rail: true),
        ),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      await expectLater(
        find.byType(Scaffold),
        matchesGoldenFile('goldens/ui_chrome_${brightness.name}_1024_1.0.png'),
      );
    });
  }
}

const _items = [
  DuraNavItem(icon: Icons.shopping_basket_outlined, label: 'Sell'),
  DuraNavItem(icon: Icons.inventory_2_outlined, label: 'Stock'),
  DuraNavItem(icon: Icons.account_balance_wallet_outlined, label: 'Money'),
  DuraNavItem(icon: Icons.storefront_outlined, label: 'My shop'),
];

class _Chrome extends StatelessWidget {
  const _Chrome({required this.rail});
  final bool rail;

  @override
  Widget build(BuildContext context) {
    final page = Column(
      children: [
        const DuraShopHeader(
          mark: Text('dura'),
          title: "Chipo's corner shop",
          subtitle: 'Front counter · Chipo · Owner',
          avatarLabel: 'C',
          status: 'Practice shop · Saved on this phone',
          onStatusTap: _none,
        ),
        Expanded(
          child: DuraPage(
            dock: const DuraActionDock(
              children: [
                DuraButton(
                  label: 'Take payment',
                  trailing: 'USD 3.50',
                  onPressed: _none,
                ),
              ],
            ),
            children: [
              DuraPageHeading(
                title: 'Take payment',
                subtitle: 'Walk-in customer · 3 items',
                backLabel: 'Back',
                onBack: () {},
              ),
            ],
          ),
        ),
      ],
    );
    return Scaffold(
      body: rail
          ? Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                DuraNavRail(
                  items: _items,
                  selectedIndex: 0,
                  onSelected: (_) {},
                ),
                Expanded(child: page),
              ],
            )
          : page,
      bottomNavigationBar: rail
          ? null
          : DuraNavBar(items: _items, selectedIndex: 0, onSelected: (_) {}),
    );
  }
}

void _none() {}

List<Widget> _actions() => [
  const DuraButton(
    label: 'Take payment',
    trailing: 'USD 3.50',
    onPressed: _none,
  ),
  const SizedBox(height: 8),
  const DuraButton(label: 'Review cash-up'),
  const SizedBox(height: 8),
  const Row(
    children: [
      Expanded(
        child: DuraButton.secondary(
          label: 'Exact',
          onPressed: _none,
          expand: true,
        ),
      ),
      SizedBox(width: 8),
      Expanded(
        child: DuraButton.secondary(
          label: 'USD 5.00',
          onPressed: _none,
          expand: true,
        ),
      ),
    ],
  ),
  const Align(
    alignment: Alignment.centerLeft,
    child: DuraButton.quiet(
      label: 'Sell an unlisted item',
      icon: Icons.add,
      onPressed: _none,
    ),
  ),
  const Wrap(
    spacing: 8,
    runSpacing: 8,
    children: [
      DuraChip(label: 'Favourites', selected: true, onSelected: _none),
      DuraChip(label: 'All items', selected: false, onSelected: _none),
      DuraChip(label: 'Drinks', selected: false, onSelected: _none),
    ],
  ),
  DuraToggleRow(
    title: 'Customer accounts',
    subtitle: 'Keep balances for trusted regulars',
    value: true,
    onChanged: (_) {},
  ),
  DuraToggleRow(
    title: 'Mobile money',
    subtitle: 'Show provider checkout',
    value: false,
    onChanged: (_) {},
  ),
];

List<Widget> _fields() => [
  const DuraTextField(label: 'Shop name', hint: "e.g. Chipo's corner shop"),
  const SizedBox(height: 16),
  const DuraTextField(
    label: 'What was it for?',
    hint: 'e.g. Bus fare to buy stock',
    errorText: 'Say what the money was for',
  ),
  const SizedBox(height: 16),
  const DuraAmountField(label: 'Cash received', currency: 'USD', hint: '0.00'),
  const SizedBox(height: 16),
  const DuraAmountField(
    label: 'Starting cash',
    currency: 'ZWG',
    hint: '0.00',
    errorText: 'Enter an amount, or 0 for no float',
  ),
];

List<Widget> _figures() => [
  const DuraAmountText(
    currency: 'USD',
    amount: '3.50',
    size: DuraAmountSize.hero,
  ),
  const DuraAmountText(
    currency: 'USD',
    amount: '1.50',
    size: DuraAmountSize.medium,
  ),
  const DuraAmountText(currency: 'ZAR', amount: '24.00'),
  const SizedBox(height: 12),
  const DuraSummaryCard.amount(
    eyebrow: 'Sales after returns',
    currency: 'USD',
    amount: '86.50',
    footnote: '24 sales · This till only',
  ),
  const SizedBox(height: 12),
  const DuraNotice(message: 'No float? Leave it at zero and start selling.'),
  const DuraNotice.warning(
    message:
        'This phone only · Shop total incomplete. Phone 2 last uploaded '
        'at 08:12.',
  ),
  const SizedBox(height: 8),
  const DuraNotice.error(message: 'The shelf could not load. Try again.'),
  DuraListRow(
    title: 'Recent sales',
    subtitle: 'Find a receipt · Returns',
    icon: Icons.receipt_long_outlined,
    onTap: () {},
  ),
  const DuraListRow(
    title: 'Expected cash',
    subtitle: 'Float + cash in − cash out',
    value: 'USD 70.50',
  ),
];
