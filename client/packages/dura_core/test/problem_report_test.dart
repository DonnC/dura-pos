// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_core/dura_core.dart';
import 'package:test/test.dart';

const _trace = '''
#0      CashSale.change (package:dura_core/src/sale/cash_sale.dart:48:7)
#1      _PayScreenState.build.<anonymous closure> (package:dura_pos/features/sell/pay_screen.dart:91:22)
#2      _rootRunUnary (dart:async/zone.dart:1538:47)
#3      main (file:///data/user/0/com.example/private/secret_path.dart:5:3)
<asynchronous suspension>
#4      StatelessElement.build (package:flutter/src/widgets/framework.dart:5800:49)
''';

void main() {
  group('APP-02 safe stack frames', () {
    final frames = safeFrames(StackTrace.fromString(_trace));

    test('keeps package frames as function and package line', () {
      expect(frames, [
        'CashSale.change (dura_core/src/sale/cash_sale.dart:48)',
        '_PayScreenState.build.<anonymous closure> '
            '(dura_pos/features/sell/pay_screen.dart:91)',
        'StatelessElement.build (flutter/src/widgets/framework.dart:5800)',
      ]);
    });

    test('drops device paths and SDK frames', () {
      expect(frames.join(), isNot(contains('file:')));
      expect(frames.join(), isNot(contains('secret_path')));
      expect(frames.join(), isNot(contains('zone.dart')));
    });

    test('every frame it keeps passes the record check', () {
      expect(frames.every(safeFramePattern.hasMatch), isTrue);
    });

    test('stops at the limit', () {
      expect(safeFrames(StackTrace.fromString(_trace), limit: 1), hasLength(1));
    });

    test('a symbol-less release trace gives no frames', () {
      const stripped = '''
*** *** *** *** *** *** *** *** *** *** *** *** *** *** *** ***
pid: 1234, tid: 5678, name 1.ui
    #00 abs 000000727b6c39cb virt 00000000001c39cb _kDartIsolateSnapshotInstructions+0x1a7aab
''';
      expect(safeFrames(StackTrace.fromString(stripped)), isEmpty);
    });
  });

  group('APP-02 breadcrumbs', () {
    test('keeps the last steps, oldest first, without repeats', () {
      final crumbs = Breadcrumbs(limit: 3)
        ..add('SELL-01')
        ..add('SELL-01')
        ..add('STOCK-01')
        ..add('MONEY-01')
        ..add('SHOP-01');
      expect(crumbs.trail, ['STOCK-01', 'MONEY-01', 'SHOP-01']);
      expect(crumbs.current, 'SHOP-01');
    });

    test('refuses anything that is not a short identifier', () {
      final crumbs = Breadcrumbs()
        ..add('Tariro owes USD 14.50')
        ..add('/data/user/0/app')
        ..add('');
      expect(crumbs.trail, isEmpty);
      expect(crumbs.current, isNull);
    });
  });

  group('APP-03 analytics names', () {
    final identifier = RegExp(r'^[a-z][a-z0-9_.]{0,63}$');

    test('every event name is a valid, unique identifier', () {
      expect(AnalyticsEvents.all.every(identifier.hasMatch), isTrue);
    });

    test('field names are plain identifiers', () {
      final field = RegExp(r'^[a-z][A-Za-z]{0,31}$');
      expect(AnalyticsFields.all.every(field.hasMatch), isTrue);
    });

    test('recording nothing is always safe', () async {
      await const NoAnalytics().track(AnalyticsEvents.appOpened);
    });
  });
}
