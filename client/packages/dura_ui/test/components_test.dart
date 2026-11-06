// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(DuraTheme.prepareFonts);
  testWidgets(
    'disabled actions cannot execute and enabled actions execute once',
    (tester) async {
      var calls = 0;
      await tester.pumpWidget(
        MaterialApp(
          theme: DuraTheme.light,
          home: Scaffold(
            body: Column(
              children: [
                const DuraButton(label: 'Disabled'),
                DuraButton(label: 'Continue', onPressed: () => calls++),
              ],
            ),
          ),
        ),
      );
      await tester.tap(find.text('Disabled'));
      expect(calls, 0);
      await tester.tap(find.text('Continue'));
      expect(calls, 1);
    },
  );

  testWidgets('fields expose labels and feature validation', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: DuraTheme.light,
        home: const Scaffold(
          body: DuraTextField(
            label: 'Business name',
            errorText: 'Enter a business name',
          ),
        ),
      ),
    );
    expect(find.text('Business name'), findsOneWidget);
    expect(find.text('Enter a business name'), findsOneWidget);
  });

  testWidgets('confirmation cancellation never authorises the operation', (
    tester,
  ) async {
    bool? result;
    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) => Scaffold(
            body: DuraButton(
              label: 'Share diagnostics',
              onPressed: () async {
                result = await showDuraConfirmation(
                  context,
                  title: 'Share local logs?',
                  message: 'Only share with someone you trust.',
                  confirmLabel: 'Share',
                );
              },
            ),
          ),
        ),
      ),
    );
    await tester.tap(find.text('Share diagnostics'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();
    expect(result, isFalse);
  });
}
