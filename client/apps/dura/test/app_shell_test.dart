// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_core/dura_core.dart';
import 'package:dura_pos/app/app_copy.dart';
import 'package:dura_pos/app/shell/shell_role.dart';
import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/fonts.dart';
import 'support/recording_analytics.dart';
import 'support/shell_harness.dart';

void setSurface(WidgetTester tester, Size size) {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(loadAppFonts);

  group('APP-01 app shell', () {
    testWidgets('opens on Sell, under the shop header', (tester) async {
      setSurface(tester, const Size(390, 800));
      final analytics = RecordingAnalytics();
      await tester.pumpWidget(shellApp(analytics: analytics));
      await tester.pumpAndSettle();
      expect(find.text(AppCopy.sellTitle), findsOneWidget);
      expect(find.text(AppCopy.noShopYet), findsOneWidget);
      expect(find.byType(DuraNavBar), findsOneWidget);
      expect(find.byType(DuraNavRail), findsNothing);
      expect(
        analytics.named(AnalyticsEvents.screenViewed, AnalyticsFields.screen),
        ['SELL-01'],
      );
    });

    testWidgets('each tab opens its own screen and is recorded', (
      tester,
    ) async {
      setSurface(tester, const Size(390, 800));
      final analytics = RecordingAnalytics();
      final trail = Breadcrumbs();
      await tester.pumpWidget(shellApp(analytics: analytics, trail: trail));
      await tester.pumpAndSettle();
      for (final (tab, title) in [
        (AppCopy.stock, AppCopy.stockTitle),
        (AppCopy.money, AppCopy.moneyTitle),
        (AppCopy.myShop, AppCopy.shopTitle),
        (AppCopy.sell, AppCopy.sellTitle),
      ]) {
        await tester.tap(find.text(tab));
        await tester.pumpAndSettle();
        expect(find.text(title), findsOneWidget, reason: tab);
      }
      expect(
        analytics.named(AnalyticsEvents.tabSelected, AnalyticsFields.tab),
        ['STOCK-01', 'MONEY-01', 'SHOP-01', 'SELL-01'],
      );
      expect(trail.trail, [
        'SELL-01',
        'STOCK-01',
        'MONEY-01',
        'SHOP-01',
        'SELL-01',
      ]);
    });

    testWidgets('a seller sees their own till and their own access', (
      tester,
    ) async {
      setSurface(tester, const Size(390, 800));
      await tester.pumpWidget(
        shellApp(analytics: RecordingAnalytics(), role: ShellRole.seller),
      );
      await tester.pumpAndSettle();
      expect(find.text(AppCopy.money), findsNothing);
      await tester.tap(find.text(AppCopy.myTill));
      await tester.pumpAndSettle();
      expect(find.text(AppCopy.tillTitle), findsOneWidget);
      await tester.tap(find.text(AppCopy.me));
      await tester.pumpAndSettle();
      expect(find.text(AppCopy.meTitle), findsOneWidget);
    });

    testWidgets('a wide window moves the destinations to a side rail', (
      tester,
    ) async {
      setSurface(tester, const Size(1024, 700));
      await tester.pumpWidget(shellApp(analytics: RecordingAnalytics()));
      await tester.pumpAndSettle();
      expect(find.byType(DuraNavRail), findsOneWidget);
      expect(find.byType(DuraNavBar), findsNothing);
      await tester.tap(find.text(AppCopy.stock));
      await tester.pumpAndSettle();
      expect(find.text(AppCopy.stockTitle), findsOneWidget);
    });

    testWidgets('every tab fits 320 wide at double text size', (tester) async {
      setSurface(tester, const Size(320, 640));
      await tester.pumpWidget(
        shellApp(analytics: RecordingAnalytics(), textScale: 2),
      );
      await tester.pumpAndSettle();
      for (final tab in [AppCopy.stock, AppCopy.money, AppCopy.myShop]) {
        await tester.tap(find.text(tab).last);
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull, reason: tab);
      }
    });
  });

  group('SELL-01 STOCK-01 MONEY-01 SHOP-01 tab shells', () {
    testWidgets('each says plainly that its work opens later', (tester) async {
      setSurface(tester, const Size(390, 800));
      await tester.pumpWidget(shellApp(analytics: RecordingAnalytics()));
      await tester.pumpAndSettle();
      expect(find.text(AppCopy.sellLater), findsOneWidget);
      await tester.tap(find.text(AppCopy.stock));
      await tester.pumpAndSettle();
      expect(find.text(AppCopy.stockLater), findsOneWidget);
      // No button pretends to work.
      expect(find.byType(DuraButton), findsNothing);
    });

    testWidgets('My shop leads to problem reports and back', (tester) async {
      setSurface(tester, const Size(390, 800));
      final analytics = RecordingAnalytics();
      await tester.pumpWidget(shellApp(analytics: analytics));
      await tester.pumpAndSettle();
      await tester.tap(find.text(AppCopy.myShop));
      await tester.pumpAndSettle();
      await tester.tap(find.text(AppCopy.problemReports));
      await tester.pumpAndSettle();
      expect(find.text(AppCopy.diagnostics), findsOneWidget);
      expect(find.byType(DuraNavBar), findsOneWidget);
      await tester.tap(find.text(AppCopy.back));
      await tester.pumpAndSettle();
      expect(find.text(AppCopy.shopTitle), findsOneWidget);
      expect(
        analytics.named(AnalyticsEvents.screenViewed, AnalyticsFields.screen),
        ['SELL-01', 'SHOP-01', 'SHOP-13', 'SHOP-01'],
      );
    });
  });

  group('APP-01 SELL-01 SHOP-01 shell goldens', () {
    for (final (brightness, size, scale) in [
      (Brightness.light, const Size(320, 640), 1.0),
      (Brightness.dark, const Size(320, 640), 1.0),
      (Brightness.light, const Size(320, 900), 2.0),
      (Brightness.light, const Size(1024, 700), 1.0),
    ]) {
      final name = '${brightness.name}_${size.width.toInt()}_$scale';
      testWidgets('shell $name', (tester) async {
        setSurface(tester, size);
        await tester.pumpWidget(
          shellApp(
            analytics: RecordingAnalytics(),
            brightness: brightness,
            textScale: scale,
          ),
        );
        await tester.pumpAndSettle();
        await expectLater(
          find.byType(MaterialApp),
          matchesGoldenFile('goldens/app_shell_$name.png'),
        );
      });
    }
  });
}
