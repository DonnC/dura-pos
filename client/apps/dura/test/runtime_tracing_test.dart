// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_core/dura_core.dart';
import 'package:dura_pos/app/install_error_tracing.dart';
import 'package:dura_pos/app/runtime_tracing_provider.dart';
import 'package:dura_pos/features/diagnostics/diagnostic_store_provider.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/fake_diagnostic_store.dart';

final class CapturingDiagnostics implements Diagnostics {
  final records = <(String, Map<String, Object?>)>[];

  @override
  Future<void> record(
    String event, {
    String? traceId,
    Map<String, Object?> fields = const {},
  }) async => records.add((event, fields));
}

void main() {
  group('APP-02 crash capture', () {
    test('disposing tracing restores app-global handlers', () {
      final previousFlutter = FlutterError.onError;
      final previousPlatform = PlatformDispatcher.instance.onError;
      final container = ProviderContainer(
        overrides: [
          diagnosticStoreProvider.overrideWithValue(FakeDiagnosticStore()),
        ],
      );
      final subscription = container.listen(runtimeTracingProvider, (_, _) {});
      expect(FlutterError.onError, isNot(same(previousFlutter)));
      subscription.close();
      container.dispose();
      expect(FlutterError.onError, same(previousFlutter));
      expect(PlatformDispatcher.instance.onError, same(previousPlatform));
    });

    test('a framework error is written with frames, screen and trail', () {
      final logs = CapturingDiagnostics();
      final trail = Breadcrumbs()
        ..add('SELL-01')
        ..add('SHOP-01');
      final previous = FlutterError.onError;
      // Keep the test's own output quiet while the handler is installed.
      FlutterError.onError = (_) {};
      final restore = installErrorTracing(logs, trail: trail);
      FlutterError.onError!(
        FlutterErrorDetails(
          exception: StateError('Tariro owes USD 14.50'),
          stack: StackTrace.fromString(
            '#0      ShopTab.build '
            '(package:dura_pos/features/shop/shop_tab.dart:27:5)\n'
            '#1      main (file:///data/user/0/private.dart:1:1)',
          ),
        ),
      );
      restore();
      FlutterError.onError = previous;

      final (event, fields) = logs.records.single;
      expect(event, 'runtime.error');
      expect(fields['errorType'], 'StateError');
      expect(fields['code'], ErrorSources.flutter);
      expect(fields['frames'], [
        'ShopTab.build (dura_pos/features/shop/shop_tab.dart:27)',
      ]);
      expect(fields['screen'], 'SHOP-01');
      expect(fields['trail'], ['SELL-01', 'SHOP-01']);
      expect(fields.toString(), isNot(contains('Tariro')));
      expect(fields.toString(), isNot(contains('private')));
    });

    test('an uncaught async error is told apart from a framework one', () {
      final logs = CapturingDiagnostics();
      final restore = installErrorTracing(logs);
      PlatformDispatcher.instance.onError!(
        const FormatException('bad amount'),
        StackTrace.empty,
      );
      restore();
      final (_, fields) = logs.records.single;
      expect(fields['code'], ErrorSources.uncaught);
      expect(fields['errorType'], 'FormatException');
      expect(fields.containsKey('screen'), isFalse);
    });
  });
}
