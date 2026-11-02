// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:async';
import 'dart:io';

import 'package:dura_core/dura_core.dart';
import 'package:dura_pos/app/app_copy.dart';
import 'package:dura_pos/features/diagnostics/diagnostic_providers.dart';
import 'package:dura_pos/features/diagnostics/diagnostic_screen.dart';
import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

final class FakeDiagnostics implements DiagnosticStore {
  bool failExport = false;
  int exports = 0;
  Completer<String>? pendingArchive;

  @override
  Future<void> record(
    String event, {
    String? traceId,
    Map<String, Object?> fields = const {},
  }) async {}

  @override
  Future<List<DiagnosticFile>> listFiles() async => const [
    DiagnosticFile(name: 'dura-00000001.jsonl', sizeBytes: 128),
  ];

  @override
  Future<String> createArchive() async {
    if (pendingArchive case final pending?) return pending.future;
    if (failExport) throw const FileSystemException('unsafe internal detail');
    exports++;
    return '/example/support.zip';
  }
}

Widget screen(
  FakeDiagnostics store,
  ShareArchive share, {
  double scale = 1,
  DiagnosticPolicy policy = const DiagnosticPolicy(),
}) => ProviderScope(
  overrides: [
    diagnosticStoreProvider.overrideWithValue(store),
    diagnosticPolicyProvider.overrideWithValue(policy),
    shareArchiveProvider.overrideWithValue(share),
  ],
  child: MaterialApp(
    theme: DuraTheme.light,
    home: MediaQuery(
      data: MediaQueryData(textScaler: TextScaler.linear(scale)),
      child: const DiagnosticScreen(),
    ),
  ),
);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(DuraTheme.prepareFonts);
  testWidgets('shows injected retention limits instead of fixed UI copy', (
    tester,
  ) async {
    await tester.pumpWidget(
      screen(
        FakeDiagnostics(),
        (_) async {},
        policy: const DiagnosticPolicy(maxFiles: 3, maxFileBytes: 1024),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.textContaining('3 files of 1024 bytes'), findsOneWidget);
  });

  testWidgets(
    'export completion after leaving the screen does not update disposed state',
    (tester) async {
      final completion = Completer<String>();
      final store = FakeDiagnostics()..pendingArchive = completion;
      await tester.pumpWidget(screen(store, (_) async {}));
      await tester.pumpAndSettle();
      await tester.tap(find.text(AppCopy.prepareArchive));
      await tester.pump();
      await tester.pumpWidget(const SizedBox.shrink());
      completion.complete('/example/support.zip');
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets('previews files and shares only after explicit confirmation', (
    tester,
  ) async {
    final store = FakeDiagnostics();
    var shares = 0;
    await tester.pumpWidget(screen(store, (_) async => shares++));
    await tester.pumpAndSettle();
    expect(find.text('dura-00000001.jsonl'), findsOneWidget);
    await tester.tap(find.text(AppCopy.prepareArchive));
    await tester.pumpAndSettle();
    expect(store.exports, 1);
    expect(shares, 0);
    await tester.tap(find.text(AppCopy.shareArchive));
    await tester.pumpAndSettle();
    await tester.tap(find.text(AppCopy.cancel));
    await tester.pumpAndSettle();
    expect(shares, 0);
    await tester.tap(find.text(AppCopy.shareArchive));
    await tester.pumpAndSettle();
    await tester.tap(find.text(AppCopy.share));
    await tester.pumpAndSettle();
    expect(shares, 1);
  });

  testWidgets('failed exports expose recovery without leaking raw errors', (
    tester,
  ) async {
    final store = FakeDiagnostics()..failExport = true;
    await tester.pumpWidget(screen(store, (_) async {}));
    await tester.pumpAndSettle();
    await tester.tap(find.text(AppCopy.prepareArchive));
    await tester.pumpAndSettle();
    expect(find.text(AppCopy.archiveFailed), findsOneWidget);
    expect(find.textContaining('unsafe internal detail'), findsNothing);
    store.failExport = false;
    await tester.tap(find.text(AppCopy.prepareArchive));
    await tester.pumpAndSettle();
    expect(find.text(AppCopy.shareArchive), findsOneWidget);
  });

  testWidgets('320px and large text retain readable diagnostic controls', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 720);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(screen(FakeDiagnostics(), (_) async {}, scale: 2));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.text(AppCopy.prepareArchive),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    expect(tester.takeException(), isNull);
    expect(find.text(AppCopy.prepareArchive), findsOneWidget);
  });
}
