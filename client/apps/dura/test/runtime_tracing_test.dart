// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_pos/app/runtime_tracing_provider.dart';
import 'package:dura_pos/features/diagnostics/diagnostic_store_provider.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/fake_diagnostic_store.dart';

void main() {
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
}
