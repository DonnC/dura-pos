// Maintained by the Dura POS contributors.
import 'dart:async';
import 'dart:io';

import 'package:dura_core/dura_core.dart';
import 'package:dura_data/dura_data.dart';
import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../features/diagnostics/diagnostic_providers.dart';
import 'app_copy.dart';
import 'dura_app.dart';

Future<void> bootstrap() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    final support = await getApplicationSupportDirectory();
    final logs = RotatingDiagnostics(
      Directory('${support.path}/${DiagnosticPolicy.logDirectory}'),
    );
    final database = LocalDatabase.open(
      File('${support.path}/${AppStorage.databaseFile}'),
    );
    await SqlitePreferences(database).read(AppStorage.themeKey);
    await logs.record('app.started');
    _installErrorTracing(logs);
    runApp(
      ProviderScope(
        overrides: [
          diagnosticStoreProvider.overrideWithValue(logs),
          shareArchiveProvider.overrideWithValue((archive) async {
            await SharePlus.instance.share(
              ShareParams(files: [XFile(archive)], title: AppCopy.diagnostics),
            );
          }),
        ],
        child: const DuraApp(),
      ),
    );
  } on Exception {
    runApp(
      const MaterialApp(
        home: Scaffold(
          body: SafeArea(
            child: Center(
              child: Padding(
                padding: EdgeInsets.all(DuraSpacing.large),
                child: Text(AppCopy.startupFailed),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

void _installErrorTracing(Diagnostics logs) {
  void trace(Object error) {
    // Never recurse if a full disk also prevents writing the error event.
    unawaited(
      logs
          .record(
            'runtime.error',
            fields: {'errorType': error.runtimeType.toString()},
          )
          .catchError((Object _, StackTrace _) {}),
    );
  }

  FlutterError.onError = (details) {
    trace(details.exception);
    if (kDebugMode) FlutterError.presentError(details);
  };
  PlatformDispatcher.instance.onError = (error, stack) {
    trace(error);
    return false;
  };
}
