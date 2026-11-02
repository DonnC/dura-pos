// Maintained by the Dura POS contributors.
import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'font_harness.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(loadGoldenFonts);
  for (final brightness in Brightness.values) {
    for (final scale in [1.0, 2.0]) {
      testWidgets('shared controls ${brightness.name} at text scale $scale', (
        tester,
      ) async {
        tester.view.physicalSize = const Size(320, 640);
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        await tester.pumpWidget(
          MaterialApp(
            theme:
                (brightness == Brightness.light
                        ? DuraTheme.light
                        : DuraTheme.dark)
                    .copyWith(platform: TargetPlatform.android),
            home: MediaQuery(
              data: MediaQueryData(textScaler: TextScaler.linear(scale)),
              child: Scaffold(
                body: Padding(
                  padding: const EdgeInsets.all(DuraSpacing.medium),
                  child: Column(
                    children: [
                      const DuraTextField(label: 'Business name'),
                      const SizedBox(height: DuraSpacing.medium),
                      DuraButton(label: 'Continue', onPressed: () {}),
                      const DuraButton(label: 'Not configured'),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
        await expectLater(
          find.byType(Scaffold),
          matchesGoldenFile('goldens/controls_${brightness.name}_$scale.png'),
        );
      });
    }
  }
}
