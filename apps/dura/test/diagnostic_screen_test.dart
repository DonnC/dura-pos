// Maintained by the Dura POS contributors.
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
    if (failExport) throw const FileSystemException('unsafe internal detail');
    exports++;
    return '/example/support.zip';
  }
}

Widget screen(FakeDiagnostics store, ShareArchive share, {double scale = 1}) =>
    ProviderScope(
      overrides: [
        diagnosticStoreProvider.overrideWithValue(store),
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
