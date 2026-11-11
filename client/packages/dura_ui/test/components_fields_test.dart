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

  group('UI-05 text field', () {
    testWidgets('the label and the error are read with the field', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        duraHarness(
          const DuraTextField(
            label: 'Shop name',
            hint: "e.g. Chipo's corner shop",
            errorText: 'Enter the shop name',
          ),
        ),
      );
      expect(find.text('Shop name'), findsOneWidget);
      expect(find.text('Enter the shop name'), findsOneWidget);
      expect(
        find.bySemanticsLabel(
          RegExp('Shop name.*Enter the shop name', dotAll: true),
        ),
        findsOneWidget,
      );
      handle.dispose();
    });

    testWidgets('typing reaches the feature', (tester) async {
      final controller = TextEditingController();
      addTearDown(controller.dispose);
      String? typed;
      await tester.pumpWidget(
        duraHarness(
          DuraTextField(
            label: 'Shop name',
            controller: controller,
            onChanged: (text) => typed = text,
          ),
        ),
      );
      await tester.enterText(find.byType(TextField), 'Tariro Tuck Shop');
      expect(typed, 'Tariro Tuck Shop');
      expect(controller.text, 'Tariro Tuck Shop');
      expect(
        tester.getSize(find.byType(TextField)).height,
        greaterThanOrEqualTo(48),
      );
    });
  });

  group('UI-06 amount field', () {
    Future<TextEditingController> typeInto(
      WidgetTester tester,
      String typed, {
      int decimals = 2,
    }) async {
      final controller = TextEditingController();
      addTearDown(controller.dispose);
      await tester.pumpWidget(
        duraHarness(
          DuraAmountField(
            label: 'Cash received',
            currency: 'USD',
            controller: controller,
            decimals: decimals,
          ),
        ),
      );
      await tester.enterText(find.byType(TextField), typed);
      return controller;
    }

    testWidgets('the currency is always shown with the label', (tester) async {
      await typeInto(tester, '5');
      expect(find.text('Cash received · USD'), findsOneWidget);
      expect(find.text('USD'), findsOneWidget);
    });

    testWidgets('only figures, with at most the currency\'s decimals', (
      tester,
    ) async {
      expect((await typeInto(tester, '12.345')).text, '12.34');
      expect((await typeInto(tester, 'abc')).text, '');
      expect((await typeInto(tester, '5.0.0')).text, '5.0');
    });

    testWidgets('a whole-unit currency takes no decimal point', (tester) async {
      expect((await typeInto(tester, '25.5', decimals: 0)).text, '25');
    });

    testWidgets('a short amount explains what to correct', (tester) async {
      await tester.pumpWidget(
        duraHarness(
          const DuraAmountField(
            label: 'Cash received',
            currency: 'USD',
            errorText: 'Cash received is less than USD 3.50',
          ),
        ),
      );
      final error = tester.getSemantics(
        find.text('Cash received is less than USD 3.50'),
      );
      expect(error, isNotNull);
      expect(
        tester.getSize(find.byType(TextField)).height,
        greaterThanOrEqualTo(const DuraSizes().amountField),
      );
    });
  });
}
